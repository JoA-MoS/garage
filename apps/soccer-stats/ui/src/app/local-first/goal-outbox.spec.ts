import { describe, it, expect, vi } from 'vitest';

import {
  GoalOutbox,
  projectGoals,
  type GoalState,
  type GoalStore,
} from './goal-outbox';

const snapshot = {
  game: { id: 'game', teams: [{ id: 'team', events: [] }] },
} as any;
const input = { gameTeamId: 'team', period: '1', periodSecond: 42 };
function setup() {
  const records = new Map<string, GoalState>();
  const store: GoalStore = {
    read: async (key) => structuredClone(records.get(key)),
    change: async (key, fn) => {
      const next = fn(structuredClone(records.get(key) ?? { actions: [] }));
      records.set(key, structuredClone(next));
      return next;
    },
  };
  const send = vi.fn<
    (input: import('./goal-outbox').GoalInput) => Promise<void>
  >(async () => undefined);
  const fetch = vi.fn(async () => snapshot);
  const outbox = new GoalOutbox('user/game', store, send, fetch);
  return { outbox, store, send, fetch };
}
describe('durable goal outbox', () => {
  it('rejects an older confirmed ingress generation from another client', async () => {
    const s = setup();
    await s.outbox.hydrate(snapshot);
    const b = new GoalOutbox('user/game', s.store, s.send, s.fetch);
    const revision = (await b.load()).revision ?? 0;
    await s.outbox.enqueue(input, 'ack');
    const fresh = {
      game: {
        ...snapshot.game,
        teams: [{ id: 'team', events: [{ id: 'ack' }] }],
      },
    };
    s.fetch.mockResolvedValue(fresh);
    await s.outbox.sync();
    // A delayed server/subscription ingress must carry its pre-I/O generation.
    await b.confirm(snapshot, revision);
    expect((await b.load()).snapshot).toEqual(fresh);
    expect((await b.load()).actions).toEqual([]);
  });

  it.each(['own', 'remote'])(
    'rejects a stale refresh after %s echo, including after reload',
    async (kind) => {
      const s = setup();
      await s.outbox.hydrate(snapshot);
      if (kind === 'own') await s.outbox.enqueue(input, 'echo');
      let resolve!: (v: any) => void;
      s.fetch.mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      );
      const refresh = s.outbox.refresh();
      await vi.waitFor(() => expect(resolve).toBeDefined());
      await s.outbox.confirm(
        {
          game: {
            ...snapshot.game,
            teams: [{ id: 'team', events: [{ id: 'echo' }] }],
          },
        },
        (await s.outbox.load()).revision ?? 0,
      );
      resolve(snapshot);
      await refresh;
      const restored = new GoalOutbox('user/game', s.store, s.send, s.fetch);
      expect(
        (await restored.load()).snapshot?.game.teams?.[0].events?.map(
          (e) => e.id,
        ),
      ).toEqual(['echo']);
      expect((await restored.load()).actions).toEqual([]);
    },
  );
  it('rejects stale post-ACK membership without retiring an unconfirmed action', async () => {
    const s = setup();
    await s.outbox.hydrate(snapshot);
    await s.outbox.enqueue(input, 'action');
    let resolve!: (v: any) => void;
    s.fetch.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const sync = s.outbox.sync();
    await vi.waitFor(() => expect(resolve).toBeDefined());
    await s.outbox.confirm(
      {
        game: {
          ...snapshot.game,
          teams: [{ id: 'team', events: [{ id: 'remote' }] }],
        },
      },
      (await s.outbox.load()).revision ?? 0,
    );
    resolve(snapshot);
    await sync;
    expect(
      (await s.outbox.load()).snapshot?.game.teams?.[0].events?.map(
        (e) => e.id,
      ),
    ).toEqual(['remote']);
    expect((await s.outbox.load()).actions.map((a) => a.id)).toEqual([
      'action',
    ]);
  });
  it('commits before reporting saved; does not await network', async () => {
    const s = setup();
    await s.outbox.hydrate(snapshot);
    s.send.mockImplementation(() => new Promise(() => undefined));
    await s.outbox.enqueue(input, 'action');
    expect((await s.store.read('user/game'))?.actions[0].id).toBe('action');
    expect(
      projectGoals(await s.store.read('user/game'))?.game.teams?.[0].events,
    ).toHaveLength(1);
  });
  it('restores pending work after reload and keeps account/game isolation', async () => {
    const s = setup();
    await s.outbox.hydrate(snapshot);
    await s.outbox.enqueue(input, 'action');
    const restored = new GoalOutbox('user/game', s.store, s.send, s.fetch);
    expect((await restored.load()).actions).toHaveLength(1);
    expect(
      (await new GoalOutbox('other/game', s.store, s.send, s.fetch).load())
        .actions,
    ).toHaveLength(0);
  });
  it('retries lost responses with the same action ID and backs off', async () => {
    const s = setup();
    await s.outbox.hydrate(snapshot);
    await s.outbox.enqueue(input, 'action');
    s.send.mockRejectedValueOnce(new Error('offline'));
    await s.outbox.sync(1000);
    expect((await s.outbox.load()).actions[0].nextAttempt).toBeGreaterThan(
      1000,
    );
    await s.outbox.sync(1001);
    expect(s.send).toHaveBeenCalledTimes(1);
    await s.outbox.sync(100000);
    expect(s.send.mock.calls[0][0].clientActionId).toBe('action');
    expect(s.send.mock.calls[1][0].clientActionId).toBe('action');
    expect((await s.outbox.load()).actions).toHaveLength(0);
  });
  it('keeps later actions behind a transient failure and its backoff', async () => {
    const s = setup();
    await s.outbox.hydrate(snapshot);
    await s.outbox.enqueue(input, 'A');
    await s.outbox.enqueue(input, 'B');
    s.send.mockRejectedValueOnce(new Error('offline'));
    await s.outbox.sync(1000);
    expect(s.send.mock.calls.map(([value]) => value.clientActionId)).toEqual([
      'A',
    ]);
    await s.outbox.sync(1001);
    expect(s.send.mock.calls.map(([value]) => value.clientActionId)).toEqual([
      'A',
    ]);
    await s.outbox.sync(2000);
    expect(s.send.mock.calls.map(([value]) => value.clientActionId)).toEqual([
      'A',
      'A',
      'B',
    ]);
    expect((await s.outbox.load()).actions).toEqual([]);
  });
  it('releases a stalled post-ACK snapshot and ignores its late result after recovery', async () => {
    vi.useFakeTimers();
    try {
      const s = setup();
      await s.outbox.hydrate(snapshot);
      await s.outbox.enqueue(input, 'A');
      let resolve!: (value: any) => void;
      s.fetch.mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      );
      let settled = false;
      const first = s.outbox.sync(1000).then(() => {
        settled = true;
      });
      await vi.advanceTimersByTimeAsync(15001);
      expect(settled).toBe(true);
      await first;
      expect((await s.outbox.load()).actions.map((a) => a.id)).toEqual(['A']);
      await s.outbox.sync(100000);
      expect((await s.outbox.load()).actions).toEqual([]);
      resolve({
        game: {
          ...snapshot.game,
          teams: [{ id: 'team', events: [{ id: 'stale' }] }],
        },
      });
      await vi.advanceTimersByTimeAsync(0);
      expect((await s.outbox.load()).snapshot).toEqual(snapshot);
    } finally {
      vi.useRealTimers();
    }
  });
  it('incoming other-phone events preserve local pending goals and own echo does not duplicate', async () => {
    const s = setup();
    await s.outbox.hydrate(snapshot);
    await s.outbox.enqueue(input, 'action');
    await s.outbox.enqueue(input, 'still-pending');
    const incoming = {
      game: {
        ...snapshot.game,
        teams: [{ id: 'team', events: [{ id: 'remote' }, { id: 'action' }] }],
      },
    } as any;
    await s.outbox.confirm(incoming, (await s.outbox.load()).revision ?? 0);
    expect(
      projectGoals(await s.outbox.load())?.game.teams?.[0].events,
    ).toHaveLength(3);
    expect((await s.outbox.load()).actions.map((a) => a.id)).toEqual([
      'still-pending',
    ]);
  });
  it('does not retire acknowledgement until snapshot is committed; reload retries safely', async () => {
    const s = setup();
    await s.outbox.hydrate(snapshot);
    await s.outbox.enqueue(input, 'action');
    s.fetch.mockRejectedValueOnce(new Error('snapshot lost'));
    await s.outbox.sync(1000);
    expect((await s.outbox.load()).actions).toHaveLength(1);
    await s.outbox.sync(100000);
    expect((await s.outbox.load()).actions).toHaveLength(0);
  });
  it.each([
    'BAD_REQUEST',
    'BAD_USER_INPUT',
    'FORBIDDEN',
    'UNAUTHENTICATED',
    'NOT_FOUND',
  ])(
    'terminal rejection %s is retained for retry or discard and not counted in score',
    async (code) => {
      const s = setup();
      await s.outbox.hydrate(snapshot);
      await s.outbox.enqueue(input, 'action');
      s.send.mockRejectedValueOnce({
        errors: [{ extensions: { code } }],
        message: 'invalid scorer',
      });
      await s.outbox.sync(1000);
      expect((await s.outbox.load()).actions[0].status).toBe('needs-attention');
      expect(
        projectGoals(await s.outbox.load())?.game.teams?.[0].events,
      ).toHaveLength(0);
      await s.outbox.retry('action');
      await s.outbox.sync(2000);
      expect((await s.outbox.load()).actions).toHaveLength(0);
    },
  );
  it('storage failure never reports a goal as saved', async () => {
    const s = setup();
    await s.outbox.hydrate(snapshot);
    s.store.change = async () => {
      throw new Error('quota');
    };
    await expect(s.outbox.enqueue(input, 'action')).rejects.toThrow('quota');
    expect((await s.store.read('user/game'))?.actions).toHaveLength(0);
  });
  it('requires a confirmed snapshot before accepting local work', async () => {
    await expect(setup().outbox.enqueue(input, 'action')).rejects.toThrow(
      'snapshot',
    );
  });
});

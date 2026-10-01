import { describe, it, expect, vi } from 'vitest';

import {
  GoalOutbox,
  isTerminalSyncError,
  projectGoals,
  type GoalInput,
  type GoalStore,
  type OutboxState,
  type PendingGoal,
} from './goal-outbox';

const confirmed = (...ids: string[]) =>
  ({
    game: {
      id: 'game',
      teams: [{ id: 'team', events: ids.map((id) => ({ id })) }],
    },
  }) as any;
const input = { gameTeamId: 'team', period: '1', periodSecond: 42 };
const graphQLError = (code: string, message = code) => ({
  message,
  errors: [{ extensions: { code } }],
});

function setup(scope = 'user/game', records = new Map<string, OutboxState>()) {
  const store: GoalStore = {
    read: async (key) => structuredClone(records.get(key)),
    change: async (key, fn) => {
      const next = fn(structuredClone(records.get(key) ?? { actions: [] }));
      records.set(key, structuredClone(next));
      return next;
    },
  };
  const send = vi.fn<(input: GoalInput) => Promise<unknown>>(
    async () => undefined,
  );
  const confirm = vi.fn<() => Promise<unknown>>(async () => undefined);
  const changed = vi.fn();
  let active = true;
  const outbox = new GoalOutbox(
    scope,
    store,
    send,
    confirm,
    changed,
    () => active,
  );
  const ids = async () => (await outbox.load()).actions.map((a) => a.id);
  return {
    outbox,
    store,
    records,
    send,
    confirm,
    changed,
    ids,
    deactivate: () => {
      active = false;
    },
  };
}

describe('projectGoals', () => {
  const pending = (id: string, extra: Partial<PendingGoal> = {}) =>
    ({
      id,
      input: { ...input, externalAssisterName: 'Sam' },
      createdAt: 'now',
      attempts: 0,
      nextAttempt: 0,
      status: 'saved-device',
      ...extra,
    }) as PendingGoal;

  it('returns confirmed data untouched when nothing is pending', () => {
    const data = confirmed('a');
    expect(projectGoals(data, [])).toBe(data);
    expect(projectGoals(undefined, [pending('x')])).toBeUndefined();
  });

  it('overlays pending goals with their assist after confirmed events', () => {
    const events = projectGoals(confirmed('a'), [pending('x')])!.game.teams![0]
      .events!;
    expect(events.map((e) => e.id)).toEqual(['a', 'x']);
    expect(events[1].eventType.name).toBe('GOAL');
    expect(events[1].childEvents?.[0].externalPlayerName).toBe('Sam');
  });

  it('hides a pending goal once its confirmed copy (same ID) arrives', () => {
    const events = projectGoals(confirmed('x'), [pending('x')])!.game.teams![0]
      .events!;
    expect(events.map((e) => e.id)).toEqual(['x']);
  });

  it('does not count rejected goals toward the score', () => {
    const events = projectGoals(confirmed(), [
      pending('x', { status: 'needs-attention' }),
    ])!.game.teams![0].events!;
    expect(events).toHaveLength(0);
  });
});

describe('isTerminalSyncError', () => {
  it('treats validation and permission errors as terminal', () => {
    expect(isTerminalSyncError(graphQLError('BAD_USER_INPUT'))).toBe(true);
    expect(isTerminalSyncError(graphQLError('FORBIDDEN'))).toBe(true);
  });
  it('retries network failures and unknown server errors', () => {
    expect(isTerminalSyncError(new Error('Failed to fetch'))).toBe(false);
    expect(isTerminalSyncError(graphQLError('INTERNAL_SERVER_ERROR'))).toBe(
      false,
    );
    expect(isTerminalSyncError(undefined)).toBe(false);
  });
});

describe('GoalOutbox', () => {
  it('commits to the device before resolving and never awaits the network', async () => {
    const s = setup();
    await s.outbox.enqueue(input, 'a');
    expect(await s.ids()).toEqual(['a']);
    expect(s.send).not.toHaveBeenCalled();
    expect((await s.outbox.load()).actions[0].input.clientActionId).toBe('a');
    expect(s.changed).toHaveBeenCalledWith({
      actions: [expect.objectContaining({ id: 'a' })],
    });
  });

  it('a storage failure rejects so the goal is never reported as saved', async () => {
    const s = setup();
    s.store.change = async () => {
      throw new Error('QuotaExceededError');
    };
    await expect(s.outbox.enqueue(input)).rejects.toThrow('QuotaExceeded');
  });

  it('refreshes confirmed data before retiring acknowledged goals', async () => {
    const s = setup();
    await s.outbox.enqueue(input, 'a');
    let release!: () => void;
    s.confirm.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const sync = s.outbox.sync();
    await vi.waitFor(() => expect(s.confirm).toHaveBeenCalled());
    // Still pending (and so still displayed) until the cache has the goal
    expect(await s.ids()).toEqual(['a']);
    release();
    await sync;
    expect(await s.ids()).toEqual([]);
  });

  it('confirms once for a batch of acknowledged goals', async () => {
    const s = setup();
    await s.outbox.enqueue(input, 'a');
    await s.outbox.enqueue(input, 'b');
    await s.outbox.sync();
    expect(s.send).toHaveBeenCalledTimes(2);
    expect(s.confirm).toHaveBeenCalledTimes(1);
    expect(await s.ids()).toEqual([]);
  });

  it('a failed refresh keeps the goal; the resend reuses its action ID', async () => {
    const s = setup();
    await s.outbox.enqueue(input, 'a');
    s.confirm.mockRejectedValueOnce(new Error('offline'));
    await expect(s.outbox.sync()).rejects.toThrow('offline');
    expect(await s.ids()).toEqual(['a']);
    await s.outbox.sync();
    expect(s.send.mock.calls.map(([i]) => i.clientActionId)).toEqual([
      'a',
      'a',
    ]);
    expect(await s.ids()).toEqual([]);
  });

  it('a lost response backs off and later goals wait behind it, in order', async () => {
    const s = setup();
    await s.outbox.enqueue(input, 'a');
    await s.outbox.enqueue(input, 'b');
    s.send.mockRejectedValueOnce(new Error('Failed to fetch'));
    await s.outbox.sync(1000);
    expect(s.send).toHaveBeenCalledTimes(1);
    const [a] = (await s.outbox.load()).actions;
    expect(a).toMatchObject({
      status: 'saved-device',
      attempts: 1,
      nextAttempt: 2000,
      error: 'Failed to fetch',
    });
    await s.outbox.sync(1500);
    expect(s.send).toHaveBeenCalledTimes(1);
    await s.outbox.sync(2000);
    expect(s.send.mock.calls.map(([i]) => i.clientActionId)).toEqual([
      'a',
      'a',
      'b',
    ]);
    expect(await s.ids()).toEqual([]);
  });

  it('a terminal rejection needs attention and does not block later goals', async () => {
    const s = setup();
    await s.outbox.enqueue(input, 'a');
    await s.outbox.enqueue(input, 'b');
    s.send.mockRejectedValueOnce(graphQLError('BAD_REQUEST', 'Invalid goal'));
    await s.outbox.sync();
    const actions = (await s.outbox.load()).actions;
    expect(actions).toEqual([
      expect.objectContaining({
        id: 'a',
        status: 'needs-attention',
        error: 'Invalid goal',
      }),
    ]);
    // Rejected goals are skipped on later drains until the user retries
    await s.outbox.sync();
    expect(s.send).toHaveBeenCalledTimes(2);
  });

  it('retry re-queues a rejected goal; discard only removes rejected goals', async () => {
    const s = setup();
    await s.outbox.enqueue(input, 'a');
    await s.outbox.enqueue(input, 'b');
    s.send.mockRejectedValueOnce(graphQLError('FORBIDDEN'));
    s.send.mockRejectedValueOnce(new Error('Failed to fetch'));
    await s.outbox.sync();
    await s.outbox.discard('b');
    expect(await s.ids()).toEqual(['a', 'b']);
    await s.outbox.retry('a');
    expect((await s.outbox.load()).actions[0]).toMatchObject({
      status: 'saved-device',
      nextAttempt: 0,
      error: undefined,
    });
    await s.outbox.discard('a');
    expect(await s.ids()).toEqual(['a', 'b']);
  });

  it('concurrent syncs share one drain and never double-send', async () => {
    const s = setup();
    await s.outbox.enqueue(input, 'a');
    await Promise.all([s.outbox.sync(), s.outbox.sync()]);
    expect(s.send).toHaveBeenCalledTimes(1);
  });

  it('an inactive outbox stops sending and leaves storage alone', async () => {
    const s = setup();
    await s.outbox.enqueue(input, 'a');
    s.deactivate();
    await s.outbox.sync();
    expect(s.send).not.toHaveBeenCalled();
    await s.outbox.retry('a');
    expect(await s.ids()).toEqual(['a']);
    await expect(s.outbox.enqueue(input)).rejects.toThrow('Sign in');
  });

  it('keeps pending work isolated per account and game', async () => {
    const records = new Map<string, OutboxState>();
    const a = setup('A/game', records);
    const b = setup('B/game', records);
    await a.outbox.enqueue(input, 'a');
    expect(await b.ids()).toEqual([]);
    await b.outbox.sync();
    expect(b.send).not.toHaveBeenCalled();
    expect(await setup('A/game', records).ids()).toEqual(['a']);
  });

  it('drops legacy snapshot fields from stored records on the next write', async () => {
    const records = new Map<string, OutboxState>([
      ['user/game', { actions: [], snapshot: {}, revision: 3 } as never],
    ]);
    const s = setup('user/game', records);
    await s.outbox.enqueue(input, 'a');
    expect(Object.keys(records.get('user/game')!)).toEqual(['actions']);
  });
});

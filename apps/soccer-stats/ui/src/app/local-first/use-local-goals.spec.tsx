import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApolloClient, ApolloLink, Observable } from '@apollo/client';

import { createSessionApolloClient } from '../services/apollo-client';
import { useResyncOnWake } from '../hooks/use-resync-on-wake';
import { GET_GAME_BY_ID } from '../services/games-graphql.service';

import { useLocalGoals } from './use-local-goals';

const mocks = vi.hoisted(() => ({
  connections: [] as any[],
  records: new Map(),
  mutate: vi.fn(),
  query: vi.fn(),
  userId: 'user' as string | null,
}));
vi.mock('graphql-ws', () => ({
  createClient: (options: any) => {
    mocks.connections.push(options.on);
    return { subscribe: vi.fn(), dispose: vi.fn() };
  },
}));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    userId: mocks.userId,
    isLoaded: true,
    isSignedIn: !!mocks.userId,
  }),
}));
vi.mock('@apollo/client/react', () => ({ useApolloClient: () => client }));
vi.mock('./goal-store', () => ({
  IndexedGoalStore: class {
    async read(key: string) {
      return mocks.records.get(key);
    }
    async change(key: string, fn: any) {
      const next = fn(mocks.records.get(key) ?? { actions: [] });
      mocks.records.set(key, next);
      return next;
    }
  },
}));
// A real session cache (with the app's type policies) shared across tests
const sessionCache = createSessionApolloClient(null).client.cache;
const defaultClient = {
  mutate: mocks.mutate,
  query: mocks.query,
  cache: sessionCache,
};
let client: any = defaultClient;
const data = {
  game: { id: 'game', teams: [{ id: 'team', events: [] }] },
} as any;
describe('local goal integration', () => {
  it('fresh subscription invalidation fetches again when an older reconciliation is in flight', async () => {
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    let resolve!: (value: any) => void;
    mocks.query.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const fresh = {
      game: {
        ...data.game,
        teams: [{ id: 'team', events: [{ id: 'remote' }] }],
      },
    };
    mocks.query.mockResolvedValue({ data: fresh });
    const write = vi
      .spyOn(client.cache, 'writeQuery')
      .mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    try {
      await act(async () => {
        void h.result.current.reconcile();
      });
      await act(async () => {
        void h.result.current.invalidate();
      });
      await act(async () => {
        resolve({ data });
      });
      await waitFor(() =>
        expect(
          h.result.current.data?.game.teams?.[0].events?.map((e) => e.id),
        ).toEqual(['remote']),
      );
      expect(mocks.query).toHaveBeenCalledTimes(2);
    } finally {
      h.unmount();
      write.mockRestore();
    }
  });

  it('a second client with stale Apollo cache cannot erase the first client acknowledged goal', async () => {
    const a = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(a.result.current.ready).toBe(true));
    await act(async () => {
      await a.result.current.record({ gameTeamId: 'team', period: '1' });
    });
    const id = a.result.current.actions[0].id;
    const fresh = {
      game: { ...data.game, teams: [{ id: 'team', events: [{ id }] }] },
    };
    mocks.mutate.mockResolvedValue({});
    mocks.query.mockResolvedValue({ data: fresh });
    const write = vi
      .spyOn(client.cache, 'writeQuery')
      .mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    await act(async () => {
      await a.result.current.reconcile();
    });
    expect(a.result.current.actions).toEqual([]);
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    const b = renderHook(() => useLocalGoals('game', data));
    try {
      await waitFor(() => expect(b.result.current.ready).toBe(true));
      expect(
        b.result.current.data?.game.teams?.[0].events?.map((e) => e.id),
      ).toEqual([id]);
      expect(
        mocks.records.get(JSON.stringify(['user', 'game'])).snapshot,
      ).toEqual(fresh);
      expect(b.result.current.actions).toEqual([]);
    } finally {
      a.unmount();
      b.unmount();
      write.mockRestore();
    }
  });
  it('socket reconnect alone reconciles a missed remote goal with an empty outbox', async () => {
    const session = createSessionApolloClient(null);
    client = session.client;
    const connection = mocks.connections.at(-1);
    const fresh = {
      game: {
        ...data.game,
        teams: [{ id: 'team', events: [{ id: 'missed' }] }],
      },
    };
    const query = vi
      .spyOn(session.client, 'query')
      .mockResolvedValue({ data: fresh } as any);
    const write = vi
      .spyOn(client.cache, 'writeQuery')
      .mockImplementation(() => undefined);
    const h = renderHook(() => {
      const goals = useLocalGoals('game', data);
      useResyncOnWake(goals.reconcile);
      return goals;
    });
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    connection.connected();
    connection.closed({ code: 1006 });
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    try {
      await act(async () => {
        connection.connected();
      });
      await waitFor(() =>
        expect(
          h.result.current.data?.game.teams?.[0].events?.map((e) => e.id),
        ).toEqual(['missed']),
      );
      expect(query).toHaveBeenCalledTimes(1);
      expect(h.result.current.actions).toEqual([]);
      expect(h.result.current.status).toBe('Synced');
    } finally {
      h.unmount();
      write.mockRestore();
      query.mockRestore();
      session.dispose();
    }
  });

  it('never copies retained account A query data into account B storage', async () => {
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    mocks.userId = 'other';
    h.rerender();
    await act(async () => undefined);
    expect(h.result.current.ready).toBe(false);
    expect(
      mocks.records.get(JSON.stringify(['other', 'game']))?.snapshot,
    ).toBeUndefined();
    h.unmount();
  });
  beforeEach(() => {
    client = defaultClient;
    mocks.records.clear();
    mocks.userId = 'user';
    vi.stubEnv('VITE_LOCAL_FIRST_GOALS', 'true');
    mocks.mutate.mockReset();
    mocks.query.mockReset();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
  });
  it('renders committed local score offline and restores snapshot without query data', async () => {
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    await act(async () => {
      await h.result.current.record({
        gameTeamId: 'team',
        period: '1',
        periodSecond: 10,
      });
    });
    expect(h.result.current.data?.game.teams?.[0].events).toHaveLength(1);
    expect(h.result.current.status).toBe('Saved on device');
    expect(mocks.mutate).not.toHaveBeenCalled();
    h.unmount();
    const restored = renderHook(() => useLocalGoals('game', undefined));
    await waitFor(() =>
      expect(restored.result.current.data?.game.teams?.[0].events).toHaveLength(
        1,
      ),
    );
  });
  it('does not expose the previous account snapshot after signout', async () => {
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    mocks.userId = null;
    h.rerender();
    expect(h.result.current.data).toBeUndefined();
    expect(h.result.current.ready).toBe(false);
  });
  it('periodic recovery never sends while the browser is offline', async () => {
    const interval = vi.spyOn(globalThis, 'setInterval');
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    await act(async () => {
      await h.result.current.record({
        gameTeamId: 'team',
        period: '1',
        periodSecond: 10,
      });
    });
    const tick = interval.mock.calls.find(
      (call) => call[1] === 5000,
    )![0] as () => void;
    await act(async () => {
      tick();
    });
    expect(mocks.mutate).not.toHaveBeenCalled();
    h.unmount();
    interval.mockRestore();
  });
  it('shows Syncing during periodic recovery and Synced after its ACK is persisted', async () => {
    const interval = vi.spyOn(globalThis, 'setInterval');
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    await act(async () => {
      await h.result.current.record({ gameTeamId: 'team', period: '1' });
    });
    let resolve!: (value: unknown) => void;
    mocks.mutate.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    mocks.query.mockResolvedValue({ data });
    const write = vi
      .spyOn(client.cache, 'writeQuery')
      .mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    const tick = interval.mock.calls.find(
      (call) => call[1] === 5000,
    )![0] as () => void;
    try {
      await act(async () => {
        tick();
      });
      expect(h.result.current.status).toBe('Syncing');
      await act(async () => {
        resolve({});
      });
      await waitFor(() => expect(h.result.current.status).toBe('Synced'));
    } finally {
      h.unmount();
      interval.mockRestore();
      write.mockRestore();
    }
  });
  it('switching games does not share an in-flight wake reconciliation', async () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    mocks.query.mockImplementation(() => new Promise(() => undefined));
    const h = renderHook(({ id }) => useLocalGoals(id, undefined), {
      initialProps: { id: 'game' },
    });
    await waitFor(() => expect(mocks.query).toHaveBeenCalledTimes(1));
    h.rerender({ id: 'other-game' });
    await waitFor(() => expect(mocks.query).toHaveBeenCalledTimes(2));
    expect(mocks.query.mock.calls[1][0].variables).toEqual({
      id: 'other-game',
    });
    h.unmount();
  });
  it('stops the old account outbox after the game page unmounts', async () => {
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    const record = h.result.current.record;
    h.unmount();
    await expect(
      record({ gameTeamId: 'team', period: '1', periodSecond: 10 }),
    ).rejects.toThrow('Sign in');
  });
  it.each(['wake', 'post-ACK'])(
    '%s catch-up replaces Apollo confirmed membership after a missed deletion, preserving pending work',
    async (mode) => {
      // Complete query-shaped fixture; nullable unrelated fields remain null.
      const fields = (selection: any) =>
        Object.fromEntries(
          selection.selections.map((field: any) => [field.name.value, null]),
        );
      const gameSelection = (GET_GAME_BY_ID.definitions[0] as any).selectionSet
        .selections[0].selectionSet;
      const teamSelection = gameSelection.selections.find(
        (f: any) => f.name.value === 'teams',
      ).selectionSet;
      const eventSelection = teamSelection.selections.find(
        (f: any) => f.name.value === 'events',
      ).selectionSet;
      const old = {
        game: {
          ...fields(gameSelection),
          __typename: 'Game',
          id: 'game',
          teams: [
            {
              ...fields(teamSelection),
              __typename: 'GameTeam',
              id: 'team',
              events: [
                {
                  ...fields(eventSelection),
                  __typename: 'GameEvent',
                  id: 'deleted',
                  childEvents: [],
                },
              ],
            },
          ],
        },
      } as any;
      const fresh = {
        game: { ...old.game, teams: [{ ...old.game.teams[0], events: [] }] },
      };
      const cache = sessionCache;
      cache.restore({});
      cache.writeQuery({
        query: GET_GAME_BY_ID,
        variables: { id: 'game' },
        data: old,
      });
      const real = new ApolloClient({
        cache,
        link: new ApolloLink(
          () =>
            new Observable((observer) => {
              observer.next({ data: fresh });
              observer.complete();
            }),
        ),
      });
      mocks.query.mockImplementation((options) => real.query(options));
      const h = renderHook(() => useLocalGoals('game', old));
      await waitFor(() => expect(h.result.current.ready).toBe(true));
      await act(async () => {
        await h.result.current.record({ gameTeamId: 'team', period: '1' });
      });
      mocks.mutate.mockRejectedValue(new Error('offline'));
      if (mode === 'post-ACK') {
        await act(async () => {
          await h.result.current.record({ gameTeamId: 'team', period: '1' });
        });
        mocks.mutate.mockResolvedValueOnce({
          data: { recordGoal: { id: h.result.current.actions[0].id } },
        });
        // Observe the state before the final wake refresh: the ACK snapshot itself
        // must remove the deletion rather than depending on a later catch-up.
        const query = mocks.query.getMockImplementation()!;
        mocks.query
          .mockImplementation(async (options) => {
            expect(
              mocks.records.get(JSON.stringify(['user', 'game'])).snapshot.game
                .teams[0].events,
            ).toEqual([]);
            return query(options);
          })
          .mockImplementationOnce(query);
      }
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });
      await act(async () => {
        await h.result.current.reconcile();
      });
      expect(h.result.current.actions).toHaveLength(1);
      expect(h.result.current.storageError).toBeUndefined();
      expect(
        h.result.current.data?.game.teams?.[0].events?.map((e) => e.id),
      ).toEqual([h.result.current.actions[0].id]);
      expect(
        mocks.records.get(JSON.stringify(['user', 'game'])).snapshot.game
          .teams[0].events,
      ).toEqual([]);
      expect(
        cache.readQuery({ query: GET_GAME_BY_ID, variables: { id: 'game' } })
          ?.game.teams?.[0].events,
      ).toEqual([]);
      h.unmount();
      real.stop();
    },
  );
  it('a stalled wake request times out, reconnect recovers, and late data cannot overwrite it', async () => {
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    const write = vi
      .spyOn(client.cache, 'writeQuery')
      .mockImplementation(() => undefined);
    vi.useFakeTimers();
    try {
      let resolve!: (value: any) => void;
      mocks.query.mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      );
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });
      let settled = false;
      await act(async () => {
        void h.result.current.reconcile().then(() => {
          settled = true;
        });
        await vi.advanceTimersByTimeAsync(15001);
      });
      expect(settled).toBe(true);
      expect(
        mocks.query.mock.calls[0][0].context.fetchOptions.signal.aborted,
      ).toBe(true);
      expect(h.result.current.status).toBe('Needs attention');
      mocks.query.mockResolvedValueOnce({ data });
      await act(async () => {
        await h.result.current.reconcile();
      });
      expect(mocks.query).toHaveBeenCalledTimes(2);
      expect(h.result.current.status).toBe('Synced');
      const stale = {
        game: {
          ...data.game,
          teams: [{ id: 'team', events: [{ id: 'stale' }] }],
        },
      };
      await act(async () => {
        resolve({ data: stale });
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(write).toHaveBeenCalledTimes(1);
      expect(h.result.current.data?.game.teams?.[0].events).toEqual([]);
      expect(
        mocks.records.get(JSON.stringify(['user', 'game'])).snapshot,
      ).toEqual(data);
    } finally {
      h.unmount();
      vi.useRealTimers();
      write.mockRestore();
    }
  });
  it('a mutation transport ignoring abort times out and retries the same durable action', async () => {
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    await act(async () => {
      await h.result.current.record({ gameTeamId: 'team', period: '1' });
    });
    const id = h.result.current.actions[0].id;
    mocks.mutate.mockImplementationOnce(() => new Promise(() => undefined));
    mocks.query.mockResolvedValue({ data });
    const write = vi
      .spyOn(client.cache, 'writeQuery')
      .mockImplementation(() => undefined);
    vi.useFakeTimers();
    try {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });
      let settled = false;
      await act(async () => {
        void h.result.current.reconcile().then(() => {
          settled = true;
        });
        await vi.advanceTimersByTimeAsync(15001);
      });
      expect(settled).toBe(true);
      expect(h.result.current.actions[0].id).toBe(id);
      mocks.mutate.mockResolvedValue({ data: { recordGoal: { id } } });
      await act(async () => {
        await h.result.current.retry(id);
      });
      expect(
        mocks.mutate.mock.calls.map(
          (call) => call[0].variables.input.clientActionId,
        ),
      ).toEqual([id, id]);
      expect(h.result.current.actions).toEqual([]);
    } finally {
      h.unmount();
      vi.useRealTimers();
      write.mockRestore();
    }
  });
  it('an old account snapshot response cannot update Apollo or local state', async () => {
    const h = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(h.result.current.ready).toBe(true));
    const write = vi.spyOn(client.cache, 'writeQuery');
    let resolve!: (value: any) => void;
    mocks.query.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    let pending!: Promise<void>;
    await act(async () => {
      pending = h.result.current.reconcile();
    });
    mocks.userId = null;
    h.rerender();
    await act(async () => {
      resolve({ data });
      await pending;
    });
    expect(write).not.toHaveBeenCalled();
    expect(h.result.current.data).toBeUndefined();
    h.unmount();
    write.mockRestore();
  });
  it('flag defaults off and does not persist queries', async () => {
    vi.stubEnv('VITE_LOCAL_FIRST_GOALS', '');
    const h = renderHook(() => useLocalGoals('game', data));
    expect(h.result.current.enabled).toBe(false);
    expect(mocks.records.size).toBe(0);
  });
});

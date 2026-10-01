import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApolloClient, ApolloLink, Observable } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

import { createSessionApolloClient } from '../services/apollo-client';
import { GET_GAME_BY_ID } from '../services/games-graphql.service';

import { useLocalGoals } from './use-local-goals';

const mocks = vi.hoisted(() => ({
  records: new Map(),
  mutate: vi.fn(),
  query: vi.fn(),
  userId: 'user' as string | null,
}));
vi.mock('graphql-ws', () => ({
  createClient: () => ({ subscribe: vi.fn(), dispose: vi.fn() }),
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
      return structuredClone(mocks.records.get(key));
    }
    async change(key: string, fn: any) {
      const next = fn(
        structuredClone(mocks.records.get(key)) ?? { actions: [] },
      );
      mocks.records.set(key, structuredClone(next));
      return next;
    }
  },
}));
let client: any;
const data = {
  game: { id: 'game', teams: [{ id: 'team', events: [] }] },
} as any;
const goal = { gameTeamId: 'team', period: '1', periodSecond: 30 };
const scopeKey = (user = 'user') => JSON.stringify([user, 'game']);
const setOnline = (value: boolean) =>
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
const eventIds = (result: { current: ReturnType<typeof useLocalGoals> }) =>
  result.current.data?.game.teams?.[0].events?.map((e) => e.id);

beforeEach(() => {
  vi.stubEnv('VITE_LOCAL_FIRST_GOALS', 'true');
  mocks.records.clear();
  mocks.userId = 'user';
  mocks.mutate.mockReset().mockResolvedValue({ data: {} });
  mocks.query.mockReset().mockResolvedValue({ data });
  client = { mutate: mocks.mutate, query: mocks.query };
  setOnline(true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('useLocalGoals', () => {
  it('is a pass-through when the flag is off', async () => {
    vi.stubEnv('VITE_LOCAL_FIRST_GOALS', '');
    const h = renderHook(() => useLocalGoals('game', data));
    expect(h.result.current.enabled).toBe(false);
    expect(h.result.current.data).toBe(data);
    await expect(h.result.current.record(goal)).rejects.toThrow();
    expect(mocks.records.size).toBe(0);
  });

  it('shows a goal immediately, delivers it, refreshes the game, then retires it', async () => {
    let ack!: () => void;
    mocks.mutate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          ack = () => resolve({ data: {} });
        }),
    );
    const h = renderHook(() => useLocalGoals('game', data));
    await act(() => h.result.current.record(goal));
    const id = h.result.current.actions[0].id;
    expect(eventIds(h.result)).toEqual([id]);
    await waitFor(() => expect(h.result.current.status).toBe('Syncing'));
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { input: { ...goal, clientActionId: id } },
      }),
    );
    expect(mocks.query).not.toHaveBeenCalled();
    await act(async () => ack());
    await waitFor(() => expect(h.result.current.status).toBe('Synced'));
    expect(mocks.query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: GET_GAME_BY_ID,
        variables: { id: 'game' },
        fetchPolicy: 'network-only',
      }),
    );
    expect(h.result.current.actions).toEqual([]);
  });

  it('refuses goals until confirmed game data is loaded', async () => {
    const h = renderHook(() => useLocalGoals('game', undefined));
    await expect(h.result.current.record(goal)).rejects.toThrow(
      'still loading',
    );
    expect(mocks.records.size).toBe(0);
  });

  it('keeps goals on the device while offline and delivers them on sync', async () => {
    setOnline(false);
    const h = renderHook(() => useLocalGoals('game', data));
    await act(() => h.result.current.record(goal));
    expect(h.result.current.status).toBe('Saved on device');
    expect(mocks.mutate).not.toHaveBeenCalled();
    setOnline(true);
    await act(() => h.result.current.sync());
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    expect(h.result.current.status).toBe('Synced');
  });

  it('restores pending goals after a reload, scoped to the signed-in account', async () => {
    setOnline(false);
    const first = renderHook(() => useLocalGoals('game', data));
    await act(() => first.result.current.record(goal));
    const id = first.result.current.actions[0].id;
    first.unmount();

    const reloaded = renderHook(() => useLocalGoals('game', data));
    await waitFor(() => expect(eventIds(reloaded.result)).toEqual([id]));
    reloaded.unmount();

    mocks.userId = 'other';
    const other = renderHook(() => useLocalGoals('game', data));
    await act(async () => undefined);
    expect(eventIds(other.result)).toEqual([]);
    expect(mocks.records.get(scopeKey('user')).actions).toHaveLength(1);
  });

  it('surfaces a terminal rejection that the user can retry', async () => {
    mocks.mutate.mockRejectedValueOnce({
      message: 'Invalid goal',
      errors: [{ extensions: { code: 'BAD_REQUEST' } }],
    });
    const h = renderHook(() => useLocalGoals('game', data));
    await act(() => h.result.current.record(goal));
    await waitFor(() =>
      expect(h.result.current.status).toBe('Needs attention'),
    );
    const [rejected] = h.result.current.actions;
    expect(rejected.error).toBe('Invalid goal');
    // A rejected goal is not counted on the scoreboard
    expect(eventIds(h.result)).toEqual([]);
    await act(() => h.result.current.retry(rejected.id));
    await waitFor(() => expect(h.result.current.status).toBe('Synced'));
    expect(mocks.mutate).toHaveBeenCalledTimes(2);
  });

  it('a hung mutation times out and the goal stays queued for retry', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] });
    mocks.mutate.mockImplementationOnce(() => new Promise(() => undefined));
    const h = renderHook(() => useLocalGoals('game', data));
    await act(() => h.result.current.record(goal));
    await act(() => vi.advanceTimersByTimeAsync(15000));
    const [queued] = mocks.records.get(scopeKey()).actions;
    expect(queued).toMatchObject({
      status: 'saved-device',
      attempts: 1,
      error: 'Goal sync timed out; saved on device for retry',
    });
    // Periodic recovery resends the same action once its backoff has passed
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(mocks.mutate).toHaveBeenCalledTimes(2);
    expect(mocks.mutate.mock.calls[1][0].variables.input.clientActionId).toBe(
      queued.id,
    );
  });

  it('a failed refresh after delivery is reported and the goal stays visible', async () => {
    mocks.query.mockRejectedValueOnce(new Error('Failed to fetch'));
    const h = renderHook(() => useLocalGoals('game', data));
    await act(() => h.result.current.record(goal));
    await waitFor(() =>
      expect(h.result.current.syncError).toBe('Failed to fetch'),
    );
    expect(h.result.current.actions).toHaveLength(1);
    expect(eventIds(h.result)).toEqual([h.result.current.actions[0].id]);
  });

  it('with a real Apollo cache, the confirmed goal replaces the pending one exactly once', async () => {
    // Query-shaped fixture; unrelated nullable fields are null.
    const nulls = (selection: any) =>
      Object.fromEntries(
        selection.selections.map((field: any) => [field.name.value, null]),
      );
    const gameSel = (GET_GAME_BY_ID.definitions[0] as any).selectionSet
      .selections[0].selectionSet;
    const teamSel = gameSel.selections.find(
      (f: any) => f.name.value === 'teams',
    ).selectionSet;
    const eventSel = teamSel.selections.find(
      (f: any) => f.name.value === 'events',
    ).selectionSet;
    const game = (events: object[]) => ({
      game: {
        ...nulls(gameSel),
        __typename: 'Game',
        id: 'game',
        teams: [
          { ...nulls(teamSel), __typename: 'GameTeam', id: 'team', events },
        ],
      },
    });
    const serverEvents: object[] = [];
    const real = new ApolloClient({
      cache: createSessionApolloClient(null).client.cache,
      link: new ApolloLink(
        (operation) =>
          new Observable((observer) => {
            const definition = getMainDefinition(operation.query);
            if (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'mutation'
            ) {
              const id = operation.variables.input.clientActionId;
              serverEvents.push({
                ...nulls(eventSel),
                __typename: 'GameEvent',
                id,
                childEvents: [],
              });
              observer.next({
                data: { recordGoal: { __typename: 'GameEvent', id } },
              });
            } else observer.next({ data: game(serverEvents) });
            observer.complete();
          }),
      ),
    });
    client = real;
    const read = () =>
      real.cache.readQuery({
        query: GET_GAME_BY_ID,
        variables: { id: 'game' },
      }) as any;
    real.cache.writeQuery({
      query: GET_GAME_BY_ID,
      variables: { id: 'game' },
      data: game([]) as any,
    });
    const h = renderHook(({ confirmed }) => useLocalGoals('game', confirmed), {
      initialProps: { confirmed: read() },
    });
    await act(() => h.result.current.record(goal));
    await waitFor(() => expect(serverEvents).toHaveLength(1));
    await waitFor(() => expect(h.result.current.actions).toEqual([]));
    const id = (serverEvents[0] as { id: string }).id;
    expect(read().game.teams[0].events.map((e: any) => e.id)).toEqual([id]);
    h.rerender({ confirmed: read() });
    expect(eventIds(h.result)).toEqual([id]);
    real.stop();
  });
});

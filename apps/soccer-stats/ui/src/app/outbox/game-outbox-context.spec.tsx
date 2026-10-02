import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import {
  GameOutboxProvider,
  useGameOutbox,
  usePendingGamePatch,
  usePendingTeamEvents,
} from './game-outbox-context';
import { memoryOutboxStorage, type OutboxStorage } from './outbox-storage';
import type { OutboxAction, PendingEvent } from './outbox-types';

let userId: string | null = 'user-1';
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ userId }),
}));
// The real client is a stable singleton; a new object per render would
// rebuild the outbox on every render.
const apolloClient = {};
vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => apolloClient,
}));

function pendingEvent(id: string, gameTeamId: string): PendingEvent {
  return {
    id,
    gameTeamId,
    eventType: { name: 'SUBSTITUTION_IN' },
    period: '1',
    periodSecond: 10,
    createdAt: '2026-10-01T10:00:00.000Z',
  };
}

function setup(send: (a: OutboxAction) => Promise<void>) {
  const storage: OutboxStorage = memoryOutboxStorage();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GameOutboxProvider gameId="game-1" storage={storage} send={send}>
      {children}
    </GameOutboxProvider>
  );
  return { storage, wrapper };
}

describe('GameOutboxProvider', () => {
  beforeEach(() => {
    userId = 'user-1';
  });

  it('shows a recorded action as pending until it is sent', async () => {
    let release: () => void = () => undefined;
    const send = vi.fn(
      () => new Promise<void>((resolve) => (release = resolve)),
    );
    const { wrapper } = setup(send);
    const { result } = renderHook(
      () => ({
        outbox: useGameOutbox(),
        home: usePendingTeamEvents('home'),
        away: usePendingTeamEvents('away'),
      }),
      { wrapper },
    );

    await act(() =>
      result.current.outbox.recordAction({
        actionId: 'a1',
        kind: 'substitutePlayer',
        variables: { input: { gameTeamId: 'home', actionId: 'a1' } },
        pendingEvents: [pendingEvent('sub-in', 'home')],
      }),
    );

    expect(result.current.home.map((e) => e.id)).toEqual(['sub-in']);
    expect(result.current.away).toEqual([]);
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));

    await act(async () => release());
    await waitFor(() => expect(result.current.home).toEqual([]));
    expect(result.current.outbox.actions).toEqual([]);
  });

  it('resumes sending actions left over from before a reload', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const { storage, wrapper } = setup(send);
    await storage.update('user-1:game-1', () => [
      {
        actionId: 'left-over',
        gameId: 'game-1',
        kind: 'recordGoal',
        variables: {},
        pendingEvents: [],
        createdAt: '2026-10-01T10:00:00.000Z',
        attempts: 0,
        nextAttemptAt: 0,
        status: 'queued',
      },
    ]);

    renderHook(() => useGameOutbox(), { wrapper });

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ actionId: 'left-over' }),
      ),
    );
  });

  it('hides events of a failed action and keeps it for Retry/Discard', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const { storage, wrapper } = setup(send);
    await storage.update('user-1:game-1', () => [
      {
        actionId: 'bad',
        gameId: 'game-1',
        kind: 'substitutePlayer',
        variables: {},
        pendingEvents: [pendingEvent('sub-in', 'home')],
        createdAt: '2026-10-01T10:00:00.000Z',
        attempts: 1,
        nextAttemptAt: 0,
        status: 'failed',
        error: 'Player not found',
      },
    ]);

    const { result } = renderHook(
      () => ({
        outbox: useGameOutbox(),
        home: usePendingTeamEvents('home'),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.outbox.actions).toHaveLength(1));
    expect(result.current.home).toEqual([]);
    expect(send).not.toHaveBeenCalled();

    await act(() => result.current.outbox.discard('bad'));
    await waitFor(() => expect(result.current.outbox.actions).toEqual([]));
  });

  it('exposes queued game-level changes (pause, status)', async () => {
    const send = vi.fn(() => new Promise<void>(() => undefined));
    const { wrapper } = setup(send);
    const { result } = renderHook(
      () => ({ outbox: useGameOutbox(), patch: usePendingGamePatch() }),
      { wrapper },
    );

    await act(() =>
      result.current.outbox.recordAction({
        actionId: 'pause',
        kind: 'updateGame',
        variables: {},
        gamePatch: { pausedAt: '2026-10-01T10:30:00.000Z' },
      }),
    );

    expect(result.current.patch).toEqual({
      pausedAt: '2026-10-01T10:30:00.000Z',
    });
  });

  it('refuses to record when nobody is signed in', async () => {
    userId = null;
    const { wrapper } = setup(vi.fn());
    const { result } = renderHook(() => useGameOutbox(), { wrapper });

    await expect(
      result.current.recordAction({
        actionId: 'x',
        kind: 'recordGoal',
        variables: {},
      }),
    ).rejects.toThrow('Sign in');
  });
});

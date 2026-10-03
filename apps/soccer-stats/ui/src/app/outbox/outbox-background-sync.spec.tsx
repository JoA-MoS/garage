import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';

import { OutboxBackgroundSync } from './outbox-background-sync';

const auth = { isLoaded: true, userId: 'user-1' as string | null };
vi.mock('@clerk/clerk-react', () => ({ useAuth: () => auth }));

const client = {};
vi.mock('@apollo/client/react', () => ({ useApolloClient: () => client }));

const syncAllQueuedGames = vi.fn();
const setActiveOutboxUser = vi.fn();
vi.mock('./outbox-registry', () => ({
  syncAllQueuedGames: (...args: unknown[]) => syncAllQueuedGames(...args),
  setActiveOutboxUser: (...args: unknown[]) => setActiveOutboxUser(...args),
}));

describe('OutboxBackgroundSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    auth.isLoaded = true;
    auth.userId = 'user-1';
    syncAllQueuedGames.mockResolvedValue(false);
  });

  afterEach(() => vi.useRealTimers());

  it('syncs every queued game on startup, wherever the app opened', async () => {
    render(<OutboxBackgroundSync />);
    await act(async () => undefined);

    expect(syncAllQueuedGames).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ send: expect.any(Function) }),
    );
  });

  it('syncs again when the device comes back online', async () => {
    render(<OutboxBackgroundSync />);
    await act(async () => undefined);
    syncAllQueuedGames.mockClear();

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(syncAllQueuedGames).toHaveBeenCalledTimes(1);
  });

  it('keeps retrying on an interval while anything is still queued', async () => {
    syncAllQueuedGames.mockResolvedValue(true);
    render(<OutboxBackgroundSync />);
    await act(async () => undefined);
    syncAllQueuedGames.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(syncAllQueuedGames).toHaveBeenCalledTimes(1);
  });

  it('does not poll once nothing is queued', async () => {
    render(<OutboxBackgroundSync />);
    await act(async () => undefined);
    syncAllQueuedGames.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(syncAllQueuedGames).not.toHaveBeenCalled();
  });

  it('does nothing while signed out', async () => {
    auth.userId = null;
    render(<OutboxBackgroundSync />);
    await act(async () => undefined);

    expect(syncAllQueuedGames).not.toHaveBeenCalled();
    expect(setActiveOutboxUser).toHaveBeenCalledWith(null);
  });
});

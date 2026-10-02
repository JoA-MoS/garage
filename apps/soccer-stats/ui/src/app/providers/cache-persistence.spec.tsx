import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { CachePersistence } from './cache-persistence';

const auth = { isLoaded: true, userId: 'user-1' as string | null };
vi.mock('@clerk/clerk-react', () => ({ useAuth: () => auth }));

const client = { cache: {}, clearStore: vi.fn().mockResolvedValue([]) };
vi.mock('@apollo/client/react', () => ({ useApolloClient: () => client }));

const stopPersisting = vi.fn();
const persistCache = vi.fn((..._args: unknown[]) => stopPersisting);
const clearPersistedCache = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/cache-persistence', () => ({
  persistCache: (...args: unknown[]) => persistCache(...args),
  clearPersistedCache: () => clearPersistedCache(),
}));

describe('CachePersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.isLoaded = true;
    auth.userId = 'user-1';
  });

  it('keeps the restored cache and saves it for the same user', () => {
    render(<CachePersistence restoredUserId="user-1" />);

    expect(client.clearStore).not.toHaveBeenCalled();
    expect(persistCache).toHaveBeenCalledTimes(1);
    const options = persistCache.mock.calls[0][1] as {
      getUserId: () => string;
    };
    expect(options.getUserId()).toBe('user-1');
  });

  it('wipes a restored cache that belongs to someone else', () => {
    render(<CachePersistence restoredUserId="someone-else" />);

    expect(client.clearStore).toHaveBeenCalledTimes(1);
    expect(clearPersistedCache).toHaveBeenCalledTimes(1);
    expect(persistCache).toHaveBeenCalledTimes(1);
  });

  it('wipes the cache and stops saving on sign-out', () => {
    const { rerender } = render(<CachePersistence restoredUserId="user-1" />);

    auth.userId = null;
    rerender(<CachePersistence restoredUserId="user-1" />);

    expect(stopPersisting).toHaveBeenCalled();
    expect(client.clearStore).toHaveBeenCalledTimes(1);
    expect(clearPersistedCache).toHaveBeenCalledTimes(1);
    expect(persistCache).toHaveBeenCalledTimes(1);
  });

  it('waits for Clerk before deciding anything', () => {
    auth.isLoaded = false;
    auth.userId = null;

    render(<CachePersistence restoredUserId="user-1" />);

    expect(client.clearStore).not.toHaveBeenCalled();
    expect(persistCache).not.toHaveBeenCalled();
  });
});

import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApolloClient } from '@apollo/client/react';

import {
  clearPersistedCache,
  persistCache,
  type ObservableInMemoryCache,
} from '../services/cache-persistence';

interface CachePersistenceProps {
  /** Whose data the cache was restored from at startup, if anything. */
  restoredUserId?: string | null;
}

/**
 * Keeps the saved Apollo cache tied to the signed-in user.
 *
 * Once Clerk knows who is signed in: a restored cache belonging to someone
 * else is wiped, the cache is saved for this user from then on, and signing
 * out wipes it. The cache is restored before Clerk loads (for an instant
 * open), so another user's data can only appear until then - and only if a
 * session ended without signing out.
 */
export function CachePersistence({ restoredUserId }: CachePersistenceProps) {
  const { isLoaded, userId } = useAuth();
  const client = useApolloClient();

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      void wipe(client);
      return;
    }
    if (restoredUserId && restoredUserId !== userId) {
      void wipe(client);
    }
    return persistCache(client.cache as ObservableInMemoryCache, {
      getUserId: () => userId,
    });
    // restoredUserId only matters for the first decision after startup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId, client]);

  return null;
}

async function wipe(client: ReturnType<typeof useApolloClient>) {
  await Promise.all([
    client.clearStore().catch(() => undefined),
    clearPersistedCache().catch(() => undefined),
  ]);
}

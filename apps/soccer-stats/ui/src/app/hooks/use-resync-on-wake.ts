import { useEffect } from 'react';
import { useApolloClient } from '@apollo/client/react';

import { onTransportReconnect } from '../services/transport-reconnect';

/**
 * Refetches all active Apollo queries whenever the tab/device wakes from
 * sleep or comes back into the foreground.
 *
 * Mobile browsers can freeze the JS event loop during sleep without
 * cleanly firing a WebSocket `close` event, so a GraphQL subscription can
 * go stale silently - events published while asleep never reach the
 * cache and the UI has no way to know it's out of date. Refetching on
 * wake reconciles the cache with the server regardless of whether the
 * subscription socket noticed it was disconnected. The same triggers fire
 * when the subscription socket reconnects, and run the optional `onWake`
 * callback (used to drain the local-first goal outbox).
 */
export function useResyncOnWake(onWake?: () => Promise<void>): void {
  const client = useApolloClient();

  useEffect(() => {
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      client.refetchQueries({ include: 'active' }).catch((error: unknown) => {
        console.error('[Resync on Wake] Failed to refetch queries:', error);
      });
      onWake?.().catch((error: unknown) => {
        console.error('[Resync on Wake] Wake callback failed:', error);
      });
    };

    // A socket reconnect means subscription events may have been missed.
    const unsubscribeReconnect = onTransportReconnect(client, resync);
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('pageshow', resync);
    window.addEventListener('online', resync);

    return () => {
      unsubscribeReconnect();
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('pageshow', resync);
      window.removeEventListener('online', resync);
    };
  }, [client, onWake]);
}

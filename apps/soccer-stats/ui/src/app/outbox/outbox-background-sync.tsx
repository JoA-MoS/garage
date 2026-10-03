import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';

import { useSession } from '../auth/session';

import { sendOutboxAction } from './game-outbox-context';
import { setActiveOutboxUser, syncAllQueuedGames } from './outbox-registry';

/** While anything is still queued, how often to try again. */
const RETRY_INTERVAL_MS = 15_000;

/**
 * Sends queued game changes from anywhere in the app - not only while their
 * game page is open. A change recorded offline (or before the app was
 * closed) syncs as soon as there's signal: on startup, when the device comes
 * back online or to the foreground, and periodically while anything is left.
 * Shares each game's outbox with the game page (outbox-registry), so nothing
 * is sent twice.
 */
export function OutboxBackgroundSync() {
  const { isLoaded, userId } = useSession();
  const client = useApolloClient();
  const [stillQueued, setStillQueued] = useState(false);

  // Set during render so outboxes are usable on the first render.
  if (isLoaded) setActiveOutboxUser(userId);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;

    const syncAll = () => {
      void syncAllQueuedGames(userId, {
        send: (action) => sendOutboxAction(client, action),
      })
        .then((queued) => {
          if (!cancelled) setStillQueued(queued);
        })
        .catch((error) =>
          console.warn('[OutboxBackgroundSync] sync failed:', error),
        );
    };
    syncAll();

    const onVisible = () => {
      if (document.visibilityState === 'visible') syncAll();
    };
    window.addEventListener('online', syncAll);
    document.addEventListener('visibilitychange', onVisible);
    const timer = stillQueued
      ? setInterval(syncAll, RETRY_INTERVAL_MS)
      : undefined;

    return () => {
      cancelled = true;
      window.removeEventListener('online', syncAll);
      document.removeEventListener('visibilitychange', onVisible);
      if (timer) clearInterval(timer);
    };
  }, [isLoaded, userId, client, stillQueued]);

  return null;
}

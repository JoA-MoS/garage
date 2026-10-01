import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client';

import type { GetGameByIdQuery } from '@garage/soccer-stats/graphql-codegen';

import { GET_GAME_BY_ID } from '../services/games-graphql.service';

import {
  GoalOutbox,
  projectGoals,
  type GoalInput,
  type GoalState,
} from './goal-outbox';
import { IndexedGoalStore } from './goal-store';

const RECORD_LOCAL_GOAL = gql`
  mutation RecordLocalGoal($input: RecordGoalInput!) {
    recordGoal(input: $input) {
      id
    }
  }
`;
const store = new IndexedGoalStore();
export function useLocalGoals(
  gameId: string | undefined,
  confirmed: GetGameByIdQuery | undefined,
) {
  const enabled = import.meta.env.VITE_LOCAL_FIRST_GOALS === 'true';
  const { userId, isLoaded, isSignedIn } = useAuth();
  const client = useApolloClient();
  const scope =
    enabled && isLoaded && isSignedIn && userId && gameId
      ? JSON.stringify([userId, gameId])
      : '';
  // A retained query object from a different account is never an ingress source.
  // The provider remounts with a fresh client per identity; this guard also covers
  // a hook surviving a provider/account transition before that remount completes.
  const owner = useRef({ userId, client });
  const trustedCache =
    owner.current.userId === userId && owner.current.client === client;
  const epoch = useMemo(() => ({}), [scope, client]);
  const activeEpoch = useRef(epoch);
  activeEpoch.current = epoch;
  const activeScope = useRef(scope);
  activeScope.current = scope;
  const [saved, setSaved] = useState<{ scope: string; state: GoalState }>();
  const [busy, setBusy] = useState(false);
  const [storageError, setStorageError] = useState<string>();
  const outbox = useMemo(
    () =>
      scope
        ? new GoalOutbox(
            scope,
            store,
            async (input) => {
              if (activeScope.current !== scope)
                throw new Error('Account changed');
              const controller = new AbortController();
              let timer: ReturnType<typeof setTimeout> | undefined;
              const timeout = new Promise<never>((_, reject) => {
                timer = setTimeout(() => {
                  reject(
                    new Error('Goal sync timed out; saved on device for retry'),
                  );
                  controller.abort();
                }, 15000);
              });
              try {
                await Promise.race([
                  client.mutate({
                    mutation: RECORD_LOCAL_GOAL,
                    variables: { input },
                    fetchPolicy: 'no-cache',
                    context: { fetchOptions: { signal: controller.signal } },
                  }),
                  timeout,
                ]);
              } finally {
                clearTimeout(timer);
              }
            },
            async (signal) => {
              // Network-only still reads/writes through the union merge policy. Fetch
              // without cache participation, then replace confirmed membership explicitly.
              const result = await client.query({
                query: GET_GAME_BY_ID,
                variables: { id: gameId! },
                fetchPolicy: 'no-cache',
                context: {
                  queryDeduplication: false,
                  fetchOptions: { signal },
                },
              });
              if (signal.aborted || activeScope.current !== scope)
                throw new Error('Snapshot request no longer active');
              if (!result.data)
                throw new Error('No confirmed game snapshot returned');
              return result.data;
            },
            (state) => setSaved({ scope, state }),
            () =>
              activeScope.current === scope && activeEpoch.current === epoch,
            (snapshot) =>
              client.cache.writeQuery({
                query: GET_GAME_BY_ID,
                variables: { id: gameId! },
                data: snapshot,
                overwrite: true,
              }),
          )
        : undefined,
    [scope, client, gameId, epoch],
  );
  const failure = useCallback(
    (e: unknown) =>
      setStorageError(
        e instanceof Error ? e.message : 'Local storage unavailable',
      ),
    [],
  );
  useEffect(() => {
    if (!outbox) return;
    let live = true;
    activeScope.current = scope;
    setStorageError(undefined);
    void outbox
      .load()
      .then((state) => {
        if (live)
          setSaved((previous) =>
            previous?.scope === scope ? previous : { scope, state },
          );
      })
      .catch(failure);
    return () => {
      live = false;
      if (activeScope.current === scope) activeScope.current = '';
    };
  }, [outbox, scope, failure]);
  useEffect(() => {
    if (trustedCache && outbox && confirmed && confirmed.game.id === gameId)
      void outbox.hydrate(confirmed).catch(failure);
  }, [outbox, confirmed, gameId, failure, trustedCache]);
  const syncing = useRef<{ outbox: GoalOutbox; promise: Promise<void> }>();
  const invalidated = useRef<GoalOutbox>();
  const reconcile = useCallback(() => {
    if (!outbox || !navigator.onLine) return Promise.resolve();
    if (syncing.current?.outbox === outbox) return syncing.current.promise;
    setBusy(true);
    const promise = (async () => {
      do {
        if (invalidated.current === outbox) invalidated.current = undefined;
        await outbox.sync();
        if (activeScope.current !== scope || activeEpoch.current !== epoch)
          return;
        await outbox.refresh();
      } while (invalidated.current === outbox && activeEpoch.current === epoch);
      if (activeScope.current === scope) setStorageError(undefined);
    })()
      .catch((e) => {
        if (activeScope.current === scope) failure(e);
      })
      .finally(() => {
        if (syncing.current?.outbox === outbox) {
          syncing.current = undefined;
          setBusy(false);
        }
      });
    syncing.current = { outbox, promise };
    return promise;
  }, [outbox, scope, failure, epoch]);
  // Fresh subscription messages are invalidations, not unversioned cache snapshots.
  const invalidate = useCallback(() => {
    if (!outbox) return Promise.resolve();
    invalidated.current = outbox;
    return reconcile();
  }, [outbox, reconcile]);
  useEffect(() => {
    if (!outbox) return;
    // Periodic drain is a recovery path, not the initial send path. Offline browsers
    // keep work on device; resuming the page/connection triggers reconciliation.
    void reconcile();
    const timer = setInterval(() => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        setBusy(true);
        void outbox
          .sync()
          .catch((e) => {
            if (activeScope.current === scope) failure(e);
          })
          .finally(() => {
            if (
              activeScope.current === scope &&
              syncing.current?.outbox !== outbox
            )
              setBusy(false);
          });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [outbox, reconcile, scope, failure]);
  const record = useCallback(
    async (input: GoalInput) => {
      if (!outbox)
        throw new Error('Local goal recording requires a signed-in account');
      await outbox.enqueue(input);
      // No network await on the interaction path: modal may now close.
      if (navigator.onLine && activeScope.current === scope) {
        setBusy(true);
        void outbox
          .sync()
          .catch((e) => {
            if (activeScope.current === scope) failure(e);
          })
          .finally(() => {
            if (
              activeScope.current === scope &&
              syncing.current?.outbox !== outbox
            )
              setBusy(false);
          });
      }
    },
    [outbox, scope, failure],
  );
  const state = saved?.scope === scope && scope ? saved.state : undefined;
  const actions = state?.actions ?? [];
  return {
    enabled,
    ready: !!state?.snapshot,
    data: scope ? projectGoals(state) : undefined,
    record,
    reconcile,
    invalidate,
    actions,
    storageError,
    status:
      storageError || actions.some((a) => a.status === 'needs-attention')
        ? 'Needs attention'
        : busy
          ? 'Syncing'
          : actions.length
            ? 'Saved on device'
            : 'Synced',
    retry: async (id: string) => {
      await outbox?.retry(id);
      await reconcile();
    },
    discard: async (id: string) => {
      await outbox?.discard(id);
    },
  };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client';

import type { GetGameByIdQuery } from '@garage/soccer-stats/graphql-codegen';

import { GET_GAME_BY_ID } from '../services/games-graphql.service';

import {
  GoalOutbox,
  projectGoals,
  type GoalInput,
  type PendingGoal,
} from './goal-outbox';
import { IndexedGoalStore } from './goal-store';

const RECORD_LOCAL_GOAL = gql`
  mutation RecordLocalGoal($input: RecordGoalInput!) {
    recordGoal(input: $input) {
      id
    }
  }
`;
const SYNC_TIMEOUT_MS = 15000;
const RECOVERY_INTERVAL_MS = 5000;
const store = new IndexedGoalStore();

/**
 * Abort and reject after a deadline. Racing as well as aborting matters: links
 * and transports may ignore the AbortSignal, and a hung request must not hold
 * the outbox's single in-flight drain forever.
 */
function withTimeout<T>(
  work: (signal: AbortSignal) => Promise<T>,
  message: string,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(message));
      controller.abort();
    }, SYNC_TIMEOUT_MS);
  });
  return Promise.race([work(controller.signal), timeout]).finally(() =>
    clearTimeout(timer),
  );
}

/**
 * Local-first goal entry: goals are committed to an on-device outbox and shown
 * immediately on top of the confirmed (Apollo) game data, then delivered in the
 * background. ApiProvider remounts the tree per account, so a hook instance
 * never outlives the account it was created for.
 */
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
  const [saved, setSaved] = useState<{
    scope: string;
    actions: PendingGoal[];
  }>();
  const [syncing, setSyncing] = useState(0);
  const [syncError, setSyncError] = useState<string>();

  const session = useMemo(() => {
    if (!scope || !gameId) return undefined;
    // Flipped by the effect below so a replaced or unmounted outbox stops
    // touching state; StrictMode's effect re-run turns it back on.
    const life = { live: true };
    const outbox = new GoalOutbox(
      scope,
      store,
      (input) =>
        withTimeout(
          (signal) =>
            client.mutate({
              mutation: RECORD_LOCAL_GOAL,
              variables: { input },
              fetchPolicy: 'no-cache',
              context: { fetchOptions: { signal } },
            }),
          'Goal sync timed out; saved on device for retry',
        ),
      () =>
        withTimeout(async (signal) => {
          const result = await client.query({
            query: GET_GAME_BY_ID,
            variables: { id: gameId },
            fetchPolicy: 'network-only',
            context: { fetchOptions: { signal } },
          });
          if (result.error) throw result.error;
        }, 'Game refresh timed out; retry available'),
      (state) => setSaved({ scope, actions: state.actions }),
      () => life.live,
    );
    return { outbox, life };
  }, [scope, client, gameId]);

  const drain = useCallback(async () => {
    if (!session || !navigator.onLine) return;
    try {
      const { actions } = await session.outbox.load();
      // Idle polling must not re-render the game page every few seconds.
      if (!actions.some((a) => a.status !== 'needs-attention')) return;
      setSyncing((n) => n + 1);
      try {
        await session.outbox.sync();
        if (session.life.live) setSyncError(undefined);
      } finally {
        setSyncing((n) => n - 1);
      }
    } catch (error) {
      if (session.life.live)
        setSyncError(
          error instanceof Error ? error.message : 'Goal sync failed',
        );
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    session.life.live = true;
    setSyncError(undefined);
    session.outbox.load().then(
      (state) => {
        if (session.life.live)
          setSaved((previous) =>
            previous?.scope === scope
              ? previous
              : { scope, actions: state.actions },
          );
      },
      (error) =>
        setSyncError(
          error instanceof Error ? error.message : 'Local storage unavailable',
        ),
    );
    // Recovery path only: new goals start their own drain, and wake/reconnect
    // drains through useResyncOnWake.
    void drain();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void drain();
    }, RECOVERY_INTERVAL_MS);
    return () => {
      session.life.live = false;
      clearInterval(timer);
    };
  }, [session, scope, drain]);

  const record = useCallback(
    async (input: GoalInput) => {
      if (!session)
        throw new Error('Local goal recording requires a signed-in account');
      if (!confirmed?.game.teams?.some((t) => t.id === input.gameTeamId))
        throw new Error('Game data is still loading; try again');
      await session.outbox.enqueue(input);
      // No network await on the interaction path: the modal may now close.
      void drain();
    },
    [session, confirmed, drain],
  );

  const actions = useMemo(
    () => (saved?.scope === scope ? saved.actions : []),
    [saved, scope],
  );
  const data = useMemo(
    () => (scope ? projectGoals(confirmed, actions) : confirmed),
    [scope, confirmed, actions],
  );
  return {
    enabled,
    data,
    record,
    sync: drain,
    actions,
    syncError,
    status:
      syncError || actions.some((a) => a.status === 'needs-attention')
        ? 'Needs attention'
        : syncing
          ? 'Syncing'
          : actions.length
            ? 'Saved on device'
            : 'Synced',
    retry: async (id: string) => {
      await session?.outbox.retry(id);
      await drain();
    },
    discard: async (id: string) => {
      await session?.outbox.discard(id);
    },
  };
}

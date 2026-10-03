import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ApolloClient } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { useAuth } from '@clerk/clerk-react';

import {
  BATCH_LINEUP_CHANGES,
  BRING_PLAYER_ONTO_FIELD,
  RECORD_FORMATION_CHANGE,
  RECORD_GOAL,
  RECORD_POSITION_CHANGE,
  REMOVE_PLAYER_FROM_FIELD,
  SUBSTITUTE_PLAYER,
  SWAP_POSITIONS,
  UPDATE_GAME,
} from '../services/games-graphql.service';
import { addEventsToGameTeam } from '../services/game-event-cache';

import type { OutboxStorage } from './outbox-storage';
import { getGameOutbox, setActiveOutboxUser } from './outbox-registry';
import type {
  OutboxAction,
  OutboxActionKind,
  PendingEvent,
  PendingGamePatch,
} from './outbox-types';

/** While actions are queued, how often to try sending again. */
const SYNC_INTERVAL_MS = 5_000;

type Data = Record<string, unknown> | null | undefined;

/**
 * How each action kind is sent, and which returned events go into the
 * cache. Writing them before the action leaves the outbox means the
 * confirmed events replace the pending ones (same IDs) without a flicker.
 */
const MUTATIONS: Record<
  OutboxActionKind,
  {
    document: Parameters<ApolloClient['mutate']>[0]['mutation'];
    events: (data: Data) => unknown[];
  }
> = {
  batchLineupChanges: {
    document: BATCH_LINEUP_CHANGES,
    events: (d) => (d?.['batchLineupChanges'] as unknown[]) ?? [],
  },
  swapPositions: {
    document: SWAP_POSITIONS,
    events: (d) => (d?.['swapPositions'] as unknown[]) ?? [],
  },
  substitutePlayer: {
    document: SUBSTITUTE_PLAYER,
    events: (d) => (d?.['substitutePlayer'] as unknown[]) ?? [],
  },
  bringPlayerOntoField: {
    document: BRING_PLAYER_ONTO_FIELD,
    events: (d) => [d?.['bringPlayerOntoField']],
  },
  removePlayerFromField: {
    document: REMOVE_PLAYER_FROM_FIELD,
    events: (d) => [d?.['removePlayerFromField']],
  },
  recordPositionChange: {
    document: RECORD_POSITION_CHANGE,
    events: (d) => [d?.['recordPositionChange']],
  },
  recordFormationChange: {
    document: RECORD_FORMATION_CHANGE,
    events: (d) => [d?.['recordFormationChange']],
  },
  recordGoal: {
    document: RECORD_GOAL,
    events: (d) => [d?.['recordGoal']],
  },
  updateGame: {
    // The returned Game is normalized by id, so the cache updates itself.
    document: UPDATE_GAME,
    events: () => [],
  },
};

/** The mutation document an action kind is sent with. */
export function outboxMutationDocument(kind: OutboxActionKind) {
  return MUTATIONS[kind].document;
}

/** Runs an action's mutation and writes the confirmed events to the cache. */
export async function sendOutboxAction(
  client: ApolloClient,
  action: OutboxAction,
): Promise<void> {
  const { document, events } = MUTATIONS[action.kind];
  const input = action.variables['input'] as
    | { gameTeamId?: string }
    | undefined;
  await client.mutate({
    mutation: document,
    variables: action.variables,
    update: (cache, { data }) => {
      if (input?.gameTeamId) {
        addEventsToGameTeam(
          cache,
          input.gameTeamId,
          events(data as Data) as object[],
        );
      }
    },
  });
}

export interface RecordActionInput {
  /** Must match `variables` (input.actionId / updateGameInput.actionId). */
  actionId: string;
  kind: OutboxActionKind;
  variables: Record<string, unknown>;
  pendingEvents?: PendingEvent[];
  gamePatch?: PendingGamePatch;
}

export interface GameOutboxValue {
  /** Everything not yet confirmed, in order. */
  actions: OutboxAction[];
  /** Stores the action on the device and starts sending. */
  recordAction: (input: RecordActionInput) => Promise<void>;
  retry: (actionId: string) => Promise<void>;
  discard: (actionId: string) => Promise<void>;
}

export const GameOutboxContext = createContext<GameOutboxValue | null>(null);

export interface GameOutboxProviderProps {
  gameId: string;
  children: ReactNode;
  /** Test seams. */
  storage?: OutboxStorage;
  send?: (action: OutboxAction) => Promise<void>;
}

/**
 * Exposes the signed-in user's outbox for one game and keeps it draining: on
 * mount, after each new action, when the device comes back online or to the
 * foreground, and every few seconds while anything is queued. The outbox
 * itself is shared (outbox-registry) with the app-wide background sync, so
 * changes keep syncing after the coach leaves the game page.
 */
export function GameOutboxProvider({
  gameId,
  children,
  storage,
  send,
}: GameOutboxProviderProps) {
  const { userId } = useAuth();
  const client = useApolloClient();
  const [actions, setActions] = useState<OutboxAction[]>([]);
  // Set during render so the outbox is usable on the first render.
  setActiveOutboxUser(userId);
  // Bumped on every change, so a slower initial load can't overwrite a
  // newer list (e.g. an action recorded right as the page opened).
  const changeCount = useRef(0);
  const handleChange = useCallback((next: OutboxAction[]) => {
    changeCount.current += 1;
    setActions(next);
  }, []);

  const registered = useMemo(() => {
    if (!userId) return undefined;
    return getGameOutbox(userId, gameId, {
      storage,
      send: send ?? ((action) => sendOutboxAction(client, action)),
    });
  }, [userId, gameId, storage, send, client]);
  const outbox = registered?.outbox;

  useEffect(() => {
    setActions([]);
    if (!registered || !outbox) return;
    const unsubscribe = registered.subscribe(handleChange);
    let cancelled = false;
    const changesBeforeLoad = changeCount.current;
    void outbox.load().then((loaded) => {
      if (!cancelled && changeCount.current === changesBeforeLoad) {
        setActions(loaded);
      }
    });
    const sync = () => void outbox.sync();
    sync();

    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    window.addEventListener('online', sync);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('online', sync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [registered, outbox, handleChange]);

  const hasQueued = actions.some((a) => a.status === 'queued');
  useEffect(() => {
    if (!outbox || !hasQueued) return;
    const timer = setInterval(() => void outbox.sync(), SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [outbox, hasQueued]);

  const recordAction = useCallback(
    async (input: RecordActionInput) => {
      if (!outbox) throw new Error('Sign in before recording game actions');
      await outbox.enqueue({
        actionId: input.actionId,
        gameId,
        kind: input.kind,
        variables: input.variables,
        pendingEvents: input.pendingEvents ?? [],
        gamePatch: input.gamePatch,
        createdAt: new Date().toISOString(),
        attempts: 0,
        nextAttemptAt: 0,
        status: 'queued',
      });
      void outbox.sync();
    },
    [outbox, gameId],
  );

  const value = useMemo<GameOutboxValue>(
    () => ({
      actions,
      recordAction,
      retry: async (actionId) => {
        await outbox?.retry(actionId);
        void outbox?.sync();
      },
      discard: async (actionId) => {
        await outbox?.discard(actionId);
        void outbox?.sync();
      },
    }),
    [actions, recordAction, outbox],
  );

  return (
    <GameOutboxContext.Provider value={value}>
      {children}
    </GameOutboxContext.Provider>
  );
}

/** The game's outbox. Must be inside GameOutboxProvider. */
export function useGameOutbox(): GameOutboxValue {
  const value = useContext(GameOutboxContext);
  if (!value) {
    throw new Error('useGameOutbox must be used inside GameOutboxProvider');
  }
  return value;
}

const NO_EVENTS: PendingEvent[] = [];

/**
 * Pending events for one team, from actions still waiting to send. Failed
 * actions are left out: the server rejected them, so showing them would
 * misstate the game until the user retries.
 */
export function usePendingTeamEvents(
  gameTeamId: string | undefined,
): PendingEvent[] {
  const outbox = useContext(GameOutboxContext);
  const actions = outbox?.actions;
  return useMemo(() => {
    if (!actions?.length || !gameTeamId) return NO_EVENTS;
    const events = actions
      .filter((a) => a.status === 'queued')
      .flatMap((a) => a.pendingEvents)
      .filter((e) => e.gameTeamId === gameTeamId);
    return events.length ? events : NO_EVENTS;
  }, [actions, gameTeamId]);
}

/** Game-level changes (status, pause) from queued updateGame actions. */
export function usePendingGamePatch(): PendingGamePatch | undefined {
  const outbox = useContext(GameOutboxContext);
  const actions = outbox?.actions;
  return useMemo(() => {
    const patches = (actions ?? [])
      .filter((a) => a.status === 'queued' && a.gamePatch)
      .map((a) => a.gamePatch as PendingGamePatch);
    return patches.length ? Object.assign({}, ...patches) : undefined;
  }, [actions]);
}

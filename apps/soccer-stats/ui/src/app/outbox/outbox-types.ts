import type { LiveGameEvent } from '../hooks/use-live-game-state';

/**
 * Live-game outbox (docs/event-outbox.md, phase 3). Every live action is
 * written to this device first, shown immediately, then sent to the API in
 * order, one at a time.
 */

/** The mutation an action replays. */
export type OutboxActionKind =
  | 'batchLineupChanges'
  | 'swapPositions'
  | 'substitutePlayer'
  | 'bringPlayerOntoField'
  | 'removePlayerFromField'
  | 'recordPositionChange'
  | 'recordFormationChange'
  | 'recordGoal'
  | 'updateGame';

/** An event the action will create, shown until the server confirms it. */
export interface PendingEvent extends LiveGameEvent {
  gameTeamId: string;
}

/** Game-level fields an `updateGame` action changes (status, pause). */
export interface PendingGamePatch {
  status?: string;
  /** ISO time the clock paused, or null for resume. */
  pausedAt?: string | null;
}

export interface OutboxAction {
  /** Idempotency key; also sent as the mutation's `actionId`. */
  actionId: string;
  gameId: string;
  kind: OutboxActionKind;
  /** The mutation variables, including actionId, client IDs, occurredAt. */
  variables: Record<string, unknown>;
  /** Events to show until confirmed (same IDs the server will use). */
  pendingEvents: PendingEvent[];
  gamePatch?: PendingGamePatch;
  /** ISO time it was recorded. */
  createdAt: string;
  attempts: number;
  /** Epoch ms before which it isn't retried. */
  nextAttemptAt: number;
  /** `failed` needs the user: Retry or Discard. Later actions wait. */
  status: 'queued' | 'failed';
  error?: string;
}

/** What to do after a send attempt failed. */
export type SendFailure =
  /** Already applied on the server - drop it as done. */
  | { kind: 'done' }
  /** Transient - back off and try again. */
  | { kind: 'retry'; message: string }
  /** The server rejected it - needs the user. */
  | { kind: 'fail'; message: string };

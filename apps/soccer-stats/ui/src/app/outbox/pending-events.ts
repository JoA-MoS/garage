import type { PendingEvent } from './outbox-types';

/**
 * Builds the events an action will create, exactly as the API writes them
 * (same client-chosen IDs, positions and links), so the derived lineup and
 * score show the change before the server confirms it. Keep in sync with the
 * API's SubstitutionService / EventManagementService / GoalService.
 */

/** Position stored on SUBSTITUTION_IN when positions aren't tracked. */
const NON_TRACKED_FIELD_POSITION = 'FIELD';

/** When and for which team the action happened. */
export interface ActionStamp {
  gameTeamId: string;
  period: string;
  periodSecond: number;
  /** Client time the action was confirmed (ISO). */
  createdAt: string;
}

/** A player as the roster or bench describes them. */
export interface PlayerRef {
  playerId?: string | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

/** A player currently on the field. */
export interface OnFieldPlayerRef extends PlayerRef {
  position?: string | null;
}

function event(
  stamp: ActionStamp,
  id: string,
  type: string,
  player: PlayerRef | undefined,
  extra: Partial<PendingEvent> = {},
): PendingEvent {
  return {
    id,
    gameTeamId: stamp.gameTeamId,
    eventType: { name: type },
    period: stamp.period,
    periodSecond: stamp.periodSecond,
    createdAt: stamp.createdAt,
    playerId: player?.playerId ?? null,
    externalPlayerName: player?.externalPlayerName ?? null,
    externalPlayerNumber: player?.externalPlayerNumber ?? null,
    player: player?.playerId
      ? {
          firstName: player.firstName ?? null,
          lastName: player.lastName ?? null,
        }
      : null,
    ...extra,
  };
}

/** SubstitutionService.applySubstitution */
export function substitutionEvents(
  stamp: ActionStamp,
  playerOut: OnFieldPlayerRef,
  playerIn: PlayerRef,
  ids: { trackPositions: boolean; subOutEventId: string; subInEventId: string },
): PendingEvent[] {
  return [
    event(stamp, ids.subOutEventId, 'SUBSTITUTION_OUT', playerOut, {
      position: ids.trackPositions ? (playerOut.position ?? null) : null,
    }),
    event(stamp, ids.subInEventId, 'SUBSTITUTION_IN', playerIn, {
      position: ids.trackPositions
        ? (playerOut.position ?? null)
        : NON_TRACKED_FIELD_POSITION,
      parentEventId: ids.subOutEventId,
    }),
  ];
}

/** EventManagementService.applySwap: player 1 takes player 2's position. */
export function swapEvents(
  stamp: ActionStamp,
  player1: OnFieldPlayerRef,
  player2: OnFieldPlayerRef,
  ids: { swap1EventId: string; swap2EventId: string },
): PendingEvent[] {
  return [
    event(stamp, ids.swap1EventId, 'POSITION_SWAP', player1, {
      position: player2.position ?? null,
    }),
    event(stamp, ids.swap2EventId, 'POSITION_SWAP', player2, {
      position: player1.position ?? null,
      parentEventId: ids.swap1EventId,
    }),
  ];
}

/** SubstitutionService.removePlayerFromField */
export function removalEvents(
  stamp: ActionStamp,
  playerOut: OnFieldPlayerRef,
  ids: { trackPositions: boolean; eventId: string },
): PendingEvent[] {
  return [
    event(stamp, ids.eventId, 'SUBSTITUTION_OUT', playerOut, {
      position: ids.trackPositions ? (playerOut.position ?? null) : null,
    }),
  ];
}

/** SubstitutionService.bringPlayerOntoField */
export function additionEvents(
  stamp: ActionStamp,
  playerIn: PlayerRef,
  position: string,
  ids: { trackPositions: boolean; eventId: string },
): PendingEvent[] {
  return [
    event(stamp, ids.eventId, 'SUBSTITUTION_IN', playerIn, {
      position: ids.trackPositions ? position : NON_TRACKED_FIELD_POSITION,
    }),
  ];
}

/** GoalService.recordGoal (scorer may be unknown). */
export function goalEvents(
  stamp: ActionStamp,
  scorer: PlayerRef | undefined,
  assister: PlayerRef | undefined,
  ids: { goalEventId: string; assistEventId: string },
): PendingEvent[] {
  const goal = event(stamp, ids.goalEventId, 'GOAL', scorer);
  if (!assister?.playerId && !assister?.externalPlayerName) return [goal];
  return [
    goal,
    event(stamp, ids.assistEventId, 'ASSIST', assister, {
      parentEventId: ids.goalEventId,
    }),
  ];
}

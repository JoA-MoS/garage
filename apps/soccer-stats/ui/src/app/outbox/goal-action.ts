import type { RecordActionInput } from './game-outbox-context';
import { goalEvents, type PlayerRef } from './pending-events';

export interface GoalActionParams {
  gameTeamId: string;
  period: string;
  periodSecond: number;
  scorer?: PlayerRef;
  assister?: PlayerRef;
}

/**
 * The outbox action for recording a goal: the `recordGoal` mutation input
 * (with its idempotency key, client event IDs and time) plus the pending
 * events that show the goal until the server confirms it.
 */
export function buildGoalAction({
  gameTeamId,
  period,
  periodSecond,
  scorer,
  assister,
}: GoalActionParams): RecordActionInput {
  const actionId = crypto.randomUUID();
  const goalEventId = crypto.randomUUID();
  const assistEventId = crypto.randomUUID();
  const occurredAt = new Date().toISOString();

  return {
    actionId,
    kind: 'recordGoal',
    variables: {
      input: {
        actionId,
        goalEventId,
        assistEventId,
        occurredAt,
        gameTeamId,
        period,
        periodSecond,
        scorerId: scorer?.playerId || undefined,
        externalScorerName: scorer?.externalPlayerName || undefined,
        externalScorerNumber: scorer?.externalPlayerNumber || undefined,
        assisterId: assister?.playerId || undefined,
        externalAssisterName: assister?.externalPlayerName || undefined,
        externalAssisterNumber: assister?.externalPlayerNumber || undefined,
      },
    },
    pendingEvents: goalEvents(
      { gameTeamId, period, periodSecond, createdAt: occurredAt },
      scorer,
      assister,
      { goalEventId, assistEventId },
    ),
  };
}

/** The scorer/assister to record: the picked player, or a quick-entry number. */
export function resolveGoalPlayer(
  player: PlayerRef | null | undefined,
  quickNumber: string,
  isQuick: boolean,
): PlayerRef | undefined {
  if (player) return player;
  if (isQuick && quickNumber) {
    return {
      externalPlayerName: `#${quickNumber}`,
      externalPlayerNumber: quickNumber,
    };
  }
  return undefined;
}

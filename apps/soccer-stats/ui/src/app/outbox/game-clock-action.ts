import type { RecordActionInput } from './game-outbox-context';
import { gameClockPatch, type GameClockAction } from './game-patches';

/**
 * Builds the outbox action for a status/clock change (start, halftime,
 * second half, end, pause, resume). The status and clock change on this
 * device at once through `gamePatch`; the change syncs in order with the
 * lineup changes and goals recorded before it, so a substitution can never
 * reach the server after the period it happened in has ended.
 *
 * The API's updateGame still creates the PERIOD_START/PERIOD_END and
 * SUB_IN/SUB_OUT events, timed from `occurredAt` rather than arrival.
 */
export function buildGameClockAction(
  gameId: string,
  action: GameClockAction,
  updateGameInput: Record<string, unknown>,
  clock: { periodSecond: number },
): RecordActionInput {
  const actionId = crypto.randomUUID();
  const occurredAt = new Date().toISOString();
  return {
    actionId,
    kind: 'updateGame',
    variables: {
      id: gameId,
      updateGameInput: { ...updateGameInput, actionId, occurredAt },
    },
    gamePatch: gameClockPatch(action, clock, Date.parse(occurredAt)),
  };
}

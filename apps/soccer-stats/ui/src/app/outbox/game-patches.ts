import type { PendingGamePatch } from './outbox-types';

/** A game status/clock change the coach can make during a game. */
export type GameClockAction =
  | 'startFirstHalf'
  | 'endFirstHalf'
  | 'startSecondHalf'
  | 'endGame'
  | 'pause'
  | 'resume';

/**
 * The game fields a status/clock action changes, applied on the device
 * until the server confirms it.
 *
 * Includes the clock sync fields, not just status/pausedAt: the displayed
 * clock is `currentPeriodSecond` plus time elapsed since `serverTimestamp`
 * (useSyncedGameTime), so freezing or restarting it locally means resetting
 * both to "now". Mirrors what the API's game fields return after the change.
 */
export function gameClockPatch(
  action: GameClockAction,
  clock: { periodSecond: number },
  now: number = Date.now(),
): PendingGamePatch {
  switch (action) {
    case 'startFirstHalf':
      return running('FIRST_HALF', '1', now);
    case 'startSecondHalf':
      return running('SECOND_HALF', '2', now);
    case 'endFirstHalf':
      return stopped('HALFTIME', clock.periodSecond, now);
    case 'endGame':
      return stopped('COMPLETED', clock.periodSecond, now);
    case 'pause':
      return {
        pausedAt: new Date(now).toISOString(),
        currentPeriodSecond: clock.periodSecond,
        serverTimestamp: now,
      };
    case 'resume':
      return {
        pausedAt: null,
        currentPeriodSecond: clock.periodSecond,
        serverTimestamp: now,
      };
  }
}

function running(
  status: string,
  period: string,
  now: number,
): PendingGamePatch {
  return {
    status,
    currentPeriod: period,
    currentPeriodSecond: 0,
    serverTimestamp: now,
    pausedAt: null,
  };
}

function stopped(
  status: string,
  periodSecond: number,
  now: number,
): PendingGamePatch {
  return {
    status,
    currentPeriod: null,
    currentPeriodSecond: periodSecond,
    serverTimestamp: now,
  };
}

/** The game as it will be once queued status/clock actions are applied. */
export function applyGamePatch<T extends object>(
  game: T | null | undefined,
  patch: PendingGamePatch | undefined,
): T | null | undefined {
  if (!game || !patch) return game;
  return { ...game, ...patch };
}

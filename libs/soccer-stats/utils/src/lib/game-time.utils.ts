/**
 * Converts minutes and seconds to period-relative seconds.
 * @param minute - Minutes within the period (0-59 typically)
 * @param second - Seconds within the minute (0-59), defaults to 0
 * @returns Total seconds elapsed in the period
 */
export function toPeriodSecond(minute: number, second: number = 0): number {
  return minute * 60 + second;
}

/**
 * Converts period-relative seconds to minute and second components.
 * @param periodSecond - Seconds elapsed within the period
 * @returns Object with minute (within period) and second (0-59)
 */
export function fromPeriodSecond(periodSecond: number): {
  minute: number;
  second: number;
} {
  return {
    minute: Math.floor(periodSecond / 60),
    second: periodSecond % 60,
  };
}

/**
 * Standard period durations in minutes for common game formats.
 */
export const PERIOD_DURATIONS = {
  /** Standard professional/adult half (45 minutes) */
  STANDARD: 45,
  /** Youth U11-U12 half (30 minutes) */
  YOUTH_30: 30,
  /** Youth U9-U10 half (25 minutes) */
  YOUTH_25: 25,
  /** Youth U7-U8 quarter (12 minutes) */
  YOUTH_12: 12,
  /** Overtime period (15 minutes) */
  OVERTIME: 15,
} as const;

/**
 * Calculates the display minute for a period-relative time.
 * For period 1, this is just the minute within the period.
 * For period 2+, adds the cumulative minutes from previous periods.
 *
 * @param period - Period identifier ("1", "2", "OT1", "OT2", etc.)
 * @param periodSecond - Seconds elapsed within the period
 * @param periodDurationMinutes - Duration of each regular period in minutes (default 45)
 * @returns The display minute (e.g., 67 for 22 minutes into second half)
 */
export function getDisplayMinute(
  period: string,
  periodSecond: number,
  periodDurationMinutes: number = PERIOD_DURATIONS.STANDARD,
): number {
  const minuteInPeriod = Math.floor(periodSecond / 60);

  if (period === '1') {
    return minuteInPeriod;
  } else if (period === '2') {
    return periodDurationMinutes + minuteInPeriod;
  } else if (period.startsWith('OT')) {
    // Overtime periods come after 2 regular periods
    const otNumber = parseInt(period.slice(2), 10) || 1;
    const regularMinutes = periodDurationMinutes * 2;
    const priorOtMinutes = (otNumber - 1) * PERIOD_DURATIONS.OVERTIME;
    return regularMinutes + priorOtMinutes + minuteInPeriod;
  }

  // Fallback for unknown period formats
  return minuteInPeriod;
}

/**
 * Formats minutes for display, padding to ensure consistent width.
 * - 0-99 minutes: 2 digits (e.g., "00", "45", "99")
 * - 100+ minutes: 3 digits (e.g., "105", "120")
 */
function formatMinutes(minutes: number): string {
  if (minutes >= 100) {
    return minutes.toString();
  }
  return minutes.toString().padStart(2, '0');
}

/**
 * Formats period-relative time as a display string (e.g., "67:05'").
 * Converts period + periodSecond to the traditional soccer minute display.
 * Always includes seconds in MM:SS or MMM:SS format.
 *
 * @param period - Period identifier ("1", "2", "OT1", "OT2", etc.)
 * @param periodSecond - Seconds elapsed within the period
 * @param periodDurationMinutes - Duration of each regular period in minutes (default 45)
 * @returns Formatted time string like "45:00'" or "67:30'" or "105:00'"
 */
export function formatGameTime(
  period: string,
  periodSecond: number,
  periodDurationMinutes: number = PERIOD_DURATIONS.STANDARD,
): string {
  const displayMinute = getDisplayMinute(
    period,
    periodSecond,
    periodDurationMinutes,
  );
  const second = periodSecond % 60;
  return `${formatMinutes(displayMinute)}:${second.toString().padStart(2, '0')}'`;
}

/**
 * Formats period-relative time without trailing apostrophe.
 * Always includes seconds in MM:SS or MMM:SS format.
 *
 * @param period - Period identifier ("1", "2", "OT1", "OT2", etc.)
 * @param periodSecond - Seconds elapsed within the period
 * @param periodDurationMinutes - Duration of each regular period in minutes (default 45)
 * @returns Formatted time string like "45:00" or "67:30" or "105:00"
 */
export function formatGameTimeCompact(
  period: string,
  periodSecond: number,
  periodDurationMinutes: number = PERIOD_DURATIONS.STANDARD,
): string {
  const displayMinute = getDisplayMinute(
    period,
    periodSecond,
    periodDurationMinutes,
  );
  const second = periodSecond % 60;
  return `${formatMinutes(displayMinute)}:${second.toString().padStart(2, '0')}`;
}

/**
 * Formats period-relative time showing just the time within the period.
 * Always includes seconds in MM:SS format.
 *
 * @param periodSecond - Seconds elapsed within the period
 * @returns Formatted string like "22:00'" or "45:30'"
 */
export function formatPeriodTime(periodSecond: number): string {
  const { minute, second } = fromPeriodSecond(periodSecond);
  return `${formatMinutes(minute)}:${second.toString().padStart(2, '0')}'`;
}

/**
 * Checks if the given periodSecond represents stoppage time
 * (time beyond the standard period duration).
 *
 * @param periodSecond - Seconds elapsed within the period
 * @param periodDurationMinutes - Duration of the period in minutes
 * @returns True if in stoppage time
 */
export function isStoppageTime(
  periodSecond: number,
  periodDurationMinutes: number = PERIOD_DURATIONS.STANDARD,
): boolean {
  return periodSecond > periodDurationMinutes * 60;
}

/**
 * Formats stoppage time display (e.g., "45+3'" for 3 minutes into stoppage).
 *
 * @param periodSecond - Seconds elapsed within the period
 * @param periodDurationMinutes - Duration of the period in minutes
 * @returns Formatted stoppage time string like "45+3'" or null if not in stoppage
 */
export function formatStoppageTime(
  periodSecond: number,
  periodDurationMinutes: number = PERIOD_DURATIONS.STANDARD,
): string | null {
  const periodDurationSeconds = periodDurationMinutes * 60;
  if (periodSecond <= periodDurationSeconds) {
    return null;
  }

  const stoppageSeconds = periodSecond - periodDurationSeconds;
  const stoppageMinutes = Math.floor(stoppageSeconds / 60);
  const remainingSeconds = stoppageSeconds % 60;

  if (remainingSeconds === 0) {
    return `${periodDurationMinutes}+${stoppageMinutes}'`;
  }
  return `${periodDurationMinutes}+${stoppageMinutes}:${remainingSeconds.toString().padStart(2, '0')}'`;
}

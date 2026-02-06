import { useMemo } from 'react';

export interface PlayTimeResult {
  playerId: string;
  minutes: number;
  isOnField: boolean;
}

interface GameEvent {
  id: string;
  playerId?: string | null;
  externalPlayerName?: string | null;
  eventType: { category: string; name?: string };
  period: string;
  periodSecond: number;
  childEvents?: Array<{
    playerId?: string | null;
    externalPlayerName?: string | null;
    eventType: { name: string };
  }>;
}

interface GameTime {
  period: string;
  periodSecond: number;
}

/**
 * Convert period + periodSecond to absolute seconds from game start
 * @param period - Period number as string ("1", "2", etc.)
 * @param periodSecond - Seconds into the period
 * @param periodLengthSeconds - Length of each period in seconds (default 1500 = 25 min)
 */
function toAbsoluteSeconds(
  period: string,
  periodSecond: number,
  periodLengthSeconds = 1500,
): number {
  const periodNum = parseInt(period, 10) || 1;
  return (periodNum - 1) * periodLengthSeconds + periodSecond;
}

/**
 * Calculate play time for a single player from game events
 */
export function calculatePlayTime(
  playerId: string,
  events: GameEvent[],
  currentTime: GameTime,
  periodLengthSeconds = 1500,
): PlayTimeResult {
  // Track stints: when player went on and off field
  const stints: Array<{ onTime: number; offTime: number | null }> = [];

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => {
    const aTime = toAbsoluteSeconds(
      a.period,
      a.periodSecond,
      periodLengthSeconds,
    );
    const bTime = toAbsoluteSeconds(
      b.period,
      b.periodSecond,
      periodLengthSeconds,
    );
    return aTime - bTime;
  });

  let isCurrentlyOnField = false;

  for (const event of sortedEvents) {
    const eventTime = toAbsoluteSeconds(
      event.period,
      event.periodSecond,
      periodLengthSeconds,
    );
    const eventName = event.eventType.name;

    // --- Player entered the field ---

    // Case 1: Direct SUBSTITUTION_IN (mid-game sub - player is the main event)
    if (
      eventName === 'SUBSTITUTION_IN' &&
      (event.playerId === playerId || event.externalPlayerName === playerId)
    ) {
      stints.push({ onTime: eventTime, offTime: null });
      isCurrentlyOnField = true;
      continue;
    }

    // Case 2: SUBSTITUTION_IN as child of PERIOD_START (player enters at period start)
    if (eventName === 'PERIOD_START' && event.childEvents) {
      const subIn = event.childEvents.find(
        (ce) =>
          ce.eventType.name === 'SUBSTITUTION_IN' &&
          (ce.playerId === playerId || ce.externalPlayerName === playerId),
      );
      if (subIn) {
        stints.push({ onTime: eventTime, offTime: null });
        isCurrentlyOnField = true;
        continue;
      }
    }

    // --- Player left the field ---

    // Case 1: Standalone SUBSTITUTION_OUT (removePlayerFromField - no parent)
    if (
      eventName === 'SUBSTITUTION_OUT' &&
      (event.playerId === playerId || event.externalPlayerName === playerId)
    ) {
      const lastStint = stints[stints.length - 1];
      if (lastStint && lastStint.offTime === null) {
        lastStint.offTime = eventTime;
      }
      isCurrentlyOnField = false;
      continue;
    }

    // Case 2: SUBSTITUTION_OUT as child of SUBSTITUTION_IN (paired substitution)
    if (eventName === 'SUBSTITUTION_IN' && event.childEvents) {
      const subOut = event.childEvents.find(
        (ce) =>
          ce.eventType.name === 'SUBSTITUTION_OUT' &&
          (ce.playerId === playerId || ce.externalPlayerName === playerId),
      );
      if (subOut) {
        const lastStint = stints[stints.length - 1];
        if (lastStint && lastStint.offTime === null) {
          lastStint.offTime = eventTime;
        }
        isCurrentlyOnField = false;
      }
    }

    // Case 3: SUBSTITUTION_OUT as child of PERIOD_END (period ends, all players leave)
    if (eventName === 'PERIOD_END' && event.childEvents) {
      const subOut = event.childEvents.find(
        (ce) =>
          ce.eventType.name === 'SUBSTITUTION_OUT' &&
          (ce.playerId === playerId || ce.externalPlayerName === playerId),
      );
      if (subOut) {
        const lastStint = stints[stints.length - 1];
        if (lastStint && lastStint.offTime === null) {
          lastStint.offTime = eventTime;
        }
        isCurrentlyOnField = false;
      }
    }
  }

  // Calculate total time
  const currentAbsoluteTime = toAbsoluteSeconds(
    currentTime.period,
    currentTime.periodSecond,
    periodLengthSeconds,
  );

  let totalSeconds = 0;
  for (const stint of stints) {
    const endTime = stint.offTime ?? currentAbsoluteTime;
    // Guard against negative values until API-side calculation is implemented
    totalSeconds += Math.max(0, endTime - stint.onTime);
  }

  return {
    playerId,
    // Ensure minutes is never negative
    minutes: Math.max(0, Math.floor(totalSeconds / 60)),
    isOnField: isCurrentlyOnField,
  };
}

/**
 * Hook to calculate play time for all players in a roster
 */
export function usePlayTime(
  playerIds: string[],
  events: GameEvent[],
  currentTime: GameTime,
  periodLengthSeconds = 1500,
): Map<string, PlayTimeResult> {
  return useMemo(() => {
    const results = new Map<string, PlayTimeResult>();
    for (const playerId of playerIds) {
      results.set(
        playerId,
        calculatePlayTime(playerId, events, currentTime, periodLengthSeconds),
      );
    }
    return results;
  }, [playerIds, events, currentTime, periodLengthSeconds]);
}

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

    // Check if this player started
    if (
      event.eventType.category === 'STARTER' &&
      (event.playerId === playerId || event.externalPlayerName === playerId)
    ) {
      stints.push({ onTime: eventTime, offTime: null });
      isCurrentlyOnField = true;
      continue;
    }

    // Check if this player came on as a substitute
    if (
      event.eventType.category === 'SUBSTITUTION' &&
      (event.playerId === playerId || event.externalPlayerName === playerId)
    ) {
      stints.push({ onTime: eventTime, offTime: null });
      isCurrentlyOnField = true;
      continue;
    }

    // Check if this player was substituted out (in childEvents)
    if (event.eventType.category === 'SUBSTITUTION' && event.childEvents) {
      const subOut = event.childEvents.find(
        (ce) =>
          ce.eventType.name === 'SUBSTITUTION_OUT' &&
          (ce.playerId === playerId || ce.externalPlayerName === playerId),
      );
      if (subOut) {
        // Close the last open stint
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
    totalSeconds += endTime - stint.onTime;
  }

  return {
    playerId,
    minutes: Math.floor(totalSeconds / 60),
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

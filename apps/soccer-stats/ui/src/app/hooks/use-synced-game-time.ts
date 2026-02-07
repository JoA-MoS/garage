import { useState, useEffect, useRef, useMemo } from 'react';

interface ServerTimeSync {
  currentPeriod: string | null | undefined;
  currentPeriodSecond: number;
  serverTimestamp: number;
}

interface GameTime {
  period: string | undefined;
  periodSecond: number;
}

/**
 * Hook that synchronizes game time from server timestamp.
 *
 * Calculates the current game time by:
 * 1. Taking the server's reported time (currentPeriod, currentPeriodSecond)
 * 2. Adding the elapsed time since serverTimestamp
 *
 * This allows multiple clients to stay in sync without constant polling.
 *
 * @param syncData - Time sync data from server (null if game not active)
 * @returns Current game time with 1-second update interval
 */
export function useSyncedGameTime(
  syncData: ServerTimeSync | undefined | null,
): GameTime {
  // Track the last known period so it persists across pauses/halftime
  const lastPeriodRef = useRef<string | undefined>();

  // Track which serverTimestamp we're currently counting from
  const lastServerTimestamp = useRef<number | null>(null);

  // Track additional seconds elapsed since we started counting from this sync
  const [tickCount, setTickCount] = useState(0);

  // Reset tick count when serverTimestamp changes
  if (syncData?.serverTimestamp !== lastServerTimestamp.current) {
    lastServerTimestamp.current = syncData?.serverTimestamp ?? null;
    // Reset immediately (not via effect) to avoid stale render
    if (tickCount !== 0) {
      setTickCount(0);
    }
  }

  // Calculate initial elapsed time from serverTimestamp
  const initialElapsed = useMemo(() => {
    if (!syncData?.serverTimestamp) return 0;
    return Math.floor((Date.now() - syncData.serverTimestamp) / 1000);
  }, [syncData?.serverTimestamp]);

  // Tick the clock every second (only when game is active)
  useEffect(() => {
    // Don't tick if no sync data or game is paused/halftime
    if (!syncData?.currentPeriod) return;

    const interval = setInterval(() => {
      setTickCount((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [syncData?.currentPeriod, syncData?.serverTimestamp]);

  // Compute current time
  const result = useMemo(() => {
    if (!syncData) {
      return { period: '1', periodSecond: 0 };
    }

    // If no current period (halftime, not started, completed), return last known period
    if (!syncData.currentPeriod) {
      return {
        period: lastPeriodRef.current,
        periodSecond: syncData.currentPeriodSecond,
      };
    }

    return {
      period: syncData.currentPeriod,
      periodSecond: syncData.currentPeriodSecond + initialElapsed + tickCount,
    };
  }, [syncData, initialElapsed, tickCount]);

  // Update last known period whenever we have a valid one
  if (result.period) {
    lastPeriodRef.current = result.period;
  }

  return result;
}

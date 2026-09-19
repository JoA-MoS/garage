import { useState, useEffect, useRef, useMemo } from 'react';

interface ServerTimeSync {
  currentPeriod: string | null | undefined;
  currentPeriodSecond: number;
  serverTimestamp: number;
  /** ISO timestamp of when the game clock was paused, or null/undefined if not paused. */
  pausedAt?: string | null;
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
  const lastPeriodRef = useRef<string | undefined>(undefined);

  // Wall-clock "now", re-read from Date.now() on every tick/wake rather
  // than accumulated. This is what keeps the clock self-correcting: if a
  // tick is skipped (e.g. setInterval throttled while the device sleeps),
  // the very next tick still computes the true elapsed time instead of
  // having lost the missed seconds forever.
  const [now, setNow] = useState(() => Date.now());

  // Re-sync `now` immediately (not via effect) whenever a new
  // serverTimestamp arrives, so a fresh subscription push is reflected
  // right away instead of waiting up to a second for the next tick.
  const lastServerTimestampRef = useRef<number | null>(null);
  if (syncData?.serverTimestamp !== lastServerTimestampRef.current) {
    lastServerTimestampRef.current = syncData?.serverTimestamp ?? null;
    const fresh = Date.now();
    if (fresh !== now) {
      setNow(fresh);
    }
  }

  // Tick the clock every second (only when game is active), and
  // immediately re-sync `now` whenever the tab/device wakes up so the
  // display doesn't wait up to a second for the next interval to fire.
  useEffect(() => {
    // Don't tick if no sync data, no current period, or game is paused/halftime
    if (!syncData?.currentPeriod || syncData?.pausedAt) return;

    const tick = () => setNow(Date.now());

    const interval = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [syncData?.currentPeriod, syncData?.serverTimestamp, syncData?.pausedAt]);

  // Compute current time directly from wall-clock elapsed time since
  // serverTimestamp, rather than incrementing a counter. This makes the
  // value correct regardless of how many interval ticks were actually
  // delivered.
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

    const elapsed = syncData.pausedAt
      ? 0
      : Math.floor((now - syncData.serverTimestamp) / 1000);

    return {
      period: syncData.currentPeriod,
      periodSecond: syncData.currentPeriodSecond + Math.max(0, elapsed),
    };
  }, [syncData, now]);

  // Update last known period whenever we have a valid one
  if (result.period) {
    lastPeriodRef.current = result.period;
  }

  return result;
}

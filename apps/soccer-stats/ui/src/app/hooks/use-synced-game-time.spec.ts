import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useSyncedGameTime } from './use-synced-game-time';

describe('useSyncedGameTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial values when no sync data provided', () => {
    const { result } = renderHook(() => useSyncedGameTime(undefined));

    expect(result.current).toEqual({
      period: '1',
      periodSecond: 0,
    });
  });

  it('calculates current time based on elapsed time since sync', () => {
    const syncData = {
      currentPeriod: '1',
      currentPeriodSecond: 300, // 5 minutes into period
      serverTimestamp: Date.now() - 10000, // 10 seconds ago
    };

    const { result } = renderHook(() => useSyncedGameTime(syncData));

    // Should be ~310 seconds (300 + 10 elapsed)
    expect(result.current.period).toBe('1');
    expect(result.current.periodSecond).toBeGreaterThanOrEqual(309);
    expect(result.current.periodSecond).toBeLessThanOrEqual(311);
  });

  it('updates periodSecond over time', () => {
    const syncData = {
      currentPeriod: '1',
      currentPeriodSecond: 100,
      serverTimestamp: Date.now(),
    };

    const { result } = renderHook(() => useSyncedGameTime(syncData));

    expect(result.current.periodSecond).toBe(100);

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.periodSecond).toBe(105);
  });

  it('handles null currentPeriod (halftime/not started)', () => {
    const syncData = {
      currentPeriod: null,
      currentPeriodSecond: 0,
      serverTimestamp: Date.now(),
    };

    const { result } = renderHook(() => useSyncedGameTime(syncData));

    // Should not tick when no current period
    expect(result.current.period).toBeUndefined();
    expect(result.current.periodSecond).toBe(0);
  });

  it('resets elapsed time when sync data changes', () => {
    const initialSync = {
      currentPeriod: '1',
      currentPeriodSecond: 100,
      serverTimestamp: Date.now(),
    };

    const { result, rerender } = renderHook(
      ({ sync }) => useSyncedGameTime(sync),
      { initialProps: { sync: initialSync } },
    );

    // Advance time
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.periodSecond).toBe(105);

    // New sync data (e.g., from refetch)
    const newSync = {
      currentPeriod: '2',
      currentPeriodSecond: 50,
      serverTimestamp: Date.now(),
    };

    rerender({ sync: newSync });

    // Should reset to new sync data
    expect(result.current.period).toBe('2');
    expect(result.current.periodSecond).toBe(50);
  });
});

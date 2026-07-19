import { describe, expect, it } from 'vitest';

import { ALL_FORMATIONS, getPositionSlotCount } from './formations';

describe('formation catalog', () => {
  it('exposes the full formation catalog', () => {
    const codes = ALL_FORMATIONS.map((f) => `${f.playersPerTeam}:${f.code}`);
    expect(codes).toContain('11:4-4-2');
    expect(codes).toContain('7:2-3-1');
    expect(codes).toContain('5:2-2');
  });
});

describe('getPositionSlotCount', () => {
  it('counts slots for a position that appears once', () => {
    expect(getPositionSlotCount('4-4-2', 'GK')).toBe(1);
  });

  it('counts multiple slots sharing the same position code', () => {
    // 4-4-2 fields two center backs, two central mids, and two strikers
    expect(getPositionSlotCount('4-4-2', 'CB')).toBe(2);
    expect(getPositionSlotCount('4-4-2', 'ST')).toBe(2);
  });

  it('returns 0 for a position code not present in the formation', () => {
    // 2-3-1 (7v7) has no CB slot; sentinel codes like FIELD also land here
    expect(getPositionSlotCount('2-3-1', 'CB')).toBe(0);
    expect(getPositionSlotCount('2-3-1', 'FIELD')).toBe(0);
  });

  it('returns null for an unknown formation code', () => {
    expect(getPositionSlotCount('9-9-9', 'GK')).toBeNull();
  });

  it('disambiguates formation codes shared across team sizes via playersPerTeam', () => {
    // "2-2" exists for 5v5 (GK + 2 CB + 2 ST) and 4v4 (LB/RB/LM/RM, no GK)
    expect(getPositionSlotCount('2-2', 'CB', 5)).toBe(2);
    expect(getPositionSlotCount('2-2', 'CB', 4)).toBe(0);
  });

  it('uses the maximum slot count across sizes when playersPerTeam is not given', () => {
    // Ambiguity must fail open: the larger capacity wins so valid lineups are never rejected
    expect(getPositionSlotCount('2-2', 'CB')).toBe(2);
    expect(getPositionSlotCount('2-2', 'LB')).toBe(1);
  });

  it('falls back to all sizes when playersPerTeam has no formation with that code', () => {
    // A 9v9 game with formation "4-4-2" recorded should still resolve via 11v11
    expect(getPositionSlotCount('4-4-2', 'CB', 9)).toBe(2);
  });
});

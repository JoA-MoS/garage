import { describe, it, expect } from 'vitest';

import { calculatePlayTime } from './use-play-time';

// Helper to create a PERIOD_START event with SUBSTITUTION_IN child events for starters
function periodStart(
  id: string,
  period: string,
  periodSecond: number,
  starterPlayerIds: string[],
) {
  return {
    id,
    eventType: { category: 'GAME_FLOW', name: 'PERIOD_START' },
    period,
    periodSecond,
    childEvents: starterPlayerIds.map((pid) => ({
      playerId: pid,
      eventType: { name: 'SUBSTITUTION_IN' },
    })),
  };
}

// Helper to create a paired substitution (player in, player out)
function pairedSubstitution(
  id: string,
  period: string,
  periodSecond: number,
  playerInId: string,
  playerOutId: string,
) {
  return {
    id,
    playerId: playerInId,
    eventType: { category: 'SUBSTITUTION', name: 'SUBSTITUTION_IN' },
    period,
    periodSecond,
    childEvents: [
      { playerId: playerOutId, eventType: { name: 'SUBSTITUTION_OUT' } },
    ],
  };
}

// Helper to create a standalone removal (SUBSTITUTION_OUT with no replacement)
function removal(
  id: string,
  period: string,
  periodSecond: number,
  playerId: string,
) {
  return {
    id,
    playerId,
    eventType: { category: 'SUBSTITUTION', name: 'SUBSTITUTION_OUT' },
    period,
    periodSecond,
  };
}

// Helper to create a PERIOD_END event with SUBSTITUTION_OUT child events
function periodEnd(
  id: string,
  period: string,
  periodSecond: number,
  playerIds: string[],
) {
  return {
    id,
    eventType: { category: 'GAME_FLOW', name: 'PERIOD_END' },
    period,
    periodSecond,
    childEvents: playerIds.map((pid) => ({
      playerId: pid,
      eventType: { name: 'SUBSTITUTION_OUT' },
    })),
  };
}

describe('calculatePlayTime', () => {
  it('returns 0 for player with no events', () => {
    const result = calculatePlayTime('player-1', [], {
      period: '1',
      periodSecond: 0,
    });
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 0,
      isOnField: false,
    });
  });

  it('calculates time for starter currently on field', () => {
    const events = [periodStart('evt-1', '1', 0, ['player-1', 'player-2'])];
    const result = calculatePlayTime('player-1', events, {
      period: '1',
      periodSecond: 300,
    });
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 5,
      isOnField: true,
    });
  });

  it('calculates time for player who was substituted out (paired sub)', () => {
    const events = [
      periodStart('evt-1', '1', 0, ['player-1']),
      pairedSubstitution('evt-2', '1', 600, 'player-2', 'player-1'),
    ];
    const result = calculatePlayTime('player-1', events, {
      period: '1',
      periodSecond: 900,
    });
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 10,
      isOnField: false,
    });
  });

  it('handles multiple stints (sub out then back in)', () => {
    const events = [
      periodStart('evt-1', '1', 0, ['player-1']),
      // player-1 out, player-2 in at 5:00
      pairedSubstitution('evt-2', '1', 300, 'player-2', 'player-1'),
      // player-1 back in, player-2 out at 10:00
      pairedSubstitution('evt-3', '1', 600, 'player-1', 'player-2'),
    ];
    const result = calculatePlayTime('player-1', events, {
      period: '1',
      periodSecond: 900,
    });
    // 5 min (0-300) + 5 min (600-900) = 10 min
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 10,
      isOnField: true,
    });
  });

  it('handles period transitions correctly', () => {
    const events = [periodStart('evt-1', '1', 0, ['player-1'])];
    // Player started period 1 at 0, now in period 2 at 5:00
    // Assuming period 1 is 25 min (1500 sec), total = 1500 + 300 = 1800 sec = 30 min
    const result = calculatePlayTime(
      'player-1',
      events,
      { period: '2', periodSecond: 300 },
      1500,
    );
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 30,
      isOnField: true,
    });
  });

  it('handles standalone removal (sub off without replacement)', () => {
    const events = [
      periodStart('evt-1', '1', 0, ['player-1']),
      removal('evt-2', '1', 600, 'player-1'),
    ];
    const result = calculatePlayTime('player-1', events, {
      period: '1',
      periodSecond: 900,
    });
    // Played 10 min (0-600), then removed
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 10,
      isOnField: false,
    });
  });

  it('handles period end closing a stint', () => {
    const events = [
      periodStart('evt-1', '1', 0, ['player-1']),
      periodEnd('evt-2', '1', 1500, ['player-1']),
    ];
    const result = calculatePlayTime(
      'player-1',
      events,
      { period: '2', periodSecond: 300 },
      1500,
    );
    // Played full period 1 (25 min), but left at period end - not on field in period 2
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 25,
      isOnField: false,
    });
  });

  it('handles second half starter (period 2 start)', () => {
    const events = [
      // Player was NOT in period 1 starters
      periodStart('evt-1', '1', 0, ['player-2']),
      periodEnd('evt-2', '1', 1500, ['player-2']),
      // Player enters at period 2 start
      periodStart('evt-3', '2', 0, ['player-1']),
    ];
    const result = calculatePlayTime(
      'player-1',
      events,
      { period: '2', periodSecond: 600 },
      1500,
    );
    // Played 10 min in period 2 (0-600)
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 10,
      isOnField: true,
    });
  });

  it('does not inflate time when duplicate SUBSTITUTION_IN exists for starter', () => {
    // Simulates the DataLoader bug: PERIOD_START has child SUB_IN for player-1,
    // AND a standalone SUB_IN event also appears for the same player at the same time.
    const events = [
      periodStart('evt-1', '1', 0, ['player-1', 'player-2']),
      // Duplicate standalone SUB_IN leaked by DataLoader (child event appearing top-level)
      {
        id: 'evt-dup',
        playerId: 'player-1',
        eventType: { category: 'SUBSTITUTION', name: 'SUBSTITUTION_IN' },
        period: '1',
        periodSecond: 0,
      },
    ];
    const result = calculatePlayTime('player-1', events, {
      period: '1',
      periodSecond: 960,
    });
    // Should be 16 min, NOT ~32 min from double-counting
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 16,
      isOnField: true,
    });
  });

  it('handles starter subbed out and back in with duplicate entry', () => {
    const events = [
      periodStart('evt-1', '1', 0, ['player-1']),
      // Duplicate standalone SUB_IN at time 0
      {
        id: 'evt-dup',
        playerId: 'player-1',
        eventType: { category: 'SUBSTITUTION', name: 'SUBSTITUTION_IN' },
        period: '1',
        periodSecond: 0,
      },
      // player-1 out at 5:00, player-2 in
      pairedSubstitution('evt-2', '1', 300, 'player-2', 'player-1'),
      // player-1 back in at 10:00, player-2 out
      pairedSubstitution('evt-3', '1', 600, 'player-1', 'player-2'),
    ];
    const result = calculatePlayTime('player-1', events, {
      period: '1',
      periodSecond: 900,
    });
    // 5 min (0-300) + 5 min (600-900) = 10 min
    expect(result).toEqual({
      playerId: 'player-1',
      minutes: 10,
      isOnField: true,
    });
  });

  it('tracks incoming sub player correctly in paired substitution', () => {
    const events = [
      periodStart('evt-1', '1', 0, ['player-1']),
      // player-2 comes in, player-1 goes out at 10:00
      pairedSubstitution('evt-2', '1', 600, 'player-2', 'player-1'),
    ];
    // Check player-2 (the incoming sub)
    const result = calculatePlayTime('player-2', events, {
      period: '1',
      periodSecond: 900,
    });
    // player-2 entered at 600, current time is 900 → 5 min
    expect(result).toEqual({
      playerId: 'player-2',
      minutes: 5,
      isOnField: true,
    });
  });
});

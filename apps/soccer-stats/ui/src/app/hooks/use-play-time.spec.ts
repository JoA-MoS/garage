import { describe, it, expect } from 'vitest';

import { calculatePlayTime, PlayTimeResult } from './use-play-time';

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

  it('calculates time for player currently on field', () => {
    const events = [
      {
        id: 'evt-1',
        playerId: 'player-1',
        eventType: { category: 'STARTER' },
        period: '1',
        periodSecond: 0,
      },
    ];
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

  it('calculates time for player who was substituted out', () => {
    const events = [
      {
        id: 'evt-1',
        playerId: 'player-1',
        eventType: { category: 'STARTER' },
        period: '1',
        periodSecond: 0,
      },
      {
        id: 'evt-2',
        playerId: 'player-2',
        eventType: { category: 'SUBSTITUTION' },
        period: '1',
        periodSecond: 600,
        childEvents: [
          { playerId: 'player-1', eventType: { name: 'SUBSTITUTION_OUT' } },
        ],
      },
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
      {
        id: 'evt-1',
        playerId: 'player-1',
        eventType: { category: 'STARTER' },
        period: '1',
        periodSecond: 0,
      },
      {
        id: 'evt-2',
        playerId: 'player-2',
        eventType: { category: 'SUBSTITUTION' },
        period: '1',
        periodSecond: 300,
        childEvents: [
          { playerId: 'player-1', eventType: { name: 'SUBSTITUTION_OUT' } },
        ],
      },
      {
        id: 'evt-3',
        playerId: 'player-1',
        eventType: { category: 'SUBSTITUTION' },
        period: '1',
        periodSecond: 600,
        childEvents: [
          { playerId: 'player-2', eventType: { name: 'SUBSTITUTION_OUT' } },
        ],
      },
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
    const events = [
      {
        id: 'evt-1',
        playerId: 'player-1',
        eventType: { category: 'STARTER' },
        period: '1',
        periodSecond: 0,
      },
    ];
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
});

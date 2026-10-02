import { describe, expect, it } from 'vitest';

import { applyGamePatch, gameClockPatch } from './game-patches';

const NOW = Date.parse('2026-10-01T10:40:00.000Z');

describe('gameClockPatch', () => {
  it('starting the first half runs the clock from 0 in period 1', () => {
    expect(gameClockPatch('startFirstHalf', { periodSecond: 0 }, NOW)).toEqual({
      status: 'FIRST_HALF',
      currentPeriod: '1',
      currentPeriodSecond: 0,
      serverTimestamp: NOW,
      pausedAt: null,
    });
  });

  it('pausing freezes the clock where it is now', () => {
    expect(gameClockPatch('pause', { periodSecond: 734 }, NOW)).toEqual({
      pausedAt: '2026-10-01T10:40:00.000Z',
      currentPeriodSecond: 734,
      serverTimestamp: NOW,
    });
  });

  it('resuming restarts the clock from the frozen time', () => {
    expect(gameClockPatch('resume', { periodSecond: 734 }, NOW)).toEqual({
      pausedAt: null,
      currentPeriodSecond: 734,
      serverTimestamp: NOW,
    });
  });

  it('ending the first half stops the clock at halftime', () => {
    expect(gameClockPatch('endFirstHalf', { periodSecond: 1512 }, NOW)).toEqual(
      {
        status: 'HALFTIME',
        currentPeriod: null,
        currentPeriodSecond: 1512,
        serverTimestamp: NOW,
      },
    );
  });

  it('starting the second half runs the clock from 0 in period 2', () => {
    expect(
      gameClockPatch('startSecondHalf', { periodSecond: 1512 }, NOW),
    ).toEqual({
      status: 'SECOND_HALF',
      currentPeriod: '2',
      currentPeriodSecond: 0,
      serverTimestamp: NOW,
      pausedAt: null,
    });
  });

  it('ending the game stops the clock', () => {
    expect(gameClockPatch('endGame', { periodSecond: 1490 }, NOW)).toEqual({
      status: 'COMPLETED',
      currentPeriod: null,
      currentPeriodSecond: 1490,
      serverTimestamp: NOW,
    });
  });
});

describe('applyGamePatch', () => {
  const game = {
    id: 'g1',
    status: 'FIRST_HALF',
    currentPeriod: '1',
    currentPeriodSecond: 100,
    serverTimestamp: NOW - 60_000,
    pausedAt: null,
    name: 'Final',
  };

  it('returns the game itself when nothing is pending', () => {
    expect(applyGamePatch(game, undefined)).toBe(game);
  });

  it('overlays pending fields and keeps the rest', () => {
    expect(
      applyGamePatch(game, gameClockPatch('pause', { periodSecond: 160 }, NOW)),
    ).toEqual({
      ...game,
      pausedAt: '2026-10-01T10:40:00.000Z',
      currentPeriodSecond: 160,
      serverTimestamp: NOW,
    });
  });

  it('passes through a missing game', () => {
    expect(applyGamePatch(undefined, { status: 'HALFTIME' })).toBeUndefined();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  RESUME_WINDOW_MS,
  findGameToResume,
  rememberViewedGame,
} from './live-game-resume';

const NOW = Date.parse('2026-10-02T18:00:00.000Z');
const noQueue = vi.fn().mockResolvedValue(false);

describe('live game resume', () => {
  beforeEach(() => {
    localStorage.clear();
    noQueue.mockClear();
  });

  it('resumes the game in progress the coach viewed recently', async () => {
    rememberViewedGame(
      { userId: 'u1', gameId: 'g1', inProgress: true },
      NOW - 60_000,
    );

    expect(await findGameToResume('u1', noQueue, NOW)).toBe('g1');
  });

  it('does not resume a game in progress viewed longer ago than the window', async () => {
    rememberViewedGame(
      { userId: 'u1', gameId: 'g1', inProgress: true },
      NOW - RESUME_WINDOW_MS - 1,
    );

    expect(await findGameToResume('u1', noQueue, NOW)).toBeUndefined();
  });

  it('does not resume a game that is not in progress', async () => {
    rememberViewedGame({ userId: 'u1', gameId: 'g1', inProgress: false }, NOW);

    expect(await findGameToResume('u1', noQueue, NOW)).toBeUndefined();
  });

  it('always resumes a game with unsynced changes, however long ago', async () => {
    rememberViewedGame(
      { userId: 'u1', gameId: 'g1', inProgress: false },
      NOW - 10 * RESUME_WINDOW_MS,
    );
    const hasQueue = vi.fn().mockResolvedValue(true);

    expect(await findGameToResume('u1', hasQueue, NOW)).toBe('g1');
    expect(hasQueue).toHaveBeenCalledWith('g1');
  });

  it("never resumes another user's game", async () => {
    rememberViewedGame({ userId: 'u1', gameId: 'g1', inProgress: true }, NOW);

    expect(await findGameToResume('u2', noQueue, NOW)).toBeUndefined();
  });

  it('resumes nothing when no game was viewed (or storage is unreadable)', async () => {
    expect(await findGameToResume('u1', noQueue, NOW)).toBeUndefined();

    localStorage.setItem('soccer-stats:last-viewed-game', 'not json');
    expect(await findGameToResume('u1', noQueue, NOW)).toBeUndefined();
  });
});

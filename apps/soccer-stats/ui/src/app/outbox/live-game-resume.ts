/**
 * Reopening the app returns the coach to the game they were recording,
 * instead of the dashboard (an installed web app always relaunches at its
 * start URL).
 */

/** A game in progress is resumed if viewed within this long. */
export const RESUME_WINDOW_MS = 4 * 60 * 60 * 1000;

const STORAGE_KEY = 'soccer-stats:last-viewed-game';

interface LastViewedGame {
  userId: string;
  gameId: string;
  /** First half, halftime or second half when last seen. */
  inProgress: boolean;
  /** Epoch ms. */
  viewedAt: number;
}

/** Records the game the coach is looking at. Never throws. */
export function rememberViewedGame(
  game: Omit<LastViewedGame, 'viewedAt'>,
  now: number = Date.now(),
): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...game, viewedAt: now } satisfies LastViewedGame),
    );
  } catch {
    // Storage unavailable: the app just opens on the dashboard.
  }
}

function readLastViewedGame(): LastViewedGame | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<LastViewedGame>;
    return typeof parsed.userId === 'string' &&
      typeof parsed.gameId === 'string' &&
      typeof parsed.viewedAt === 'number'
      ? (parsed as LastViewedGame)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The game to reopen on launch, if any: the last game this user viewed, when
 * it still has changes waiting to sync (any age - they need the coach), or
 * is in progress and was viewed within RESUME_WINDOW_MS.
 */
export async function findGameToResume(
  userId: string,
  hasUnsyncedChanges: (gameId: string) => Promise<boolean>,
  now: number = Date.now(),
): Promise<string | undefined> {
  const last = readLastViewedGame();
  if (!last || last.userId !== userId) return undefined;
  if (await hasUnsyncedChanges(last.gameId)) return last.gameId;
  if (last.inProgress && now - last.viewedAt <= RESUME_WINDOW_MS) {
    return last.gameId;
  }
  return undefined;
}

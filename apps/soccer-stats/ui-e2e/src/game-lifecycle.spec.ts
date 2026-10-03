import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

import {
  HOME_TEAM,
  STARTERS,
  createGame,
  endGame,
  goToHalftime,
  onFieldCard,
  setStartingLineup,
  startFirstHalf,
  startSecondHalf,
} from './support/live-game';

/**
 * Game lifecycle through the real UI: create a game, set the lineup, play
 * both halves and end it. Period changes go through the live-game outbox
 * (docs/event-outbox.md), so these also check that status changes apply at
 * once and the server-created period events are reflected.
 */

/** "#1 Alex Johnson" -> "Alex Johnson" */
const starterNames = STARTERS.map(({ player }) => player.replace(/^#\d+ /, ''));

test.describe('Game Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('creates a game showing both teams and the format', async ({ page }) => {
    const opponent = `Lifecycle Opponent ${Date.now()}`;
    const gameId = await createGame(page, opponent);

    expect(gameId).toMatch(/^[a-f0-9-]+$/);
    await expect(
      page.getByText('SCHEDULED', { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: HOME_TEAM })).toBeVisible();
    await expect(page.getByRole('button', { name: opponent })).toBeVisible();
    await expect(page.getByText(/5v5/).first()).toBeVisible();
  });

  test('plays a full game: lineup, first half, halftime, second half, end', async ({
    page,
  }) => {
    await createGame(page);
    await setStartingLineup(page);

    await startFirstHalf(page);
    for (const name of starterNames) {
      await expect(onFieldCard(page, name)).toBeVisible();
    }

    await goToHalftime(page);
    await startSecondHalf(page);

    // The server carries the first-half lineup into the second half.
    for (const name of starterNames) {
      await expect(onFieldCard(page, name)).toBeVisible();
    }

    await endGame(page);

    // Completed games open on the stats tab, listing everyone who played.
    const stats = page.locator('table');
    await expect(stats).toBeVisible();
    for (const name of starterNames) {
      await expect(stats.getByText(name)).toBeVisible();
    }
  });
});

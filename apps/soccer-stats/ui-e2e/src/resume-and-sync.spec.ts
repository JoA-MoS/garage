import { join } from 'path';

import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test, type Browser } from '@playwright/test';

import {
  addToBench,
  createGame,
  onFieldCard,
  settle,
  setStartingLineup,
  startFirstHalf,
  substitute,
} from './support/live-game';

const authFile = join(__dirname, '../.auth/user.json');

async function serverShowsMorganInGoal(browser: Browser, gameId: string) {
  const context = await browser.newContext({ storageState: authFile });
  try {
    const page = await context.newPage();
    await setupClerkTestingToken({ page });
    await page.goto(`/games/${gameId}`);
    await expect(onFieldCard(page, 'Morgan Wilson')).toContainText('· GK', {
      timeout: 5_000,
    });
  } finally {
    await context.close();
  }
}

/**
 * Found on a phone: a change recorded offline only synced once the coach
 * navigated back to its game, and reopening the app always landed on the
 * dashboard.
 */
test.describe('Leaving and reopening a live game', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('a change recorded offline syncs after leaving the game page', async ({
    page,
    browser,
  }) => {
    const gameId = await createGame(page);
    await setStartingLineup(page);
    await addToBench(page, '#11 Morgan Wilson');
    await startFirstHalf(page);
    await settle(page);

    await page.context().setOffline(true);
    await substitute(page, {
      playerIn: 'Morgan Wilson',
      playerOut: 'Alex Johnson',
    });

    // Leave the game, then get signal back while on the dashboard. Scroll
    // up first: once scrolled, the sticky score bar covers the nav.
    await page.locator('main').evaluate((main) => main.scrollTo(0, 0));
    await page.getByRole('link', { name: /Dashboard/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.context().setOffline(false);

    // The background sync sends it without reopening the game.
    await expect(async () => {
      await serverShowsMorganInGoal(browser, gameId);
    }).toPass({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/$/);
  });

  test('reopening the app mid-game returns to the game', async ({ page }) => {
    const gameId = await createGame(page);
    await setStartingLineup(page);
    await startFirstHalf(page);
    await settle(page);

    // "Reopen" the app: a fresh page load at its start URL, same device.
    const relaunched = await page.context().newPage();
    await setupClerkTestingToken({ page: relaunched });
    await relaunched.goto('/');

    await expect(relaunched).toHaveURL(new RegExp(`/games/${gameId}`));

    // Going to the dashboard deliberately stays there.
    await relaunched.getByRole('link', { name: /Dashboard/ }).click();
    await expect(relaunched).toHaveURL(/\/$/);
    await relaunched.waitForTimeout(1_000);
    await expect(relaunched).toHaveURL(/\/$/);
  });
});

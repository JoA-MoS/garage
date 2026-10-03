import { join } from 'path';

import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test, type Browser } from '@playwright/test';

import {
  createGame,
  onFieldCard,
  setStartingLineup,
  startFirstHalf,
  substitute,
  syncingIndicator,
} from './support/live-game';

const authFile = join(__dirname, '../.auth/user.json');

/**
 * Opens the game in a fresh browser context - no saved cache, no outbox -
 * so what it shows comes from the server alone.
 */
async function openFromServer(browser: Browser, gameId: string) {
  const context = await browser.newContext({ storageState: authFile });
  const page = await context.newPage();
  await setupClerkTestingToken({ page });
  await page.goto(`/games/${gameId}`);
  return { page, close: () => context.close() };
}

test.describe('Substitutions (live game outbox)', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('a substitution shows at once, syncs, and is saved on the server', async ({
    page,
    browser,
  }) => {
    const gameId = await createGame(page);
    await setStartingLineup(page);
    await startFirstHalf(page);

    await substitute(page, {
      playerIn: 'Morgan Wilson',
      playerOut: 'Alex Johnson',
    });

    // The field changes on confirm.
    await expect(onFieldCard(page, 'Morgan Wilson')).toContainText('· GK');
    await expect(onFieldCard(page, 'Alex Johnson')).toHaveCount(0);

    // The change syncs and the indicator clears.
    await expect(syncingIndicator(page)).toHaveCount(0, { timeout: 15_000 });

    // The server has it: a fresh device shows the same field.
    const fresh = await openFromServer(browser, gameId);
    try {
      await expect(onFieldCard(fresh.page, 'Morgan Wilson')).toContainText(
        '· GK',
      );
      await expect(onFieldCard(fresh.page, 'Alex Johnson')).toHaveCount(0);
    } finally {
      await fresh.close();
    }
  });

  test('a substitution made offline shows at once and syncs when back online', async ({
    page,
    browser,
  }) => {
    const gameId = await createGame(page);
    await setStartingLineup(page);
    await startFirstHalf(page);

    await page.context().setOffline(true);
    await substitute(page, {
      playerIn: 'Morgan Wilson',
      playerOut: 'Alex Johnson',
    });

    // Offline: the field still changes, and the change waits in the outbox.
    await expect(onFieldCard(page, 'Morgan Wilson')).toContainText('· GK');
    await expect(onFieldCard(page, 'Alex Johnson')).toHaveCount(0);
    await expect(syncingIndicator(page)).toHaveText(/Syncing 1 change/);

    // Back online: it syncs without the coach doing anything.
    await page.context().setOffline(false);
    await expect(syncingIndicator(page)).toHaveCount(0, { timeout: 30_000 });

    const fresh = await openFromServer(browser, gameId);
    try {
      await expect(onFieldCard(fresh.page, 'Morgan Wilson')).toContainText(
        '· GK',
      );
    } finally {
      await fresh.close();
    }
  });
});

import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test, type Page } from '@playwright/test';

import { settle, startLiveGame, syncingIndicator } from './support/live-game';

/** What the phone does when the coach switches apps and comes back. */
async function switchAwayAndBack(page: Page) {
  for (const state of ['hidden', 'visible'] as const) {
    await page.evaluate((visibility) => {
      Object.defineProperty(document, 'visibilityState', {
        value: visibility,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, state);
  }
}

async function recordQuickGoal(page: Page) {
  await page.locator('button').filter({ hasText: 'Goal' }).first().click();
  await page
    .getByRole('combobox')
    .filter({ has: page.getByRole('option', { name: 'Select player...' }) })
    .first()
    .selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Record Goal' }).click();
}

test.describe('Offline at the field', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  /**
   * Found on a phone: offline, switching apps and back showed "Failed to
   * fetch". The refresh on wake failed and the page replaced the cached game
   * with an error screen.
   */
  test('switching apps while offline keeps the game on screen', async ({
    page,
  }) => {
    await startLiveGame(page);

    await page.context().setOffline(true);
    await recordQuickGoal(page);
    await expect(syncingIndicator(page)).toHaveText(/Syncing 1 change/);

    await switchAwayAndBack(page);
    await page.waitForTimeout(1_500); // let the failed refresh land

    await expect(page.getByText('Error loading game')).toHaveCount(0);
    await expect(page.getByText(/Failed to fetch/)).toHaveCount(0);
    await expect(syncingIndicator(page)).toHaveText(/Syncing 1 change/);

    // Back online: the goal syncs and the game is still there.
    await page.context().setOffline(false);
    await expect(syncingIndicator(page)).toHaveCount(0, { timeout: 30_000 });
    await settle(page);
    await expect(page.getByText('Error loading game')).toHaveCount(0);
  });
});

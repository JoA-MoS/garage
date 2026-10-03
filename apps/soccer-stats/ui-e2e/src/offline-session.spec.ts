import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

import { HOME_TEAM, onFieldCard, startLiveGame } from './support/live-game';

/** Requests for Clerk's script and API (its own servers, not the app's). */
const CLERK = /clerk\.(accounts\.dev|com)|clerk-js|clerk\.browser/;

const BANNER = 'Offline — showing saved data; changes will sync.';

/**
 * Found on a phone: closing the app offline and reopening it showed a white
 * page. Clerk loads from its own servers, so with no signal it never says
 * who is signed in, and every screen waited on it. Now the app falls back
 * to the last account signed in on this device.
 *
 * Offline cold starts need the service worker, which the preview server
 * doesn't run reliably, so these block Clerk instead: the same "Clerk
 * never loads" with the app itself still reachable.
 */
test.describe('Opening the app when Clerk cannot load', () => {
  test('returns to the live game from saved data, with a banner', async ({
    page,
  }) => {
    await setupClerkTestingToken({ page });
    const gameId = await startLiveGame(page);
    await page.waitForTimeout(1_500); // let the cache save (1s debounce)

    const relaunched = await page.context().newPage();
    await relaunched.route(CLERK, (route) => route.abort());
    await relaunched.goto('/');

    await expect(relaunched.getByText(BANNER)).toBeVisible({
      timeout: 10_000,
    });
    await expect(relaunched).toHaveURL(new RegExp(`/games/${gameId}`));
    await expect(onFieldCard(relaunched, 'Alex Johnson')).toBeVisible();
    await expect(relaunched.getByText(HOME_TEAM).first()).toBeVisible();
  });

  test('is not available to a device whose user signed out', async ({
    page,
  }) => {
    await setupClerkTestingToken({ page });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'My Teams' })).toBeVisible();
    // As if the last session on this device ended by signing out.
    await page.evaluate(() =>
      localStorage.removeItem('soccer-stats:last-signed-in-user'),
    );

    const relaunched = await page.context().newPage();
    await relaunched.route(CLERK, (route) => route.abort());
    await relaunched.goto('/');

    await expect(relaunched.getByText("You're offline")).toBeVisible({
      timeout: 10_000,
    });
    await expect(relaunched.getByText(BANNER)).toHaveCount(0);
  });
});

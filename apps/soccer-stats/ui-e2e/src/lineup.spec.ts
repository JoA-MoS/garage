import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

import { createGame, settle } from './support/live-game';

test.describe('Pre-game lineup', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  /**
   * Regression: placing a player made the field blink behind a spinner.
   * GetGameById selected team.teamConfiguration without `id`, which replaced
   * the normalized TeamConfiguration GetTeamById reads, so GetTeamById
   * refetched on every lineup change and use-lineup showed its spinner.
   */
  test('placing a player sends only the lineup change: no reload, no spinner', async ({
    page,
  }) => {
    await createGame(page);
    await page.getByRole('button', { name: '+ GK' }).waitFor();
    await settle(page);

    const operations: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/graphql') && request.method() === 'POST') {
        operations.push(JSON.parse(request.postData() ?? '{}').operationName);
      }
    });
    // Record any spinner that appears, however briefly.
    await page.evaluate(() => {
      const w = window as unknown as { spinnerSeen: boolean };
      w.spinnerSeen = false;
      new MutationObserver(() => {
        if (document.querySelector('.animate-spin')) w.spinnerSeen = true;
      }).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
      });
    });

    // The coach's flow: tap the player, then the position.
    await page
      .getByRole('button', { name: '#1 Alex Johnson', exact: true })
      .click();
    await page.getByRole('button', { name: '+ GK' }).click();
    await expect(page.getByRole('button', { name: '+ GK' })).toHaveCount(0);
    await settle(page);

    // The player is already on the bench, so placing them is a position update.
    expect(operations).toEqual(['UpdatePlayerPosition']);
    expect(
      await page.evaluate(
        () => (window as unknown as { spinnerSeen: boolean }).spinnerSeen,
      ),
    ).toBe(false);
  });

  test('a new game starts with every player on the bench, numbered', async ({
    page,
  }) => {
    await createGame(page);

    await expect(page.getByRole('button', { name: 'Bench (8)' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Team Roster (0)' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '#1 Alex Johnson', exact: true }),
    ).toBeVisible();
  });

  test('Move to bench keeps a placed player in the game, on the bench', async ({
    page,
  }) => {
    await createGame(page);
    await page.getByRole('button', { name: '+ GK' }).click();
    await page
      .getByRole('button', { name: '#1 Alex Johnson', exact: true })
      .click();
    await expect(page.getByRole('button', { name: '+ GK' })).toHaveCount(0);

    // Tap him on the field, then the bench's "Move to bench".
    await page.getByRole('button', { name: /Alex Johnson/ }).click();
    await page.getByRole('button', { name: /Move to bench/ }).click();

    await expect(page.getByRole('button', { name: '+ GK' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bench (8)' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Team Roster (0)' }),
    ).toBeVisible();
  });

  test('Remove from Bench takes a player out of the game', async ({ page }) => {
    await createGame(page);

    await page
      .getByRole('button', { name: '#11 Morgan Wilson', exact: true })
      .click();
    await page.getByRole('button', { name: 'Remove from Bench' }).click();

    await expect(page.getByRole('button', { name: 'Bench (7)' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Team Roster (1)' }),
    ).toBeVisible();
  });
});

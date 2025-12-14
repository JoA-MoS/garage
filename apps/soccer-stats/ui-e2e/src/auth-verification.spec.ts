import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('should be authenticated and able to access protected content', async ({
    page,
  }) => {
    await setupClerkTestingToken({ page });
    // Navigate to homepage first
    await page.goto('/');

    // Verify we're authenticated by checking that "Authentication Required" is NOT shown
    const welcomeBanner = page.locator('text=Welcome back, User!');
    await expect(welcomeBanner).toBeVisible();

    const authRequiredLocator = page.locator('text=Authentication Required');
    await expect(authRequiredLocator).toBeHidden();
  });

  test('should be able to navigate to game setup wizard', async ({ page }) => {
    // Navigate to homepage first
    await page.goto('/');

    // Look for the "Start New Game" link specifically
    const startNewGameLink = page.getByRole('link', { name: '⚽New Game' });
    await expect(startNewGameLink).toBeVisible({ timeout: 10000 });

    // Click the Start New Game link
    await startNewGameLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Verify we're on the game setup page
    expect(page.url()).toContain('/game/new');

    // Verify no authentication required on the game setup page
    const finalAuthRequired = page.locator('text=Authentication Required');
    await expect(finalAuthRequired).toBeHidden({ timeout: 5000 });
  });
});

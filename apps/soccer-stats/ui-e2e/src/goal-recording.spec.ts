import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

/**
 * Goal Recording E2E Tests
 *
 * These tests verify that goal recording updates the UI smoothly without
 * triggering full-page loading states. The expected behavior is:
 * - Score updates immediately via subscription
 * - No loading spinner appears on the main game page
 * - Event appears in the timeline
 *
 * This prevents regression of the issue where refetchQueries caused
 * loading state flickers.
 */
test.describe('Goal Recording', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('should record a goal without showing full-page loading spinner', async ({
    page,
  }) => {
    // Navigate to games list
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');

    // Find and click on an active game (in FIRST_HALF, HALFTIME, or SECOND_HALF status)
    // The games list uses div cards with onClick
    const activeStatuses = [
      'FIRST HALF',
      'SECOND HALF',
      'HALFTIME',
      'IN PROGRESS',
    ];
    let activeGameBadge = null;

    for (const status of activeStatuses) {
      const badge = page.locator('span').filter({ hasText: status }).first();
      if (await badge.isVisible().catch(() => false)) {
        activeGameBadge = badge;
        break;
      }
    }

    // If no active game, we need to start one first
    if (!activeGameBadge) {
      test.skip(true, 'No active game found - skipping goal recording test');
      return;
    }

    // Click the parent card (the div with cursor-pointer)
    const gameCard = activeGameBadge.locator(
      'xpath=ancestor::div[contains(@class, "cursor-pointer")]'
    );
    await gameCard.click();
    await page.waitForURL(/\/games\/[a-z0-9-]+/);

    // Wait for game page to fully load
    const gameHeader = page.locator('h1').first();
    await expect(gameHeader).toBeVisible({ timeout: 10000 });

    // Get current home score before recording goal
    const homeScoreLocator = page
      .locator('.text-blue-600')
      .filter({ hasText: /^\d+$/ })
      .first();
    const initialHomeScore = await homeScoreLocator
      .textContent()
      .then((t) => parseInt(t || '0', 10));

    // Find the home team's Goal button
    const homeGoalButton = page
      .locator('button')
      .filter({ hasText: 'Goal' })
      .first();
    await expect(homeGoalButton).toBeVisible();

    // Monitor for loading spinner via console log from the React component
    // The game.page.tsx logs '[Game Page Loading Spinner]' when loading=true
    let loadingSpinnerAppeared = false;
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('[Game Page Loading Spinner]')) {
        loadingSpinnerAppeared = true;
      }
    });

    // Click the Goal button
    await homeGoalButton.click();

    // Check if this opens a modal (for FULL or SCORER_ONLY mode)
    const goalModal = page.locator('text=Record Goal').first();
    const modalVisible = await goalModal
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (modalVisible) {
      // Modal mode - submit without selecting a player (if allowed)
      const recordButton = page
        .locator('button')
        .filter({ hasText: /^Record Goal$/ });

      // If we need to select a player first, select the first one
      const scorerSelect = page.locator('select').first();
      if (await scorerSelect.isVisible().catch(() => false)) {
        const options = await scorerSelect.locator('option').all();
        if (options.length > 1) {
          await scorerSelect.selectOption({ index: 1 });
        }
      }

      await recordButton.click();

      // Wait for modal to close
      await expect(goalModal).toBeHidden({ timeout: 5000 });
    }

    // Wait a moment for any loading to potentially appear
    await page.waitForTimeout(500);

    // Verify no full-page loading appeared
    // The full-page loading has specific text "Loading game..."
    const fullPageLoading = page.locator('text=Loading game...');
    await expect(fullPageLoading).toBeHidden();

    // Also check for the generic loading spinner in the center of the page
    const centeredSpinner = page.locator(
      'div.flex.min-h-\\[400px\\].items-center.justify-center'
    );
    await expect(centeredSpinner).toBeHidden();

    // Verify the score updated (either immediately or within a short time via subscription)
    await expect(async () => {
      const newScoreText = await homeScoreLocator.textContent();
      const newScore = parseInt(newScoreText || '0', 10);
      expect(newScore).toBe(initialHomeScore + 1);
    }).toPass({ timeout: 5000 });

    // Log result for debugging
    console.log(
      `Goal recorded successfully. Score changed from ${initialHomeScore} to ${
        initialHomeScore + 1
      }`
    );
    console.log(`Loading spinner appeared: ${loadingSpinnerAppeared}`);
    if (loadingSpinnerAppeared) {
      console.log(
        'Console messages with loading spinner:',
        consoleMessages.filter((m) => m.includes('Loading'))
      );
    }

    // Final assertion - loading spinner should NOT have appeared
    expect(loadingSpinnerAppeared).toBe(false);
  });

  test('should update score via subscription without refetch', async ({
    page,
  }) => {
    // This test monitors network requests to verify no GET_GAME_BY_ID refetch happens
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');

    const activeStatuses = [
      'FIRST HALF',
      'SECOND HALF',
      'HALFTIME',
      'IN PROGRESS',
    ];
    let activeGameBadge = null;

    for (const status of activeStatuses) {
      const badge = page.locator('span').filter({ hasText: status }).first();
      if (await badge.isVisible().catch(() => false)) {
        activeGameBadge = badge;
        break;
      }
    }

    if (!activeGameBadge) {
      test.skip(true, 'No active game found');
      return;
    }

    const gameCard = activeGameBadge.locator(
      'xpath=ancestor::div[contains(@class, "cursor-pointer")]'
    );
    await gameCard.click();
    await page.waitForURL(/\/games\/[a-z0-9-]+/);
    await page.waitForLoadState('domcontentloaded');

    // Track GraphQL requests after initial load
    const graphqlRequests: { operationName: string; timestamp: number }[] = [];
    let isRecordingRequests = false;

    page.on('request', (request) => {
      if (
        isRecordingRequests &&
        request.url().includes('/graphql') &&
        request.method() === 'POST'
      ) {
        try {
          const postData = request.postData();
          if (postData) {
            const body = JSON.parse(postData);
            graphqlRequests.push({
              operationName: body.operationName || 'Unknown',
              timestamp: Date.now(),
            });
          }
        } catch {
          // Ignore parse errors
        }
      }
    });

    // Start recording requests
    isRecordingRequests = true;

    // Record a goal
    const homeGoalButton = page
      .locator('button')
      .filter({ hasText: 'Goal' })
      .first();
    await homeGoalButton.click();

    // Handle modal if it appears
    const goalModal = page.locator('text=Record Goal').first();
    const modalVisible = await goalModal
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (modalVisible) {
      const scorerSelect = page.locator('select').first();
      if (await scorerSelect.isVisible().catch(() => false)) {
        const options = await scorerSelect.locator('option').all();
        if (options.length > 1) {
          await scorerSelect.selectOption({ index: 1 });
        }
      }
      const recordButton = page
        .locator('button')
        .filter({ hasText: /^Record Goal$/ });
      await recordButton.click();
      await expect(goalModal).toBeHidden({ timeout: 5000 });
    }

    // Wait for subscription update and any potential refetches
    await page.waitForTimeout(2000);

    // Stop recording
    isRecordingRequests = false;

    // Log all GraphQL requests for debugging
    console.log('GraphQL requests after goal recording:');
    graphqlRequests.forEach((req) => {
      console.log(`  - ${req.operationName}`);
    });

    // Check that GetGameById was NOT called (it should update via subscription)
    const gameByIdRequests = graphqlRequests.filter(
      (r) => r.operationName === 'GetGameById' || r.operationName === 'GetGame'
    );

    // We expect RecordGoal mutation but NOT GetGameById query
    expect(graphqlRequests.some((r) => r.operationName === 'RecordGoal')).toBe(
      true
    );

    // This is the key assertion - no refetch of the game should happen
    if (gameByIdRequests.length > 0) {
      console.warn(
        `WARNING: GetGameById was called ${gameByIdRequests.length} time(s) after goal recording. This causes loading flicker!`
      );
    }
    expect(gameByIdRequests.length).toBe(0);
  });

  test('game state changes should not cause loading spinner', async ({
    page,
  }) => {
    // This test verifies that pause/resume also doesn't cause loading
    // (This should already work, but good to verify alongside goals)
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');

    const activeStatuses = [
      'FIRST HALF',
      'SECOND HALF',
      'HALFTIME',
      'IN PROGRESS',
    ];
    let activeGameBadge = null;

    for (const status of activeStatuses) {
      const badge = page.locator('span').filter({ hasText: status }).first();
      if (await badge.isVisible().catch(() => false)) {
        activeGameBadge = badge;
        break;
      }
    }

    if (!activeGameBadge) {
      test.skip(true, 'No active game found');
      return;
    }

    const gameCard = activeGameBadge.locator(
      'xpath=ancestor::div[contains(@class, "cursor-pointer")]'
    );
    await gameCard.click();
    await page.waitForURL(/\/games\/[a-z0-9-]+/);
    await page.waitForLoadState('domcontentloaded');

    // Open game menu (three dots)
    const menuButton = page.locator('button[title="Game options"]');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Look for Pause Clock button
    const pauseButton = page
      .locator('button')
      .filter({ hasText: 'Pause Clock' });
    const pauseVisible = await pauseButton.isVisible().catch(() => false);

    if (!pauseVisible) {
      // Maybe it's already paused, look for Resume
      const resumeButton = page
        .locator('button')
        .filter({ hasText: 'Resume Clock' });
      if (await resumeButton.isVisible().catch(() => false)) {
        await resumeButton.click();
      } else {
        test.skip(true, 'No pause/resume button found');
        return;
      }
    } else {
      await pauseButton.click();
    }

    // Verify no loading spinner appeared
    await page.waitForTimeout(500);
    const fullPageLoading = page.locator('text=Loading game...');
    await expect(fullPageLoading).toBeHidden();

    console.log('Game state change completed without loading spinner');
  });
});

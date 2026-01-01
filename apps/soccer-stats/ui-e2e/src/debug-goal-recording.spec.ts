import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

/**
 * Debug Goal Recording Test
 *
 * This test helps diagnose why the loading spinner appears when recording goals.
 * It captures:
 * 1. All GraphQL network requests
 * 2. Console logs from Apollo and subscriptions
 * 3. Timing of when loading states appear
 */
test.describe('Debug Goal Recording', () => {
  test('capture network activity and console logs during goal recording', async ({
    page,
  }) => {
    await setupClerkTestingToken({ page });

    // Collect all GraphQL operations
    const graphqlOperations: {
      timestamp: number;
      type: 'request' | 'response';
      operationName: string;
      elapsed?: number;
    }[] = [];

    // Collect console messages
    const consoleLogs: { timestamp: number; type: string; text: string }[] = [];

    // Track GraphQL requests/responses
    page.on('request', (request) => {
      if (request.url().includes('/graphql') && request.method() === 'POST') {
        try {
          const postData = request.postData();
          if (postData) {
            const body = JSON.parse(postData);
            graphqlOperations.push({
              timestamp: Date.now(),
              type: 'request',
              operationName: body.operationName || 'Unknown',
            });
          }
        } catch {
          // Ignore parse errors
        }
      }
    });

    page.on('response', (response) => {
      if (
        response.url().includes('/graphql') &&
        response.request().method() === 'POST'
      ) {
        try {
          const postData = response.request().postData();
          if (postData) {
            const body = JSON.parse(postData);
            graphqlOperations.push({
              timestamp: Date.now(),
              type: 'response',
              operationName: body.operationName || 'Unknown',
            });
          }
        } catch {
          // Ignore parse errors
        }
      }
    });

    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push({
        timestamp: Date.now(),
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Navigate to games list
    await page.goto('/games');
    await page.waitForLoadState('domcontentloaded');

    // Find an active game - check for any in-progress status
    // The games list uses div cards with onClick, not anchor tags
    // Active statuses: FIRST_HALF, HALFTIME, SECOND_HALF (or legacy IN_PROGRESS)
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
        console.log(`Found active game with status: ${status}`);
        break;
      }
    }

    if (!activeGameBadge) {
      console.log(
        'No active game found - test requires a game in FIRST_HALF or SECOND_HALF status'
      );
      test.skip(true, 'No active game found');
      return;
    }

    // Click the parent card (the div with cursor-pointer)
    const gameCard = activeGameBadge.locator(
      'xpath=ancestor::div[contains(@class, "cursor-pointer")]'
    );
    await gameCard.click();
    await page.waitForURL(/\/games\/[a-z0-9-]+/);
    await page.waitForLoadState('domcontentloaded');

    console.log('\n=== Initial load complete ===\n');

    // Clear tracking arrays
    graphqlOperations.length = 0;
    consoleLogs.length = 0;

    const goalRecordStartTime = Date.now();

    // Click Goal button
    const homeGoalButton = page
      .locator('button')
      .filter({ hasText: 'Goal' })
      .first();

    await homeGoalButton.click();

    // Check if modal appears
    const goalModal = page.locator('text=Record Goal').first();
    const modalVisible = await goalModal
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (modalVisible) {
      console.log('Modal opened');

      // Select first player if available
      const scorerSelect = page.locator('select').first();
      if (await scorerSelect.isVisible().catch(() => false)) {
        const options = await scorerSelect.locator('option').all();
        if (options.length > 1) {
          await scorerSelect.selectOption({ index: 1 });
        }
      }

      // Click Record Goal
      const recordButton = page
        .locator('button')
        .filter({ hasText: /^Record Goal$/ });
      await recordButton.click();

      // Wait for modal to close
      await expect(goalModal).toBeHidden({ timeout: 5000 });
      console.log('Modal closed');
    } else {
      console.log('No modal (GOALS_ONLY mode)');
    }

    // Wait and observe
    await page.waitForTimeout(3000);

    const goalRecordEndTime = Date.now();

    // Report findings
    console.log('\n=== GraphQL Operations (after goal click) ===');
    graphqlOperations.forEach((op) => {
      const relativeTime = op.timestamp - goalRecordStartTime;
      console.log(`  [${relativeTime}ms] ${op.type}: ${op.operationName}`);
    });

    console.log('\n=== Console Logs (filtered) ===');
    consoleLogs
      .filter(
        (log) =>
          log.text.includes('WebSocket') ||
          log.text.includes('GraphQL') ||
          log.text.includes('subscription') ||
          log.text.includes('refetch') ||
          log.text.includes('Loading')
      )
      .forEach((log) => {
        const relativeTime = log.timestamp - goalRecordStartTime;
        console.log(`  [${relativeTime}ms] ${log.type}: ${log.text}`);
      });

    console.log('\n=== Summary ===');
    console.log(`Total duration: ${goalRecordEndTime - goalRecordStartTime}ms`);

    // Count specific operations
    const opCounts = graphqlOperations.reduce((acc, op) => {
      const key = `${op.type}:${op.operationName}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Operation counts:', opCounts);

    // Key assertions for debugging
    const hasGetGameById = graphqlOperations.some(
      (op) =>
        op.type === 'request' &&
        (op.operationName === 'GetGameById' || op.operationName === 'GetGame')
    );

    console.log(`\nGetGameById was refetched: ${hasGetGameById}`);

    if (hasGetGameById) {
      console.warn(
        '⚠️  WARNING: GetGameById query was called - this causes loading spinner!'
      );
    } else {
      console.log('✅ No GetGameById refetch detected');
    }

    // Check for loading spinner via React component console log
    const loadingSpinnerLogs = consoleLogs.filter((log) =>
      log.text.includes('[Game Page Loading Spinner]')
    );
    console.log(`\nLoading spinner shown: ${loadingSpinnerLogs.length > 0}`);
    if (loadingSpinnerLogs.length > 0) {
      console.warn('⚠️  WARNING: Loading spinner was displayed!');
      loadingSpinnerLogs.forEach((log) => {
        const relativeTime = log.timestamp - goalRecordStartTime;
        console.log(`  [${relativeTime}ms] ${log.text}`);
      });
    } else {
      console.log('✅ No loading spinner detected');
    }

    // Don't fail the test - this is for debugging
    expect(true).toBe(true);
  });
});

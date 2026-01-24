import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test, Page } from '@playwright/test';

/**
 * Stats Clock Jump E2E Tests
 *
 * These tests verify the fix for the bug where player stats showed inflated
 * "time on field" values when transitioning from halftime to second half.
 *
 * The Bug:
 * - First half ends at ~0:30 (30 seconds played)
 * - Second half starts at 25:00 (game clock jumps to halfway point)
 * - Stats incorrectly showed 25+ minutes instead of ~0:00
 *
 * The Fix:
 * - game-stats.smart.tsx detects clock jumps > 60 seconds
 * - Resets queryTimeElapsedSeconds to prevent inflated delta calculation
 *
 * These tests verify the fix works correctly by:
 * 1. Creating a game with a lineup
 * 2. Starting first half, checking stats are reasonable
 * 3. Transitioning to halftime
 * 4. Starting second half
 * 5. Verifying stats don't show inflated times (< 60 seconds, not 25+ minutes)
 */

// Helper: Parse time string "M:SS" or "MM:SS" to total seconds
function parseTimeToSeconds(timeStr: string): number {
  const cleaned = timeStr.replace(/[^0-9:]/g, '').trim();
  const parts = cleaned.split(':');
  if (parts.length !== 2) return -1;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  if (isNaN(minutes) || isNaN(seconds)) return -1;
  return minutes * 60 + seconds;
}

// Helper: Create a new game and set up lineup
async function createGameWithLineup(
  page: Page,
  homeTeam: string,
  opponent: string,
): Promise<string> {
  await page.goto('/games/new');
  await page.waitForLoadState('domcontentloaded');

  // Select home team
  await page.getByLabel('Your Team').selectOption({ label: homeTeam });

  // Enter opponent name
  await page.getByRole('textbox', { name: 'Opponent' }).fill(opponent);

  // Select 5v5 format
  await page.getByLabel('Game Format').selectOption('5v5 (5v5)');

  // Create game
  await page.getByRole('button', { name: 'Create Game' }).click();

  // Wait for redirect
  await page.waitForURL(/\/games\/[a-f0-9-]+/);
  const gameId = page.url().split('/games/')[1].split('/')[0];

  return gameId;
}

// Helper: Add 5 players to the lineup
async function addPlayersToLineup(page: Page): Promise<void> {
  const positions = ['GK', 'LB', 'RB', 'LM', 'ST'];
  // Use exact player button names to avoid regex matching issues
  const playerButtonNames = [
    '#1 Alex',
    '#7 Sam',
    '#10 Jordan',
    '#4 Casey',
    '#9 Riley',
  ];

  for (let i = 0; i < positions.length; i++) {
    const positionButton = page.getByRole('button', {
      name: `+ ${positions[i]}`,
    });
    await positionButton.click();

    // Wait for player selection modal
    await expect(
      page.getByRole('heading', { name: `Assign Player to ${positions[i]}` }),
    ).toBeVisible({ timeout: 5000 });

    // Select the player by exact name
    const playerButton = page.getByRole('button', {
      name: playerButtonNames[i],
      exact: true,
    });
    await playerButton.click();

    // Wait for modal to close
    await page.waitForTimeout(300);
  }
}

// Helper: Get player stats from the table
async function getPlayerStatsFromTable(
  page: Page,
): Promise<Array<{ name: string; time: string; timeSeconds: number }>> {
  const stats: Array<{ name: string; time: string; timeSeconds: number }> = [];
  const rows = await page.locator('table tbody tr').all();

  for (const row of rows) {
    const cells = await row.locator('td').all();
    if (cells.length >= 2) {
      const name = ((await cells[0].textContent()) || '').trim();
      const timeCell = (await cells[1].textContent()) || '';
      // Extract just the time portion (e.g., "0:16" from "0:16 On field")
      const timeMatch = timeCell.match(/(\d+:\d+)/);
      const time = timeMatch ? timeMatch[1] : '';
      const timeSeconds = parseTimeToSeconds(time);
      stats.push({ name, time, timeSeconds });
    }
  }

  return stats;
}

// Helper: Navigate to Stats tab
async function navigateToStatsTab(page: Page): Promise<void> {
  const statsButton = page.getByRole('button', { name: 'Stats' });
  await statsButton.click();
  // Wait for stats table to be visible
  await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
}

// Helper: Start first half (handles scrolling and visibility)
async function startFirstHalf(page: Page): Promise<void> {
  // Scroll to top to ensure button is visible
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const startButton = page.getByRole('button', { name: 'Start 1st Half' });
  await expect(startButton).toBeVisible({ timeout: 5000 });
  await startButton.click();

  // Wait for game to start - use exact match on the status badge
  await expect(page.getByText('1ST HALF', { exact: true }).first()).toBeVisible(
    {
      timeout: 5000,
    },
  );
}

test.describe('Stats Clock Jump Fix', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('stats should not show inflated times after second half starts', async ({
    page,
  }) => {
    // Create a new game
    const gameId = await createGameWithLineup(
      page,
      'Thunder FC',
      'Clock Jump Test Opponent',
    );
    console.log(`Created game: ${gameId}`);

    // Add players to lineup
    await addPlayersToLineup(page);
    console.log('Added 5 players to lineup');

    // Start first half
    await startFirstHalf(page);
    console.log('First half started');

    // Wait a few seconds to accumulate some play time
    await page.waitForTimeout(3000);

    // Check stats during first half
    await navigateToStatsTab(page);
    const firstHalfStats = await getPlayerStatsFromTable(page);
    console.log('First half stats:', JSON.stringify(firstHalfStats, null, 2));

    // Verify first half stats are reasonable (< 30 seconds)
    for (const stat of firstHalfStats) {
      expect(stat.timeSeconds).toBeLessThan(30);
      expect(stat.timeSeconds).toBeGreaterThanOrEqual(0);
    }

    // Transition to halftime
    const halftimeButton = page.getByRole('button', { name: 'Half Time' });
    await halftimeButton.click();
    await expect(
      page.getByText('HALF TIME', { exact: true }).first(),
    ).toBeVisible({ timeout: 5000 });
    console.log('Transitioned to halftime');

    // Check stats at halftime
    await navigateToStatsTab(page);
    const halftimeStats = await getPlayerStatsFromTable(page);
    console.log('Halftime stats:', JSON.stringify(halftimeStats, null, 2));

    // Stats should still be reasonable at halftime
    for (const stat of halftimeStats) {
      expect(stat.timeSeconds).toBeLessThan(30);
    }

    // Start second half - THIS IS THE CRITICAL TRANSITION
    const startSecondHalfButton = page.getByRole('button', {
      name: 'Start 2nd Half',
    });
    await startSecondHalfButton.click();
    await expect(
      page.getByText('2ND HALF', { exact: true }).first(),
    ).toBeVisible({ timeout: 5000 });
    console.log('Second half started');

    // CRITICAL: Check stats immediately after second half starts
    // Before the fix, this would show ~25 minutes
    // After the fix, it should show < 60 seconds
    await navigateToStatsTab(page);

    // Wait a moment for stats to update
    await page.waitForTimeout(500);

    const secondHalfStats = await getPlayerStatsFromTable(page);
    console.log(
      'Second half stats (immediately after start):',
      JSON.stringify(secondHalfStats, null, 2),
    );

    // THE KEY ASSERTION: Stats should NOT show inflated times
    // Before fix: would show 25+ minutes (1500+ seconds)
    // After fix: should show < 60 seconds
    for (const stat of secondHalfStats) {
      expect(stat.timeSeconds).toBeLessThan(60);
      expect(stat.timeSeconds).toBeGreaterThanOrEqual(0);
      console.log(
        `${stat.name}: ${stat.time} (${stat.timeSeconds}s) - PASS (< 60s)`,
      );
    }

    console.log(
      'SUCCESS: Stats do not show inflated times after second half start',
    );
  });
});

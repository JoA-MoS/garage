import { expect, Page } from '@playwright/test';

/**
 * Helpers for driving a live game through the real UI.
 *
 * Data: the e2e user's managed team and players come from the dev seed
 * (`pnpm nx db:seed:dev soccer-stats-api`,
 * apps/soccer-stats/api/database/seeds/seed-dev-data.sql).
 */

/** The seeded managed team the e2e user coaches. */
export const HOME_TEAM = 'Thunder FC';

/** A 5v5 starting lineup (formation 2-2) from the seeded roster. */
export const STARTERS: ReadonlyArray<{ position: string; player: string }> = [
  { position: 'GK', player: '#1 Alex Johnson' },
  { position: 'LB', player: '#7 Sam Williams' },
  { position: 'RB', player: '#10 Jordan Brown' },
  { position: 'LM', player: '#4 Casey Davis' },
  { position: 'RM', player: '#9 Riley Miller' },
];

/** Creates a 5v5 game for HOME_TEAM and returns its ID. */
export async function createGame(
  page: Page,
  opponent = `E2E Opponent ${Date.now()}`,
): Promise<string> {
  await page.goto('/games/new');
  await page.getByLabel('Your Team').selectOption({ label: HOME_TEAM });
  await page.getByRole('textbox', { name: 'Opponent' }).fill(opponent);
  await page.getByLabel('Game Format').selectOption('5v5 (5v5)');
  await page.getByRole('button', { name: 'Create Game' }).click();

  await page.waitForURL(/\/games\/[a-f0-9-]+/);
  return page.url().split('/games/')[1].split('/')[0];
}

/**
 * Places each starter: tap the empty position on the field ("+ GK"), then
 * the player in the lineup panel's roster ("#1 Alex Johnson").
 */
export async function setStartingLineup(
  page: Page,
  starters = STARTERS,
): Promise<void> {
  for (const { position, player } of starters) {
    await page.getByRole('button', { name: `+ ${position}` }).click();
    await page.getByRole('button', { name: player, exact: true }).click();
    await expect(
      page.getByRole('button', { name: `+ ${position}` }),
    ).toHaveCount(0);
  }
  await expect(page.getByText('Lineup complete')).toBeVisible();
}

/**
 * Adds a roster player to the game's bench (tap them, then "Add to bench").
 * Only game-roster players appear on the bench once the game starts.
 */
export async function addToBench(page: Page, player: string): Promise<void> {
  await page.getByRole('button', { name: player, exact: true }).click();
  await page.getByRole('button', { name: /Add to bench/ }).click();
  await expect(
    page.getByRole('button', { name: player, exact: true }),
  ).toHaveCount(0);
}

async function expectStatus(page: Page, status: string): Promise<void> {
  await expect(page.getByText(status, { exact: true }).first()).toBeVisible();
}

export async function startFirstHalf(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Start 1st Half' }).click();
  await expectStatus(page, '1ST HALF');
}

export async function goToHalftime(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Half Time' }).click();
  await expectStatus(page, 'HALF TIME');
}

export async function startSecondHalf(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Start 2nd Half' }).click();
  await expectStatus(page, '2ND HALF');
}

export async function endGame(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'End Game' }).click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Half Time' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'End Game' })).toHaveCount(0);
}

/**
 * A player's card on the field during play, e.g.
 * "Alex Johnson 00:12 Live · GK" (the badge between time and position
 * reflects the connection, so it isn't matched). Use with
 * toContainText('· GK').
 */
export function onFieldCard(page: Page, name: string) {
  return page.getByRole('button', {
    name: new RegExp(`^${name} \\d+:\\d+.* · `),
  });
}

/**
 * Substitutes through the substitution panel: open it, tap the bench player
 * coming in, tap the field player going out, then confirm.
 */
export async function substitute(
  page: Page,
  { playerIn, playerOut }: { playerIn: string; playerOut: string },
): Promise<void> {
  const openPanel = page.getByRole('button', { name: 'Substitutions' });
  if (await openPanel.isVisible()) await openPanel.click();

  await page.getByRole('button', { name: new RegExp(`^${playerIn} `) }).click();
  await expect(page.getByText(`Bringing in: ${playerIn}`)).toBeVisible();
  await onFieldCard(page, playerOut).click();
  await page.getByRole('button', { name: 'Confirm All (1)' }).click();
}

/** The outbox's "Syncing N change(s)…" indicator. */
export function syncingIndicator(page: Page) {
  return page.getByRole('status').filter({ hasText: /Syncing/ });
}

/**
 * Creates a game, sets the starting lineup and kicks off the first half,
 * then waits for the kickoff to settle: the status change syncs through the
 * outbox, and the server's period-start event triggers a game refresh.
 * Tests that watch network traffic must not mistake that for their own.
 */
export async function startLiveGame(page: Page): Promise<string> {
  const gameId = await createGame(page);
  await setStartingLineup(page);
  await startFirstHalf(page);
  await settle(page);
  return gameId;
}

/**
 * Waits until queued changes have synced and no GraphQL HTTP request has
 * started or finished for `quietMs` (long enough to cover the game page's
 * 150ms debounced refresh after period and substitution events).
 */
export async function settle(page: Page, quietMs = 750): Promise<void> {
  await expect(syncingIndicator(page)).toHaveCount(0, { timeout: 15_000 });

  let inFlight = 0;
  let lastActivity = Date.now();
  const isGraphql = (url: string) => url.includes('/graphql');
  const onRequest = (r: { url(): string }) => {
    if (!isGraphql(r.url())) return;
    inFlight += 1;
    lastActivity = Date.now();
  };
  const onDone = (r: { url(): string }) => {
    if (!isGraphql(r.url())) return;
    inFlight = Math.max(0, inFlight - 1);
    lastActivity = Date.now();
  };
  page.on('request', onRequest);
  page.on('requestfinished', onDone);
  page.on('requestfailed', onDone);
  try {
    await expect
      .poll(() => inFlight === 0 && Date.now() - lastActivity >= quietMs, {
        timeout: 15_000,
      })
      .toBe(true);
  } finally {
    page.off('request', onRequest);
    page.off('requestfinished', onDone);
    page.off('requestfailed', onDone);
  }
}

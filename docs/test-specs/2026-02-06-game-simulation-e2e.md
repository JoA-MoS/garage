# Game Simulation E2E Test Specification

Test spec derived from manual Playwright-driven simulation on 2026-02-06.
See `docs/bugs/2026-02-06-game-simulation-bugs.md` for the full bug tracker.

## Test Overview

Simulate a full 9v9 game (60 min) between two managed teams with:

- Multiple substitution rounds per half (3-4 players each)
- Goals scored by both teams throughout
- Halftime lineup rotation (all benched players swapped back onto field)
- Post-game stats verification

**Game used in manual test:** `6dfb4073-f325-4b61-9bca-936fc533f5e0`
**Teams:** Seattle Sounders FC (3-4-1) vs Inter Miami CF (3-3-2)

---

## Prerequisites

- Game: 9v9 (60 min) with two managed teams (each having 14 players in roster)
- Both teams must have more players than field positions (9 field + 5 bench)
- Auth: Clerk testing token via `setupClerkTestingToken({ page })`
- Base URL: `http://localhost:4200`

---

## Known Interaction Patterns & Workarounds

### 1. Fixed Bottom Panel Overlay Blocking Field Clicks

The substitution panel and lineup panel are positioned `fixed` at the bottom of the viewport. Playwright's click action fails with "element is intercepted by another element" when clicking field positions (GK, LB, CM, RM, ST, etc.) because the panel overlaps.

**Workaround:** Use JavaScript `.click()` via `page.evaluate()`:

```typescript
// Instead of:
await page.getByRole('button', { name: '+ GK' }).click(); // FAILS - intercepted

// Use:
const button = page.getByRole('button', { name: '+ GK' });
await button.evaluate((el: HTMLElement) => el.click()); // WORKS
```

This was needed for virtually every field position click throughout the simulation.

### 2. Substitution Panel Flows

**Bench-first (standard mid-game substitution):**

1. Click bench player in substitution panel
2. Click field player to replace (may need `evaluate` workaround)
3. Queued item appears in panel
4. Repeat for additional subs
5. Click "Confirm All (N)" to execute

**Field-first:**

1. Click field player
2. Click bench player to replace them
3. Same queue + confirm flow

### 3. Halftime Lineup Panel Flow

During HALFTIME, the lineup panel (not substitution panel) is used:

1. Click bench player
2. Click empty field position OR occupied position to assign/replace
3. Queued as "A" (assignment) items
4. Click "Confirm Lineup (N changes)"

### 4. Goal Recording Flow

1. Events tab → click "Add Goal" button
2. Select team (dropdown)
3. Select scorer (dropdown)
4. Optionally select assisting player
5. Period and time auto-populated (but see BUG-004 - period may default wrong)
6. Click "Save"

### 5. Game State Transitions

```
SCHEDULED → (Start 1st Half) → FIRST_HALF → (Half Time) → HALFTIME
→ (Start 2nd Half) → SECOND_HALF → (End Game) → COMPLETED
```

Each transition is via: Game options menu (⋮) → menu item.

---

## Test Flow (Step-by-Step)

### Phase 1: Pre-Game Setup

```
1. Navigate to game page: /games/{gameId}/lineup
2. Select Seattle Sounders FC tab
3. Set formation to 3-4-1
4. Assign 9 players to field positions:
   - GK: Stefan Frei
   - CB: Yeimar Gómez
   - LB: Nouhou Tolo
   - RB: Jackson Ragen
   - CM: João Paulo
   - CM: Cristian Roldan
   - LM: Alex Roldan
   - RM: Albert Rusnák
   - ST: Jordan Morris
5. Add 5 players to bench: Ruidíaz, Atencio, Thomas, Chú, Vargas

ASSERT: Field shows 9 filled positions
ASSERT (BUG-001): Lineup panel counter should show "9/9" (currently shows "8/9")

6. Repeat for Inter Miami CF with formation 3-3-2:
   - GK: Drake Callender
   - CB: Tomás Avilés
   - LB: Jordi Alba
   - RB: DeAndre Yedlin
   - CM: Sergio Busquets
   - LM: Diego Gómez
   - RM: Robert Taylor
   - ST: Luis Suárez
   - ST: Lionel Messi
   Bench: Campana, CJ Dos Santos, Cremaschi, Freire, Ruiz
```

### Phase 2: Start Game & First Half Substitutions

```
7. Start 1st Half via game options menu
   ASSERT: Status shows "1ST HALF"
   ASSERT: Game timer is running

8. Wait ~1:30 of game time

9. Seattle subs round 1 (bench-first flow):
   - Ruidíaz for Morris (ST)
   - Atencio for Paulo (CM)
   - Chú for Rusnák (RM)
   Click "Confirm All (3)"

   ASSERT: 3 substitution events appear in Events tab
   ASSERT: Field shows updated players
   ASSERT: Bench shows Morris, Paulo, Rusnák

10. Record Goal: Seattle - Ruidíaz (assist: C.Roldan)
    ASSERT: Score updates to 1-0
    ASSERT: Goal event appears in Events tab

11. Wait ~2 min, then Seattle subs round 2:
    - Morris for Ruidíaz (ST)
    - Paulo for Atencio (CM)
    - Vargas for Chú (RM)
    Click "Confirm All (3)"

12. Record Goal: Inter Miami - Messi (assist: Busquets)
    ASSERT: Score updates to 1-1

13. Wait ~5 min, then Inter Miami subs round 1:
    - Campana for Suárez (ST)
    - Cremaschi for Taylor (RM)
    - Freire for Yedlin (RB)

14. Record Goal: Inter Miami - Campana (assist: Messi)
    ASSERT: Score updates to 1-2

15. Seattle subs round 3:
    - Rusnák for Vargas (RM)
    - Ruidíaz for Morris (ST)
    - Chú for A.Roldan (LM)

16. Record Goal: Seattle - Ruidíaz (assist: Rusnák)
    ASSERT: Score updates to 2-2

17. Inter Miami subs round 2:
    - Suárez for Campana (ST)
    - Taylor for Cremaschi (RM)
    - Ruiz for D.Gómez (LM)

18. Record Goal: Inter Miami - Messi (assist: Suárez)
    ASSERT: Score updates to 2-3
```

**Play time assertions at this point (BUG-002 regression):**

```
ASSERT: No bench player's play time exceeds total elapsed game time
ASSERT (BUG-002): Seattle bench players should have accurate times
  - e.g., if game clock is ~15 min, no player should show > 15 min
```

### Phase 3: Halftime & Lineup Rotation

```
19. Trigger Halftime via game options menu
    ASSERT: Status shows "HALFTIME"
    ASSERT: Period End event with 18 child SUBSTITUTION_OUT events

20. Seattle halftime rotation (lineup panel):
    Queue 5 bench→field swaps:
    - Thomas → GK (replacing Frei)
    - A.Roldan → LM (replacing Chú)
    - Atencio → CM (replacing Paulo or C.Roldan)
    - Morris → ST (replacing Ruidíaz)
    - Vargas → RM (replacing Rusnák)
    Click "Confirm Lineup (5 changes)"

    ASSERT (BUG-003): All 5 swaps should apply (currently only 2-3 apply)
    ASSERT: Field shows 9 players (new starters)
    ASSERT: Bench shows 5 displaced players
    ASSERT: No players "disappear" from both field and bench

21. Inter Miami halftime rotation:
    Queue 5 bench→field swaps:
    - CJ Dos Santos → GK (replacing Callender)
    - Yedlin → RB (replacing Freire)
    - D.Gómez → LM (replacing Ruiz)
    - Cremaschi → RM (replacing Taylor)
    - Campana → ST (replacing Suárez)
    Click "Confirm Lineup (5 changes)"

    Same assertions as step 20.
```

### Phase 4: Second Half & More Goals

```
22. Start 2nd Half via game options menu
    ASSERT: Status shows "2ND HALF"
    ASSERT: Game timer running

23. Verify Period 2 PERIOD_START event data via GraphQL:
    ASSERT (BUG-003/005): periodSecond should be 0, not 1800
    ASSERT: Child count should be 18 (9 per team), not 34
    ASSERT: No duplicate player IDs in children

24. Record Goal: Seattle - A.Roldan (assist: Atencio)
    ASSERT (BUG-004): Goal dialog should default to Period 2
    ASSERT: Score updates to 3-3
    ASSERT (BUG-006/007): Goal shows correct scorer name without page refresh

25. Record Goal: Inter Miami - Messi (assist: Campana)
    ASSERT: Score updates to 3-4

26. End Game via game options menu
    ASSERT: Status shows "COMPLETED"
```

### Phase 5: Post-Game Stats Verification

```
27. Navigate to Stats tab

    Goals section:
    ASSERT: 7 goals listed with correct scorers, times, and assists
    ASSERT: Halftime divider between goals 5 and 6
    ASSERT: 2nd half goals show correct period time (not period 1 time)

    Seattle stats:
    ASSERT: Ruidíaz - 2 goals
    ASSERT: A.Roldan - 1 goal
    ASSERT: C.Roldan - 1 assist
    ASSERT: Rusnák - 1 assist
    ASSERT: Atencio - 1 assist

    Inter Miami stats:
    ASSERT: Messi - 3 goals, 1 assist
    ASSERT: Campana - 1 goal, 1 assist
    ASSERT: Busquets - 1 assist
    ASSERT: Suárez - 1 assist

    Play time:
    ASSERT (BUG-005): Full-game starters should show total time (both halves),
      not just 16:23 (1st half only)
    ASSERT (BUG-005): 2nd-half-only players (Thomas, CJ Dos Santos) should show
      non-zero time, not 0:00

28. Verify events via GraphQL API (optional deep validation):
    Fetch all events for the game and verify:
    - Period 1 PERIOD_START: 18 children, all periodSecond=0
    - Period 1 PERIOD_END: 18 children, periodSecond = halftime clock
    - Period 2 PERIOD_START: 18 children (not 34), periodSecond=0 (not 1800)
    - Period 2 PERIOD_END: 18 children (not 28), periodSecond = game end clock
    - All goals: correct period field (1 or 2 based on when scored)
    - No duplicate player IDs in any PERIOD_START children
```

---

## GraphQL API Validation Helper

The simulation revealed that many bugs are only detectable by inspecting raw event data.
This helper fetches and validates event structure:

```typescript
async function validateGameEvents(page: Page, gameId: string) {
  return await page.evaluate(async (id) => {
    const query = `query {
      game(id: "${id}") {
        events {
          id period periodSecond playerId
          eventType { name category }
          childEvents {
            playerId period periodSecond
            eventType { name }
          }
        }
      }
    }`;
    const resp = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await resp.json();
    return data.data.game.events;
  }, gameId);
}

// Validation assertions:
function assertPeriodStartValid(events: GameEvent[], period: string) {
  const periodStart = events.find((e) => e.eventType.name === 'PERIOD_START' && e.period === period);

  // periodSecond should be 0 for start of any period
  expect(periodStart.periodSecond).toBe(0);

  // No duplicate player IDs
  const playerIds = periodStart.childEvents.map((c) => c.playerId);
  const uniqueIds = new Set(playerIds);
  expect(playerIds.length).toBe(uniqueIds.size);

  // Should have exactly expectedCount starters (e.g., 18 for 9v9)
  expect(playerIds.length).toBe(18);
}
```

---

## Selector Reference

| Element               | Selector                                                                               | Notes                             |
| --------------------- | -------------------------------------------------------------------------------------- | --------------------------------- |
| Game options menu     | `button[title="Game options"]` or `page.getByRole('button', { name: 'Game options' })` |                                   |
| Start 1st Half        | `page.getByRole('button', { name: 'Start 1st Half' })`                                 |                                   |
| Half Time             | `page.getByRole('button', { name: 'Half Time' })`                                      |                                   |
| Start 2nd Half        | `page.getByRole('button', { name: 'Start 2nd Half' })`                                 |                                   |
| End Game              | menu item via game options                                                             |                                   |
| Lineup tab            | `page.getByRole('button', { name: 'Lineup' })`                                         |                                   |
| Stats tab             | `page.getByRole('button', { name: 'Stats' })`                                          |                                   |
| Events tab            | `page.getByRole('button', { name: 'Events' })`                                         |                                   |
| Team tab (lineup)     | `page.getByRole('button', { name: 'Seattle Sounders FC' })`                            |                                   |
| Formation selector    | `page.getByRole('combobox')` with label "Formation:"                                   |                                   |
| Empty field position  | `page.getByRole('button', { name: '+ GK' })`                                           | Use `.evaluate(el => el.click())` |
| Filled field position | `page.getByRole('button', { name: 'GK Stefan Frei' })`                                 | Use `.evaluate(el => el.click())` |
| Bench player          | `page.getByRole('button', { name: 'B Raúl Ruidíaz' })`                                 | "B" prefix = bench                |
| Confirm All (subs)    | `page.getByRole('button', { name: /Confirm All/ })`                                    |                                   |
| Confirm Lineup        | `page.getByRole('button', { name: /Confirm Lineup/ })`                                 |                                   |
| Add Goal button       | `page.getByRole('button', { name: 'Add Goal' })`                                       | Events tab                        |
| Score display         | Team name parent → sibling with score number                                           |                                   |
| Game status badge     | `page.getByText('1ST HALF', { exact: true })`                                          |                                   |
| Stats table rows      | `page.locator('table tbody tr')`                                                       |                                   |
| Event child expand    | `page.getByRole('button', { name: /\d+ players/ })`                                    |                                   |

---

## Bug Regression Assertions Summary

| Bug     | Assertion                                                                          | Current Expected Failure                      |
| ------- | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| BUG-001 | Lineup panel counter shows "9/9" when all positions filled                         | Shows "8/9"                                   |
| BUG-002 | No bench player's play time > elapsed game time (home team)                        | Seattle starters inflated                     |
| BUG-003 | Halftime batch applies all N swaps; field shows 9 players; bench shows N displaced | Only 2-3 of 5 apply, players vanish           |
| BUG-004 | Goal dialog period defaults to current period (2 in 2nd half)                      | Defaults to 1                                 |
| BUG-005 | Post-game stats: starters show total time across both halves                       | Capped at halftime time; 2nd-half-only = 0:00 |
| BUG-006 | 2nd half goals show correct scorer without page refresh                            | Intermittently shows "Unknown"                |
| BUG-007 | Multi-goal scorer count correct without page refresh                               | Intermittently undercounted                   |

---

## Timing Considerations

- The real-time game clock runs continuously. Substitution and goal recording take ~5-15 seconds each.
- A full simulation with 5 sub rounds + 7 goals + halftime takes ~25-35 minutes of wall time.
- For faster CI runs, consider:
  - Fewer substitution rounds (1 per team per half)
  - Fewer goals (2-3 total)
  - Shorter wait times between actions
  - Using a smaller format (5v5 with 3 field + 2 bench)

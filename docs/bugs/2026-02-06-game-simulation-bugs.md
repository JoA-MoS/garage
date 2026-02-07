# Game Simulation Bug Tracker - 2026-02-06

Bugs discovered during Playwright-driven game simulation with substitutions every ~7 minutes.

## Test Setup

- Game: 6dfb4073-f325-4b61-9bca-936fc533f5e0
- Teams: Seattle Sounders FC (3-4-1) vs Inter Miami CF (3-3-2)
- Format: 9v9 (60 min)
- Substitution cadence: 3-4 players every ~7 minutes
- Halftime: Rotate all benched players back onto field

---

## Bugs Found

### BUG-001: Lineup panel counter shows 8/9 when all 9 field positions are filled

- **Severity:** Low (cosmetic)
- **Location:** Lineup panel bottom bar (collapsed state)
- **Steps to reproduce:**
  1. In SCHEDULED game, assign players to all 9 field positions via the field visualization
  2. Add remaining players to bench
  3. Observe the collapsed lineup panel at the bottom
- **Expected:** Counter shows "9/9" and "0 positions remaining"
- **Actual:** Counter shows "8/9" and "1 positions remaining" even though all 9 field positions have players assigned
- **Affects:** Both Seattle Sounders FC and Inter Miami CF lineups
- **Notes:** The field visualization correctly shows all 9 positions filled. The discrepancy is only in the bottom panel's counter. Likely the lineup panel tracks assignments through a different code path than the main lineup tab's position clicks.

### BUG-002: Play time exceeds total elapsed game time for benched players

- **Severity:** Medium (data accuracy)
- **Location:** Bench player list, play time column
- **Steps to reproduce:**
  1. Start a game (1st half)
  2. Let the clock run to ~06:52
  3. Perform 2 rounds of substitutions for Seattle Sounders
  4. Observe bench players' play time values
- **Expected:** No player's play time should exceed the total elapsed game time (~6-7 min at clock 06:52)
- **Actual:** Albert Rusnák shows 8 min play time at game clock 06:52 (~412 seconds elapsed). Other bench players (Ruidíaz, Atencio, Chú) show 3 min which is plausible.
- **Additional finding:** Events tab shows NO individual "Starter Entry" events for Seattle Sounders starters, only Inter Miami has visible starter entries. The PERIOD_START event says "18 players" but individual child events may not be rendering or structured correctly for the home team.
- **Likely root cause:** The `batchLineupChanges` mutation may structure PERIOD_START child events differently than expected by `calculatePlayTime`, or the `periodSecond` on starter events is incorrect, causing the stint start time to be earlier than game start.
- **Additional data points at halftime (16:23 game clock):**
  - Alex Roldan: 30 min (starter, subbed out at 13:48 → expected ~13 min)
  - Jordan Morris: 26 min (played 00:00-01:38 + 05:15-13:48 → expected ~10 min)
  - Obed Vargas: 8 min (played 05:15-13:48 → expected ~8 min, **correct**)
  - Inter Miami bench players (Taylor 12 min, Suárez 12 min, Yedlin 12 min) were correct
- **Pattern:** Bug appears to only affect Seattle Sounders (home team) players, not Inter Miami (away team). Starters and players with multiple stints are most inflated. Suggests issue with how PERIOD_START child events are structured for the home team via `batchLineupChanges`.

### BUG-003: Halftime batch lineup only partially applies when swapping 5 bench players onto field

- **Severity:** High (data integrity)
- **Location:** Halftime lineup panel → "Confirm Lineup (N changes)"
- **Steps to reproduce:**
  1. Trigger halftime
  2. In the halftime lineup panel, queue 5 bench→field assignments (replacing 5 current field players)
  3. Click "Confirm Lineup (5 changes)"
- **Expected:** All 5 bench players replace the 5 targeted field players. The 5 displaced field players move to bench.
- **Actual (Seattle):** Only 3 of 5 swaps applied correctly:
  - Thomas → GK (replacing Frei) ✓
  - A.Roldan → LM (replacing Chú) ✓
  - Atencio → CM (assigned, but displaced C.Roldan instead of targeted Paulo) ⚠️
  - Morris → ST (replacing Ruidíaz) ✗ NOT APPLIED
  - Vargas → RM (replacing Rusnák) ✗ NOT APPLIED
- **Side effects:**
  - Bench shows "0 players" despite 5 players being displaced
  - C.Roldan disappeared from both field and bench (not visible anywhere)
  - Panel counter still shows "8/9" (BUG-001)
- **Actual (Inter Miami):** Also only 2 of 5 swaps applied:
  - Yedlin → RB (replacing Freire) ✓
  - Campana → ST (replacing Suárez) ✓
  - CJ Dos Santos → GK (replacing Callender) ✗ NOT APPLIED
  - D.Gómez → LM (replacing Ruiz) ✗ NOT APPLIED
  - Cremaschi → RM (replacing Taylor) ✗ NOT APPLIED
- **Critical:** Both teams lost 5 players each to the void. Bench shows 0 for both teams in the 2nd half. Players that were successfully displaced (Freire, Suárez, Frei, Chú, C.Roldan) AND players that were never placed (Morris, Vargas, CJ Dos Santos, D.Gómez, Cremaschi) all disappeared from the roster entirely.
- **Pattern:** The positions that DID get swapped were the first 2-3 in the queue. The later queue items (positions 4-5) silently failed. The batch may be truncating or erroring partway through.
- **Likely root cause:** The `batchLineupChanges` mutation may have issues processing multiple assignments that displace occupied positions in the same batch. The batch appears to partially execute, with later items failing silently. Position slots with duplicate types (e.g., two CMs in 3-4-1) may cause incorrect displacement targeting.

### BUG-004: Goal dialog shows "Period 1" during 2nd half

- **Severity:** High (data integrity)
- **Location:** Goal recording dialog → Period selector
- **Steps to reproduce:**
  1. Start a game and play through halftime into the 2nd half
  2. Open the goal recording dialog (click "+" → "Goal")
  3. Observe the period field
- **Expected:** Period field should default to "Period 2" (or whichever period is currently active)
- **Actual:** Period field shows "Period 1" even though the game clock clearly shows 2nd half time (26:53+)
- **Impact:** Goals recorded during the 2nd half are saved with `period: "1"` in the database, which causes cascading issues in stats and play time calculations
- **Notes:** The dialog likely reads the period from a stale state or defaults to "1" instead of checking the current game period. Both goals scored in the 2nd half (A.Roldan at 28:39 and Messi at 29:10) were affected.

### BUG-006: Post-game stats intermittently show "Unknown" as scorer for 2nd half goals

- **Severity:** Medium (data accuracy, intermittent)
- **Location:** Post-game stats page → Goals section
- **Steps to reproduce:**
  1. Record goals during the 2nd half (these are saved with `period: "1"` due to BUG-004)
  2. End the game
  3. View the post-game stats WITHOUT refreshing the page
- **Expected:** All goals show the correct scorer name and time
- **Actual:** Goals scored in the 2nd half intermittently show "Unknown" as the scorer. A full page refresh resolves the display issue — all 7 goals then show correct names.
- **Likely root cause:** Apollo cache inconsistency. The subscription-driven cache update for new goal events during the 2nd half may not correctly associate the `playerId` with the player's name when the goal's `period: "1"` / `periodSecond: 1719+` doesn't match any expected period 1 time range. On refresh, the full query re-fetches everything correctly. The underlying data IS correct in the database (confirmed via GraphQL query) — this is a cache/rendering issue.

### BUG-005: All players show 0:00 play time for 2nd half (no player gets credit for period 2)

- **Severity:** High (data accuracy)
- **Location:** Post-game stats page → Player stats → Time column
- **Steps to reproduce:**
  1. Play a game with halftime batch lineup changes via `batchLineupChanges`
  2. End the game
  3. View post-game stats for any player
- **Expected:** Players who played in both halves should show total time across both periods
- **Actual:** Every player's time is capped at their 1st half contribution. No player receives any 2nd half credit:
  - **Full-game starters** (Frei, Nouhou, Yeimar, Ragen, C.Roldan, Callender, Alba, Avilés, Busquets, Messi): all show **16:23** (halftime time only)
  - **2nd-half-only players** (Andrew Thomas, CJ Dos Santos): show **0:00**
  - Both teams affected equally
- **Root cause (confirmed via raw API data):**
  - Period 2 PERIOD_START has `periodSecond: 1800` (should be `0`)
  - `toAbsoluteSeconds("2", 1800, 1500)` = 3300 seconds (55 min)
  - Period 2 PERIOD_END has `periodSecond: 1766`
  - `toAbsoluteSeconds("2", 1766, 1500)` = 3266 seconds (54.4 min)
  - Every player's 2nd half stint = `3266 - 3300 = -34 seconds` → clamped to **0** by `Math.max(0, ...)`
  - The `batchLineupChanges` mutation sets an incorrect `periodSecond` on the Period 2 PERIOD_START event

### BUG-007: Post-game goal count intermittently incorrect for multi-goal scorer

- **Severity:** Medium (data accuracy, intermittent)
- **Location:** Post-game stats page → Player goal counts
- **Steps to reproduce:**
  1. Score multiple goals with the same player across both halves
  2. End the game
  3. View post-game stats WITHOUT refreshing the page
- **Expected:** Messi should show 3 goals (scored at 05:38, 16:15, 29:10)
- **Actual:** Messi intermittently shows only 1 goal. A full page refresh corrects the count to 3.
- **Likely root cause:** Same Apollo cache inconsistency as BUG-006. The 2nd half goals recorded with `period: "1"` (BUG-004) may not be correctly merged into the cached event list by the subscription handler, leading to missing goals in the stats aggregation until a full re-fetch. The underlying data IS correct — all 7 GOAL events exist in the database with correct `playerId` values.

---

## Game Timeline Summary

| Time   | Event                                                                           | Score   |
| ------ | ------------------------------------------------------------------------------- | ------- |
| 00:00  | Game started, both lineups set (9 field + 5 bench each)                         | 0-0     |
| 01:38  | Seattle subs round 1: Ruidíaz/Atencio/Chú in, Morris/Paulo/Rusnák out           | 0-0     |
| 03:03  | Goal - Seattle: Ruidíaz (assist: C.Roldan)                                      | 1-0     |
| 05:15  | Seattle subs round 2: Morris/Paulo/Vargas in, Ruidíaz/Atencio/Chú out           | 1-0     |
| 05:38  | Goal - Inter Miami: Messi (assist: Busquets)                                    | 1-1     |
| ~12:04 | Inter Miami subs round 1: Campana/Cremaschi/Freire in, Suárez/Taylor/Yedlin out | 1-1     |
| 12:42  | Goal - Inter Miami: Campana (assist: Messi)                                     | 1-2     |
| ~13:48 | Seattle subs round 3: Rusnák/Ruidíaz/Chú in, Vargas/Morris/A.Roldan out         | 1-2     |
| 14:10  | Goal - Seattle: Ruidíaz (assist: Rusnák)                                        | 2-2     |
| ~17:27 | Inter Miami subs round 2: Suárez/Taylor/Ruiz in, Campana/Cremaschi/D.Gómez out  | 2-2     |
| 16:17  | Goal - Inter Miami: Messi (assist: Suárez)                                      | 2-3     |
| 16:23  | Halftime triggered                                                              | 2-3     |
| HT     | Seattle halftime rotation: 3 of 5 applied (BUG-003), 5 players lost             | 2-3     |
| HT     | Inter Miami halftime rotation: 2 of 5 applied (BUG-003), 5 players lost         | 2-3     |
| 26:53  | 2nd half started                                                                | 2-3     |
| 28:39  | Goal - Seattle: A.Roldan (assist: Atencio) [recorded as Period 1 - BUG-004]     | 3-3     |
| 29:10  | Goal - Inter Miami: Messi (assist: Campana) [recorded as Period 1 - BUG-004]    | 3-4     |
| 29:20  | Game ended (COMPLETED)                                                          | **3-4** |

## Raw Event Analysis (GraphQL API inspection)

### Period 1 PERIOD_START (`period: "1"`, `periodSecond: 0`) — 18 children ✓

- **Seattle (9):** A.Roldan (LM), C.Roldan (CM), Frei (GK), Nouhou (LB), Rusnák (RM), Paulo (CM), Yeimar (CB), Ragen (RB), Morris (ST)
- **Inter Miami (9):** D.Gómez (LM), Alba (LB), Callender (GK), Busquets (CM), Messi (ST), Suárez (ST), Avilés (CB), Taylor (RM), Yedlin (RB)
- **All child events:** `period: "1"`, `periodSecond: 0`, `eventType: "SUBSTITUTION_IN"` ✓
- **UI rendering issue:** Individual "Starter Entry" event cards only render for Inter Miami. NO Seattle starter entries visible as separate cards in the timeline, though they do appear when expanding the "18 players" button.

### Period 1 PERIOD_END (`period: "1"`, `periodSecond: 983`) — 18 children ✓

- Correctly lists all 18 players on field at halftime (9 per team)
- All children: `periodSecond: 983`, `eventType: "SUBSTITUTION_OUT"` ✓

### Period 2 PERIOD_START (`period: "2"`, `periodSecond: 1800`) — 34 children ⚠️ CRITICAL BUGS

**Problem 1: Parent `periodSecond: 1800` is wrong.** Should be `0` (start of period 2). The value 1800 appears to be raw elapsed wall-clock seconds. `calculatePlayTime` computes absolute time as `(2-1) * 1500 + 1800 = 3300s` (55 min), which massively inflates any play time calculations that reference this event.

**Problem 2: 34 children instead of expected 18.** Breakdown:

- 28 unique player IDs + 6 duplicated = 34 total SUBSTITUTION_IN children
- Each team has 14 unique players (9 who were on field at halftime + 5 new halftime swaps)
- 6 continuing players (3 per team) appear TWICE — duplicate SUBSTITUTION_IN entries

**Problem 3: Both old AND new players for swapped positions.** For each halftime swap, the PERIOD_START includes SUBSTITUTION_IN for both the player being replaced AND the replacement:

| Position   | Old Player (should NOT be in P2 start) | New Player (should be) | Both present? |
| ---------- | -------------------------------------- | ---------------------- | ------------- |
| Seattle GK | Frei                                   | Thomas                 | Yes ⚠️        |
| Seattle LM | Chú                                    | A.Roldan               | Yes ⚠️        |
| Seattle CM | (one of Paulo/C.Roldan)                | Atencio                | Yes ⚠️        |
| Seattle ST | Ruidíaz                                | Morris                 | Yes ⚠️        |
| Seattle RM | Rusnák                                 | Vargas                 | Yes ⚠️        |
| Inter GK   | Callender                              | CJ Dos Santos          | Yes ⚠️        |
| Inter RB   | Freire                                 | Yedlin                 | Yes ⚠️        |
| Inter LM   | Ruiz                                   | D.Gómez                | Yes ⚠️        |
| Inter RM   | Taylor                                 | Cremaschi              | Yes ⚠️        |
| Inter ST   | Suárez                                 | Campana                | Yes ⚠️        |

**Key insight:** The backend DID process all 5 swaps for both teams — all 10 new players have SUBSTITUTION_IN events. The "partial application" seen in BUG-003 is a **UI rendering/state issue**, not a backend mutation failure. The field visualization only shows 9 positions, so having 14 players assigned means 5 are invisible.

**Problem 4: Child events have `periodSecond: 0` but parent has `periodSecond: 1800`.** The `calculatePlayTime` function uses the parent's period/periodSecond for time calculations, meaning all 34 players get stints starting at absolute time 3300s instead of the correct period 2 start time.

### Period 2 PERIOD_END (`period: "2"`, `periodSecond: 1766`) — 28 children

- Lists all 28 unique players from the PERIOD_START (no duplicates here)
- All children: `periodSecond: 0` (inherit parent time)
- **Problem:** 28 players get SUBSTITUTION_OUT instead of 18, since the PERIOD_START incorrectly included both old and new players for every swapped position

### Goal Events — ALL recorded as Period 1 (BUG-004 confirmed)

```
Goal 1: period="1" periodSecond=183  (3:03)  — Ruidíaz       ✓ correct
Goal 2: period="1" periodSecond=338  (5:38)  — Messi         ✓ correct
Goal 3: period="1" periodSecond=760  (12:40) — Campana       ✓ correct
Goal 4: period="1" periodSecond=848  (14:08) — Ruidíaz       ✓ correct
Goal 5: period="1" periodSecond=975  (16:15) — Messi         ✓ correct
Goal 6: period="1" periodSecond=1719 (28:39) — A.Roldan      ⚠️ WRONG: should be period="2"
Goal 7: period="1" periodSecond=1750 (29:10) — Messi         ⚠️ WRONG: should be period="2"
```

Goals 6 and 7 have `periodSecond` values exceeding the period 1 end time (983s), making them impossible period 1 events. This is the raw data confirming BUG-004.

### Root Cause Summary

The `batchLineupChanges` mutation (used for halftime lineup changes) has two distinct bugs:

1. **Additive-only starters:** When creating the Period 2 PERIOD_START, it adds SUBSTITUTION_IN events for the new lineup BUT also retains entries for all players from the PERIOD_END. It should only include players who will be on the field in period 2 (replacing swapped-out players, not keeping them).

2. **Duplicate continuing players:** Players who were on the field at halftime AND are staying on the field get SUBSTITUTION_IN entries from BOTH the "carry over from period 1" logic AND the "new period 2 lineup" logic, resulting in duplicates.

The UI then sees 14 players per team but can only display 9 field positions, causing the "missing player" illusion (BUG-003). Play time calculations get inflated stints from duplicate and phantom entries (BUG-002/BUG-006).

---

## Bug Priority for Fixing

### Tier 1: `batchLineupChanges` mutation (backend — root cause of 3 bugs)

1. **BUG-003 + BUG-005** (Critical) - `batchLineupChanges` creates the Period 2 PERIOD_START with:
   - Wrong `periodSecond: 1800` instead of `0` → zeroes out ALL 2nd half play time (BUG-005)
   - Additive child events (both old + new players for swapped positions) → 14 players per team instead of 9 → phantom field state (BUG-003)
   - Duplicate SUBSTITUTION_IN entries for continuing players → double-counted stints

### Tier 2: UI state bugs

2. **BUG-004** (High) - Goal dialog defaults to Period 1 during 2nd half (UI — separate from batch mutation)
3. **BUG-006 + BUG-007** (Medium) - Apollo cache not correctly rendering 2nd half goals until page refresh (UI — may be consequence of BUG-004's impossible `period: "1"` + `periodSecond: 1719` values confusing the cache merge logic)

### Tier 3: Other

4. **BUG-002** (Medium) - In-game play time inflation for home team starters (may be related to PERIOD_START child event structure)
5. **BUG-001** (Low) - Lineup panel counter cosmetic issue

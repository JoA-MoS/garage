# Live-Play Card View & Substitution Panel Simplification

**Date:** 2026-09-17
**Status:** Approved, pending implementation plan
**App:** `apps/soccer-stats`

## Problem

Today, the Lineup tab always renders the SVG field layout (`FieldLineup`), regardless
of game phase. During live play, that field-first mental model doesn't match how
coaches actually think about substitutions: they aren't assigning a player to a
_position slot_, they're swapping one _player_ for another, and the incoming player
should simply inherit whatever position the outgoing player held.

The substitution panel already has an internal "On Field" tab that shows on-field
players as cards (as of the recent card-unification work — see "Prior art" below),
but it's nested inside a bottom-sheet tab switcher, disconnected from the main Lineup
tab content, and largely duplicates information the coach could see more directly.

This spec restructures the UI so that:

- Pregame and halftime keep the field layout (`FieldLineup`), since that's genuinely a
  position-assignment task (building a formation from scratch).
- Live play shows a **card view** of on-field players as the primary Lineup tab
  content, replacing the field layout for that phase.
- The substitution panel's now-redundant "On Field" tab is removed; on-field card
  selection happens directly in the hoisted card view instead.
- A manual Field/Card toggle remains available in every phase, defaulting per-phase
  and resetting on every phase transition.

## Prior art / what is NOT changing

A codebase survey (2026-09-17) confirmed the backend already implements the
player-for-player, position-inheriting model this spec assumes:

- `SubstitutionService.substitutePlayer` (`apps/soccer-stats/api/src/modules/game-events/services/substitution.service.ts:238-316`)
  creates a `SUBSTITUTION_OUT` event, then a `SUBSTITUTION_IN` event whose `position`
  is explicitly copied from the outgoing player's event (line 298-300). The
  `SUBSTITUTION_IN` event's `parentEventId` points at the `SUBSTITUTION_OUT` event,
  so "who replaced whom" is already tracked.
- `EventManagementService.swapPositions` (`apps/soccer-stats/api/src/modules/game-events/services/event-management.service.ts:198+`)
  already exchanges the `position` field between two specific on-field players'
  events — not a slot-based operation.
- `BATCH_LINEUP_CHANGES` (`apps/soccer-stats/ui/src/app/services/games-graphql.service.ts:654`)
  already batches subs + swaps together for the halftime "confirm all" flow.

**No GraphQL schema, mutation, or backend service changes are needed.** This is a
frontend-only restructuring of which components render when, and where taps are
captured.

Recent commits (`8cdd605`, `a791f0d`, `fad449c`) unified the substitution panel's
Bench and On-Field tabs onto a single `PlayerCard` component with a live `MM:SS`
ticker for on-field players. That `PlayerCard` and its live-ticker behavior are
reused as-is by this spec — only its container changes.

## Non-goals

- No change to how pregame/halftime formation assignment works (`FieldLineup` stays
  as-is for those phases).
- No change to `trackPositions: false` (no-position-tracking) team behavior — those
  games already show pure in/out tracking; this spec is about how _position-tracked_
  games behave during live play, bringing it in line with a card view.
- No new mutations, DTOs, or entity fields.

## Design

### 1. Component changes

- **Extract `OnFieldCardGrid`** (new presentational component, name TBD at
  implementation time, suggested location `apps/soccer-stats/ui/src/app/components/presentation/on-field-card-grid.presentation.tsx`)
  from the on-field tab's markup currently in
  `substitution-panel.presentation.tsx` (`PlayerSelectionTabs`, lines ~519-640, and
  the shared `PlayerCard`, lines 447-514). It renders the on-field `PlayerCard` grid,
  taking: the on-field lineup, current selection (`{playerId, direction} | null`),
  queued-item badges, and a tap handler. `PlayerCard` itself is reused unmodified
  (or moved alongside it if it needs to be shared between two presentational
  components — implementation detail for the plan).

- **`GameLineupTab`** (`apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.tsx`)
  gains a `viewMode: 'field' | 'card'` and renders `FieldLineup` or the new
  `OnFieldCardGrid` accordingly, plus a toggle control (see §3).

- **`SubstitutionPanel`** (`substitution-panel.presentation.tsx` /
  `substitution-panel.smart.tsx`) drops `PlayerSelectionTabs`'s "On Field" tab and
  the tab-switching UI entirely. The panel's body becomes just the Bench card grid;
  the queued-changes list (shown in the `'expanded'` panel state) is unchanged.

### 2. Cross-component selection state

Today, `selection` (the in-progress "first tap" of a sub/swap pair) is local state
inside `substitution-panel.smart.tsx`, because both taps happened inside the panel.
Once on-field taps happen in the hoisted `OnFieldCardGrid` (a sibling of the panel,
mounted by `GameLineupTab`, not inside it), that state must be shared across both
components.

Introduce a small hook, e.g. `useLineupSelection()`, instantiated once in
`game.page.tsx` and passed down to both `GameLineupTab` (for on-field taps) and
`SubstitutionPanel` (for bench taps). It owns:

- `selection: { playerId, direction: 'bench-first' | 'field-first' } | null`
- The tap handlers that advance a pending selection into a completed pair, at which
  point the existing mutation logic fires (unchanged):
  - bench → field: substitution
  - field → bench: substitution (symmetric)
  - field → field: swap
- Clearing the selection after a completed pair or explicit cancel.

The actual mutation-calling logic (`executeSwapNow`, immediate vs. queued/batched
paths, `handleConfirmAll`) stays exactly where it is today in
`substitution-panel.smart.tsx` — only the _selection_ half of the state moves up.
The hook calls back into that existing logic once a pair completes; how exactly that
wiring happens (hook calls a callback prop vs. the smart component subscribes to the
hook's completed-pair event) is left to the implementation plan.

### 3. View toggle

A Field/Card toggle control in the Lineup tab (icon buttons or a segmented control,
matching existing tab-bar visual patterns in `game.page.tsx`). Default view mode is
computed from game phase:

| Phase                     | Default view |
| ------------------------- | ------------ |
| Pregame                   | Field        |
| Halftime                  | Field        |
| Live (period in progress) | Card         |
| Full time                 | Field        |

The coach can toggle to the other view at any time in any phase. Per confirmed
requirements, the manual override **resets to the phase default on every phase
transition** (kickoff, halftime, second-half kickoff, full time) — it does not
persist across phase boundaries. This keeps the mental model simple: "what you see
depends on where you are in the game, unless you just overrode it for _this_ moment."

### 4. Interaction flow (unchanged mutations, new tap locations)

All three existing tap-order flows are preserved; only _where_ the taps happen
changes for the on-field side:

1. **Bench-first substitution**: tap a bench card (in `SubstitutionPanel`) → tap an
   on-field card (now in the hoisted `OnFieldCardGrid`, not a nested tab) → sub
   queued/executed via existing `substitutePlayer`/`BATCH_LINEUP_CHANGES` logic.
2. **Field-first substitution**: tap an on-field card first → tap a bench card →
   same result, symmetric order.
3. **Field-first swap**: tap an on-field card → tap a second on-field card (both now
   in `OnFieldCardGrid`) → swap queued/executed via existing `swapPositions`/
   `SWAP_POSITIONS` logic.

No new mutation call sites, no new payload shapes — `useLineupSelection` simply
determines when a pair is complete and calls the same functions that already exist
in `substitution-panel.smart.tsx` today.

### 5. Testing

- New unit specs for the extracted `OnFieldCardGrid` presentational component
  (rendering, tap selection, live ticker, queued badges) — largely ported from the
  existing on-field-tab tests in `substitution-panel.presentation.spec.tsx`.
- Updated `substitution-panel.presentation.spec.tsx` / `.smart.spec.tsx`: remove
  on-field-tab assertions, verify bench-only rendering and that queued list/collapsed
  bar behavior is unchanged.
- New specs for `GameLineupTab`'s view-mode logic: correct default per phase, manual
  toggle within a phase, reset on phase transition (test all four transition edges:
  pregame→live, live→halftime, halftime→live, live→full-time).
- Specs for `useLineupSelection` covering all three tap-order combinations
  (bench-first, field-first-sub, field-first-swap) and cancel/re-selection.
- Existing E2E/Playwright substitution flows (if any target the "On Field" tab by
  role/label) will need selector updates to target the hoisted card view instead.

## Open implementation details (left to the plan)

- Exact file/component naming for the extracted grid and shared hook.
- Whether `useLineupSelection` communicates a completed pair via callback prop or an
  effect the smart component subscribes to.
- Whether the Field/Card toggle is a new small presentational component or inline
  markup in `GameLineupTab`.

These are implementation choices, not open design questions — none of them affect
the mutation contract, data flow direction, or user-facing behavior described above.

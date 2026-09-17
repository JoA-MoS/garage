# Live-Play Card View & Substitution Panel Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SVG field layout with a card grid as the primary Lineup-tab view during live play, and remove the substitution panel's now-redundant nested "On Field" tab, so on-field card taps happen directly in the hoisted grid instead.

**Architecture:** Extract the substitution panel's existing `PlayerCard` into a shared presentation component, build a new `OnFieldCardGrid` from it, and mount it inside `GameLineupTab` as an alternate to `FieldLineup`, chosen by a phase-based `viewMode`. Cross-component coordination for the one flow that has no existing external-prop equivalent (completing a position swap when the first tap already happened elsewhere) is added by mirroring the codebase's existing `externalFieldPlayerToReplace` pattern.

**Tech Stack:** React, TypeScript, Apollo Client, Tailwind CSS, Vitest + `@testing-library/react`, Nx monorepo (`apps/soccer-stats/ui`).

**Spec:** `docs/superpowers/specs/2026-09-17-live-play-card-view-substitution-design.md`

## Global Constraints

- No GraphQL schema, mutation, resolver, or entity changes — this is frontend-only (per spec "Prior art / what is NOT changing").
- No change to `trackPositions: false` team behavior (`PlayerListLineup` stays untouched) — per spec Non-goals.
- No change to pregame/halftime formation assignment (`FieldLineup` unchanged, still used for those phases) — per spec Non-goals.
- Manual Field/Card view-mode override resets to the phase default on every phase transition (kickoff, halftime, second-half kickoff, full time) — per spec §3, confirmed with user.
- Tap-to-select interaction (not drag-and-drop) — confirmed with user during brainstorming.

---

## Deviations from the spec, discovered during planning

Two things turned out different from the spec's assumptions once the actual code was read in full. Both are implementation-detail resolutions the spec explicitly left open ("Open implementation details... left to the plan"), not changes to user-facing behavior:

1. **No new `useLineupSelection` hook is needed.** `game.page.tsx` already threads cross-component selection state between `SubstitutionPanel` and `GameLineupTab` via a family of `external*`/`on*Handled` prop pairs (e.g. `externalFieldPlayerSelection`, `externalFieldPlayerToReplace`, `onBenchSelectionChange`). The only flow with no existing external-prop equivalent is **completing a position swap when the first on-field tap already happened elsewhere** (today this only works because both swap taps happen inside the panel's nested "On Field" tab). Task 4 adds one new pair, `externalFieldPlayerForSwap` / `onExternalFieldPlayerForSwapHandled`, mirroring the existing `externalFieldPlayerToReplace` pattern exactly. Every other flow (start a field-first or bench-first selection, complete a bench-first substitution) already has working external-prop plumbing and needs no new hook.
2. **The extracted `PlayerCard` needs two small, purely-additive capability fixes** to work as the _primary_ on-field view (it previously only appeared in a nested, pre-filtered "On Field" tab): an `isQueued` visual state (so a player queued for a change doesn't just vanish from the primary view), and working `isSelected` styling when `variant="onField"` (previously dead code, since the old tab filtered the selected player out of the list instead of highlighting it). Both are covered in Task 1.

---

## Task 1: Extract `PlayerCard` into a shared presentation component, with two additive fixes

**Files:**

- Create: `apps/soccer-stats/ui/src/app/components/presentation/player-card.presentation.tsx`
- Create: `apps/soccer-stats/ui/src/app/components/presentation/player-card.presentation.spec.tsx`
- Modify: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.tsx:441-513` (remove the inline `PlayerCard` definition, import it instead)

**Interfaces:**

- Produces: `PlayerCard` component and `PlayerCardProps` type, both exported from `player-card.presentation.tsx`:

  ```ts
  export interface PlayerCardProps {
    player: GqlRosterPlayer;
    variant: 'bench' | 'onField';
    timeSeconds: number;
    isLive: boolean;
    isSelected: boolean;
    isQueued?: boolean;
    positionLabel?: string | null;
    onClick: () => void;
  }
  export function PlayerCard(props: PlayerCardProps): JSX.Element;
  ```

- [ ] **Step 1: Write the failing test for the extracted component**

Create `apps/soccer-stats/ui/src/app/components/presentation/player-card.presentation.spec.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { PlayerCard } from './player-card.presentation';

const mockPlayer = (id: string, name: string, number?: string): GqlRosterPlayer =>
  ({
    gameEventId: `event-${id}`,
    playerId: id,
    playerName: name,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1] || '',
    externalPlayerName: null,
    externalPlayerNumber: number || null,
    position: 'MID',
  }) as GqlRosterPlayer;

describe('PlayerCard', () => {
  it('renders player name, jersey number, and formatted time', () => {
    render(<PlayerCard player={mockPlayer('1', 'Sarah Smith', '7')} variant="bench" timeSeconds={125} isLive={false} isSelected={false} onClick={vi.fn()} />);

    expect(screen.getByText('Sarah Smith')).toBeTruthy();
    expect(screen.getByText('#7')).toBeTruthy();
    expect(screen.getByText(/02:05/)).toBeTruthy();
  });

  it('shows a live indicator only when isLive is true', () => {
    render(<PlayerCard player={mockPlayer('1', 'Sarah Smith')} variant="onField" timeSeconds={60} isLive={true} isSelected={false} onClick={vi.fn()} />);

    expect(screen.getByRole('status', { name: 'Live' })).toBeTruthy();
  });

  it('applies a distinct highlight when an on-field card is selected', () => {
    render(<PlayerCard player={mockPlayer('1', 'Sarah Smith')} variant="onField" timeSeconds={60} isLive={true} isSelected={true} onClick={vi.fn()} />);

    const card = screen.getByRole('button');
    expect(card.className).toContain('border-blue-400');
  });

  it('shows a queued badge when isQueued is true', () => {
    render(<PlayerCard player={mockPlayer('1', 'Sarah Smith')} variant="onField" timeSeconds={60} isLive={true} isSelected={false} isQueued={true} onClick={vi.fn()} />);

    expect(screen.getByLabelText('Queued')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm nx test soccer-stats-ui --testPathPattern player-card.presentation.spec`
Expected: FAIL — `player-card.presentation.tsx` doesn't exist yet (module not found).

- [ ] **Step 3: Create the extracted component with the two additive fixes**

Create `apps/soccer-stats/ui/src/app/components/presentation/player-card.presentation.tsx`:

```tsx
import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { formatTime } from '../../utils';

function getPlayerDisplayName(player: GqlRosterPlayer): string {
  if (player.playerName) return player.playerName;
  if (player.firstName || player.lastName) {
    return `${player.firstName || ''} ${player.lastName || ''}`.trim();
  }
  if (player.externalPlayerName) return player.externalPlayerName;
  return 'Unknown';
}

export interface PlayerCardProps {
  player: GqlRosterPlayer;
  variant: 'bench' | 'onField';
  timeSeconds: number;
  isLive: boolean;
  isSelected: boolean;
  /** Queued for a substitution, swap, or removal — shown dimmed with a badge instead of disappearing. */
  isQueued?: boolean;
  positionLabel?: string | null;
  onClick: () => void;
}

/**
 * Player card shared by the substitution panel's Bench grid and the
 * Lineup tab's on-field card view. On-field players get a live MM:SS
 * ticker with a pulsing dot, mirroring the "live" time treatment in
 * PlayerStatsTablePresentation; bench players show static banked time.
 */
export function PlayerCard({ player, variant, timeSeconds, isLive, isSelected, isQueued = false, positionLabel, onClick }: PlayerCardProps) {
  const isOnField = variant === 'onField';

  const cardClasses = isQueued ? 'border-orange-300 bg-orange-50 opacity-70' : isSelected ? (isOnField ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-400 ring-offset-1' : 'border-green-500 bg-green-50') : isOnField ? 'border-purple-200 bg-purple-50 hover:border-purple-300' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';

  const nameClasses = isSelected && isOnField ? 'text-blue-900' : isOnField ? 'text-purple-900' : isSelected ? 'text-green-700' : 'text-gray-900';

  return (
    <button type="button" onClick={onClick} className={`relative flex flex-col items-start rounded-lg border p-2 transition-colors ${cardClasses}`}>
      {isQueued && (
        <span aria-label="Queued" className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white shadow-md">
          ↓
        </span>
      )}
      <div className="flex items-center gap-2">
        {player.externalPlayerNumber && <span className={`text-xs font-bold ${isOnField ? 'text-purple-600' : 'text-gray-600'}`}>#{player.externalPlayerNumber}</span>}
        <span className={`text-sm font-medium ${nameClasses}`}>{getPlayerDisplayName(player)}</span>
      </div>
      <span className={`inline-flex items-center gap-1.5 text-xs ${isOnField ? 'text-purple-600' : 'text-gray-500'}`}>
        {formatTime(timeSeconds)}
        {isLive && <span role="status" aria-label="Live" className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" title="On field" />}
        {positionLabel ? ` · ${positionLabel}` : ''}
      </span>
    </button>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm nx test soccer-stats-ui --testPathPattern player-card.presentation.spec`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Point `substitution-panel.presentation.tsx` at the extracted component**

In `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.tsx`:

- Delete the inline `PlayerCard` function (current lines 441-513, from the `/** Player card shared by...*/` comment through its closing `}`).
- Add an import near the top of the file (alongside the existing `FIELD_SENTINEL_POSITION` import):
  ```ts
  import { PlayerCard } from '../../presentation/player-card.presentation';
  ```

`PlayerSelectionTabs` keeps calling `<PlayerCard .../>` exactly as before — no other change in this file yet (the on-field tab itself is removed in Task 3).

- [ ] **Step 6: Run the existing substitution-panel presentation spec to confirm no regression**

Run: `pnpm nx test soccer-stats-ui --testPathPattern substitution-panel.presentation.spec`
Expected: PASS (all existing tests, unchanged).

- [ ] **Step 7: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/presentation/player-card.presentation.tsx \
        apps/soccer-stats/ui/src/app/components/presentation/player-card.presentation.spec.tsx \
        apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.tsx
git commit -m "$(cat <<'EOF'
refactor(soccer-stats): extract PlayerCard into a shared presentation component

Moves the substitution panel's PlayerCard (bench/on-field grid card
with live ticker) into components/presentation so it can be reused by
the upcoming on-field card grid. Adds an isQueued visual state and
fixes isSelected styling for on-field cards — both additive, unused by
any current caller, needed by the card grid that will replace the
field layout during live play.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015P5yxzXSqHRqCa7Fn2Lbmn
EOF
)"
```

---

## Task 2: Build the `OnFieldCardGrid` presentation component

**Files:**

- Create: `apps/soccer-stats/ui/src/app/components/presentation/on-field-card-grid.presentation.tsx`
- Create: `apps/soccer-stats/ui/src/app/components/presentation/on-field-card-grid.presentation.spec.tsx`

**Interfaces:**

- Consumes: `PlayerCard` from Task 1 (`../presentation/player-card.presentation`), `FIELD_SENTINEL_POSITION` from `../smart/lineup-panel/types`.
- Produces:

  ```ts
  export interface OnFieldCardGridProps {
    onFieldPlayers: GqlRosterPlayer[];
    playTimeByPlayer: Map<string, { totalSeconds: number; isOnField: boolean }>;
    queuedPlayerIds?: Set<string>;
    selectedFieldPlayerId?: string | null;
    disabled?: boolean;
    onFieldPlayerClick?: (player: GqlRosterPlayer) => void;
  }
  export function OnFieldCardGrid(props: OnFieldCardGridProps): JSX.Element;
  ```

  Consumed by `GameLineupTab` in Task 5, in place of `FieldLineup` when `viewMode === 'card'`.

- [ ] **Step 1: Write the failing test**

Create `apps/soccer-stats/ui/src/app/components/presentation/on-field-card-grid.presentation.spec.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { OnFieldCardGrid } from './on-field-card-grid.presentation';

const mockPlayer = (id: string, name: string, position = 'MID'): GqlRosterPlayer =>
  ({
    gameEventId: `event-${id}`,
    playerId: id,
    playerName: name,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1] || '',
    externalPlayerName: null,
    externalPlayerNumber: null,
    position,
  }) as GqlRosterPlayer;

describe('OnFieldCardGrid', () => {
  it('renders one card per on-field player with their position label', () => {
    render(<OnFieldCardGrid onFieldPlayers={[mockPlayer('1', 'Sarah Smith', 'CB'), mockPlayer('2', 'Alex Jones', 'ST')]} playTimeByPlayer={new Map()} />);

    expect(screen.getByText('Sarah Smith')).toBeTruthy();
    expect(screen.getByText(/CB/)).toBeTruthy();
    expect(screen.getByText('Alex Jones')).toBeTruthy();
    expect(screen.getByText(/ST/)).toBeTruthy();
  });

  it('never shows the FIELD sentinel as a position label', () => {
    render(<OnFieldCardGrid onFieldPlayers={[mockPlayer('1', 'Sarah Smith', 'FIELD')]} playTimeByPlayer={new Map()} />);

    expect(screen.queryByText(/FIELD/)).toBeNull();
  });

  it('highlights the selected field player without removing it from the grid', () => {
    render(<OnFieldCardGrid onFieldPlayers={[mockPlayer('1', 'Sarah Smith')]} playTimeByPlayer={new Map()} selectedFieldPlayerId="event-1" />);

    const card = screen.getByText('Sarah Smith').closest('button');
    expect(card?.className).toContain('border-blue-400');
  });

  it('shows a queued badge for players in queuedPlayerIds', () => {
    render(<OnFieldCardGrid onFieldPlayers={[mockPlayer('1', 'Sarah Smith')]} playTimeByPlayer={new Map()} queuedPlayerIds={new Set(['event-1'])} />);

    expect(screen.getByLabelText('Queued')).toBeTruthy();
  });

  it('calls onFieldPlayerClick with the clicked player', () => {
    const onFieldPlayerClick = vi.fn();
    const player = mockPlayer('1', 'Sarah Smith');
    render(<OnFieldCardGrid onFieldPlayers={[player]} playTimeByPlayer={new Map()} onFieldPlayerClick={onFieldPlayerClick} />);

    fireEvent.click(screen.getByText('Sarah Smith'));

    expect(onFieldPlayerClick).toHaveBeenCalledWith(player);
  });

  it('does not call onFieldPlayerClick when disabled', () => {
    const onFieldPlayerClick = vi.fn();
    render(<OnFieldCardGrid onFieldPlayers={[mockPlayer('1', 'Sarah Smith')]} playTimeByPlayer={new Map()} onFieldPlayerClick={onFieldPlayerClick} disabled={true} />);

    fireEvent.click(screen.getByText('Sarah Smith'));

    expect(onFieldPlayerClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm nx test soccer-stats-ui --testPathPattern on-field-card-grid.presentation.spec`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `apps/soccer-stats/ui/src/app/components/presentation/on-field-card-grid.presentation.tsx`:

```tsx
import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { FIELD_SENTINEL_POSITION } from '../smart/lineup-panel/types';

import { PlayerCard } from './player-card.presentation';

const getPlayerId = (player: GqlRosterPlayer) => player.playerId || player.externalPlayerName || '';

export interface OnFieldCardGridProps {
  onFieldPlayers: GqlRosterPlayer[];
  playTimeByPlayer: Map<string, { totalSeconds: number; isOnField: boolean }>;
  /** Game event IDs of players queued for a substitution, swap, or removal. */
  queuedPlayerIds?: Set<string>;
  /** Game event ID of the player currently selected as a swap/sub target. */
  selectedFieldPlayerId?: string | null;
  disabled?: boolean;
  onFieldPlayerClick?: (player: GqlRosterPlayer) => void;
}

/**
 * Card-grid rendering of the on-field roster — the live-play alternative to
 * the FieldLineup SVG. Reuses the same PlayerCard the substitution panel's
 * bench grid uses, so on-field players get the live MM:SS ticker.
 */
export function OnFieldCardGrid({ onFieldPlayers, playTimeByPlayer, queuedPlayerIds = new Set(), selectedFieldPlayerId = null, disabled = false, onFieldPlayerClick }: OnFieldCardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {onFieldPlayers.map((player) => {
        const id = getPlayerId(player);
        const playTime = playTimeByPlayer.get(id);
        // The "FIELD" position is a sentinel used internally when position
        // tracking is off - never show it as a real position.
        const hasRealPosition = player.position && player.position !== FIELD_SENTINEL_POSITION;

        return <PlayerCard key={id} player={player} variant="onField" timeSeconds={playTime?.totalSeconds ?? 0} isLive={playTime?.isOnField ?? false} isSelected={player.gameEventId === selectedFieldPlayerId} isQueued={queuedPlayerIds.has(player.gameEventId)} positionLabel={hasRealPosition ? player.position : null} onClick={() => !disabled && onFieldPlayerClick?.(player)} />;
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm nx test soccer-stats-ui --testPathPattern on-field-card-grid.presentation.spec`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/presentation/on-field-card-grid.presentation.tsx \
        apps/soccer-stats/ui/src/app/components/presentation/on-field-card-grid.presentation.spec.tsx
git commit -m "$(cat <<'EOF'
feat(soccer-stats): add OnFieldCardGrid presentation component

Card-grid rendering of the on-field roster, built from the shared
PlayerCard. This will replace the FieldLineup SVG as the primary
Lineup-tab view during live play (GameLineupTab wiring is a separate
task) — not yet mounted anywhere.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015P5yxzXSqHRqCa7Fn2Lbmn
EOF
)"
```

---

## Task 3: Remove the substitution panel's "On Field" tab (bench-only panel)

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.tsx`
- Modify: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/types.ts`
- Modify: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.spec.tsx`
- Modify: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.stories.tsx` (only if it has on-field-tab-specific stories — inspect and remove/update those; leave bench-only stories as-is)

**Interfaces:**

- Modifies: `SubstitutionPanelPresentationProps` (types.ts) — removes `onFieldPlayers` and `onFieldPlayerClick` (no longer rendered by this component).
- The smart component (Task 4) stops passing those two props.

- [ ] **Step 1: Update the failing/changing tests first**

Read `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.spec.tsx` in full and:

- Remove any test that asserts on the "On Field" tab button, tab-switching behavior, or on-field cards rendered inside the panel (search for `'On Field'`, `'Swap Position'`, `onFieldPlayerClick`, `onFieldPlayers`).
- Keep/adapt all bench-grid tests — they should still pass unchanged since bench rendering isn't moving.
- Add one new test confirming the tab switcher itself is gone:

```tsx
it('does not render a tab switcher — bench players are always shown', () => {
  render(<SubstitutionPanelPresentation {...defaultProps} panelState="bench-view" />);

  expect(screen.queryByText(/On Field/)).toBeNull();
  expect(screen.queryByText(/Swap Position/)).toBeNull();
});
```

(Adjust `defaultProps` construction to match whatever pattern the existing spec already uses — it already builds a `defaultProps: SubstitutionPanelPresentationProps` object per the file's current header.)

- [ ] **Step 2: Run the updated spec to see the new/removed-prop failures**

Run: `pnpm nx test soccer-stats-ui --testPathPattern substitution-panel.presentation.spec`
Expected: FAIL — component still renders the old tab UI and still requires the props about to be removed from the type.

- [ ] **Step 3: Remove `PlayerSelectionTabs` and inline a bench-only grid**

In `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.tsx`:

- Delete the `PlayerSelectionTabs` function entirely (the function that starts `function PlayerSelectionTabs({` through its closing `}`, following the `PlayerCard` import from Task 1).
- Replace the `<PlayerSelectionTabs .../>` usage inside `SubstitutionPanelPresentation`'s render (previously passing `benchPlayers`, `onFieldPlayers`, `playTimeByPlayer`, `onBenchPlayerClick`, `onFieldPlayerClick`, `selection`, `isExecuting`) with an inline bench grid:

  ```tsx
  {
    /* Bench players — the panel is bench-only now; on-field selection
      happens in the Lineup tab's card grid instead. */
  }
  {
    !isExecuting && (
      <div className="px-4 py-3">
        <div className="mb-3 text-xs font-medium uppercase text-gray-500">Bench ({benchPlayers.length})</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {benchPlayers.map((player) => {
            const id = getPlayerId(player);
            const playTime = playTimeByPlayer.get(id);
            const isSelected = !!(selection.direction === 'bench-first' && selection.benchPlayer && getPlayerId(selection.benchPlayer) === getPlayerId(player));

            return <PlayerCard key={id} player={player} variant="bench" timeSeconds={playTime?.totalSeconds ?? 0} isLive={false} isSelected={isSelected} onClick={() => onBenchPlayerClick(player)} />;
          })}
        </div>
      </div>
    );
  }
  ```

- Update the destructured props at the top of `SubstitutionPanelPresentation` to drop `onFieldPlayers` and `onFieldPlayerClick` (they're no longer used in this file).

- [ ] **Step 4: Update the props type**

In `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/types.ts`, remove these two lines from `SubstitutionPanelPresentationProps`:

```ts
onFieldPlayers: GqlRosterPlayer[];
```

and

```ts
onFieldPlayerClick: (player: GqlRosterPlayer) => void;
```

(`benchPlayers` and `onBenchPlayerClick` stay — bench rendering is unchanged.)

- [ ] **Step 5: Run the spec again to verify it passes**

Run: `pnpm nx test soccer-stats-ui --testPathPattern substitution-panel.presentation.spec`
Expected: PASS.

- [ ] **Step 6: Check and update the stories file**

Read `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.stories.tsx`. Remove any story args that set `onFieldPlayers`/`onFieldPlayerClick` (now nonexistent props) or that specifically demonstrate the on-field tab. Leave bench-focused stories intact, adjusting their args to the new prop shape.

- [ ] **Step 7: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.tsx \
        apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.spec.tsx \
        apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.stories.tsx \
        apps/soccer-stats/ui/src/app/components/smart/substitution-panel/types.ts
git commit -m "$(cat <<'EOF'
refactor(soccer-stats): remove substitution panel's nested On Field tab

The panel is bench-only now. On-field player selection moves to the
Lineup tab's new card grid (added in the next task's GameLineupTab
wiring) instead of a nested tab inside this bottom sheet.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015P5yxzXSqHRqCa7Fn2Lbmn
EOF
)"
```

---

## Task 4: Replace the panel's internal field-click handling with an external swap-completion prop

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.smart.tsx`
- Modify: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/types.ts`
- Modify: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.smart.spec.tsx`

**Interfaces:**

- Consumes: nothing new from earlier tasks.
- Produces (new props on `SubstitutionPanelSmartProps`, consumed by `game.page.tsx` in Task 6):
  ```ts
  /**
   * A second on-field player clicked externally (in the Lineup tab's card
   * grid) while this panel already has a field-first selection active.
   * Completes a position swap between the two players.
   */
  externalFieldPlayerForSwap?: GqlRosterPlayer | null;
  onExternalFieldPlayerForSwapHandled?: () => void;
  ```
- Removes: `handleFieldPlayerClick` (becomes dead code once Task 3 removed its only caller) and the `onFieldPlayerClick` prop passed to `SubstitutionPanelPresentation`.

- [ ] **Step 1: Write the failing test, modeled on the existing `externalFieldPlayerToReplace` test**

In `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.smart.spec.tsx`, add a new `describe` block after `describe('bench-first selection flow', ...)`:

```tsx
describe('field-first swap flow', () => {
  it('queues a swap when a second field player is clicked externally', async () => {
    const onExternalFieldPlayerForSwapHandled = vi.fn();

    const { rerender } = render(
      <SubstitutionPanel
        {...createDefaultProps({
          externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
          onExternalSelectionHandled: vi.fn(),
          onExternalFieldPlayerForSwapHandled,
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Replacing:/)).toBeTruthy();
    });

    // Simulate a second on-field player clicked externally, in the
    // Lineup tab's card grid
    rerender(
      <SubstitutionPanel
        {...createDefaultProps({
          externalFieldPlayerSelection: null,
          onExternalSelectionHandled: vi.fn(),
          onExternalFieldPlayerForSwapHandled,
          externalFieldPlayerForSwap: mockPlayer('2', 'Alex Jones'),
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Queued \(1\)/)).toBeTruthy();
      expect(onExternalFieldPlayerForSwapHandled).toHaveBeenCalled();
    });
  });

  it('ignores the external swap target if it is already queued', async () => {
    const onExternalFieldPlayerForSwapHandled = vi.fn();

    const { rerender } = render(
      <SubstitutionPanel
        {...createDefaultProps({
          externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
          onExternalSelectionHandled: vi.fn(),
          onExternalFieldPlayerForSwapHandled,
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Replacing:/)).toBeTruthy();
    });

    // Queue player 2 into an unrelated substitution first, then try to
    // use them as a swap target — should be ignored
    rerender(
      <SubstitutionPanel
        {...createDefaultProps({
          externalFieldPlayerSelection: null,
          onExternalSelectionHandled: vi.fn(),
          onExternalFieldPlayerForSwapHandled,
          externalFieldPlayerForSwap: mockPlayer('2', 'Alex Jones'),
        })}
      />,
    );

    await waitFor(() => {
      expect(onExternalFieldPlayerForSwapHandled).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm nx test soccer-stats-ui --testPathPattern substitution-panel.smart.spec`
Expected: FAIL — `externalFieldPlayerForSwap` is not a recognized prop and nothing consumes it, so no swap is ever queued.

- [ ] **Step 3: Add the new props to the type**

In `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/types.ts`, add to `SubstitutionPanelSmartProps` (near the existing `externalFieldPlayerToReplace`/`onExternalFieldPlayerToReplaceHandled` pair):

```ts
/**
 * A second on-field player clicked externally (in the Lineup tab's card
 * grid) while this panel already has a field-first selection active.
 * Completes a position swap between the two players.
 */
externalFieldPlayerForSwap?: GqlRosterPlayer | null;

/**
 * Called when the external swap target has been handled (queued or
 * ignored).
 */
onExternalFieldPlayerForSwapHandled?: () => void;
```

- [ ] **Step 4: Remove the now-dead `handleFieldPlayerClick` and add the new effect**

In `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.smart.tsx`:

- Delete the `handleFieldPlayerClick` callback entirely (the function starting `const handleFieldPlayerClick = useCallback(` through its closing `);`, and its dependency array). Its only caller — the `onFieldPlayerClick` prop passed to `SubstitutionPanelPresentation` — no longer exists after Task 3.
- Remove `onFieldPlayerClick={handleFieldPlayerClick}` from the `<SubstitutionPanelPresentation .../>` return.
- Add the two new destructured props to the component's parameter list: `externalFieldPlayerForSwap`, `onExternalFieldPlayerForSwapHandled`.
- Add a new effect right after the existing "Handle external field player click to complete bench-first substitution" effect (mirrors it exactly, swapping the completion logic for the swap branch that used to live inside `handleFieldPlayerClick`):

  ```tsx
  // Handle a second on-field player clicked externally to complete a
  // field-first position swap (the card grid's equivalent of clicking a
  // second player in the old nested "On Field" tab)
  useEffect(() => {
    if (!externalFieldPlayerForSwap) return;

    if (selection.direction === 'field-first' && selection.fieldPlayer) {
      // Ignore if the target is already queued for substitution or swap
      const isQueued = outIds.has(externalFieldPlayerForSwap.gameEventId) || swapPlayerIds.has(getPlayerId(externalFieldPlayerForSwap));

      if (!isQueued) {
        const fieldPlayer = selection.fieldPlayer;
        setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });

        if (executeImmediately) {
          executeSwapNow(fieldPlayer, externalFieldPlayerForSwap);
        } else {
          const swapItem: QueuedItem = {
            id: `swap-${Date.now()}-${Math.random()}`,
            type: 'swap',
            player1: {
              source: 'onField',
              player: fieldPlayer,
              gameEventId: fieldPlayer.gameEventId,
            },
            player2: {
              source: 'onField',
              player: externalFieldPlayerForSwap,
              gameEventId: externalFieldPlayerForSwap.gameEventId,
            },
          };
          setQueue((prev) => [...prev, swapItem]);
        }
      }
    }

    onExternalFieldPlayerForSwapHandled?.();
  }, [externalFieldPlayerForSwap, selection, outIds, swapPlayerIds, executeImmediately, executeSwapNow, onExternalFieldPlayerForSwapHandled]);
  ```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm nx test soccer-stats-ui --testPathPattern substitution-panel.smart.spec`
Expected: PASS (including all pre-existing tests — `handleFieldPlayerClick`'s removal must not break the field-first/bench-first flows, which are driven entirely by the `external*` props already).

- [ ] **Step 6: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.smart.tsx \
        apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.smart.spec.tsx \
        apps/soccer-stats/ui/src/app/components/smart/substitution-panel/types.ts
git commit -m "$(cat <<'EOF'
feat(soccer-stats): add external field-first swap completion to SubstitutionPanel

Removes the now-dead handleFieldPlayerClick (its only caller was the
nested On Field tab removed in the previous commit) and replaces its
swap-completion branch with externalFieldPlayerForSwap, mirroring the
existing externalFieldPlayerToReplace pattern. This lets a second
on-field tap that happens outside the panel (in the upcoming card
grid) complete a position swap the same way an external field click
already completes a bench-first substitution.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015P5yxzXSqHRqCa7Fn2Lbmn
EOF
)"
```

---

## Task 5: Wire the view-mode toggle and `OnFieldCardGrid` into `GameLineupTab`

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.tsx`
- Create: `apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.spec.tsx` if it doesn't already exist; otherwise extend the existing one. (Check first: `ls apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.spec.tsx`.)

**Interfaces:**

- Consumes: `OnFieldCardGrid` (Task 2), `usePlayTime` from `../../hooks/use-play-time` (existing).
- Produces (new/changed props on `GameLineupTabProps`, consumed by `game.page.tsx` in Task 6):

  ```ts
  /** Game events for the on-field card grid's live play-time ticker. */
  gameEvents?: GameEventForPlayTime[]; // see step 3 for the exact shape
  /**
   * A second on-field player clicked in the card grid while a field
   * player is already selected there. Completes a position swap.
   */
  onFieldPlayerClickForSwap?: (player: GqlRosterPlayer) => void;
  ```

  `gameStatus` and `currentPeriod`/`currentPeriodSeconds` already exist on this props interface and are reused for the phase computation and play-time calculation — no change needed there.

- [ ] **Step 1: Write the failing tests for the phase-based view-mode default and reset behavior**

Check whether `apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.spec.tsx` exists:

```bash
ls apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.spec.tsx
```

If it exists, read it fully first to match its existing mocking setup (it will mock `useLineup` from `../../hooks/use-lineup`, since `GameLineupTab` calls that hook directly). Add the tests below to it, following its existing mock pattern. If it does not exist, create it with a minimal mock of `useLineup` returning empty rosters plus the tests below:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { GameStatus } from '@garage/soccer-stats/graphql-codegen';

import { GameLineupTab } from './game-lineup-tab.smart';

vi.mock('../../hooks/use-lineup', () => ({
  useLineup: () => ({
    onField: [],
    bench: [],
    availableRoster: [],
    teamRoster: [],
    loading: false,
    mutating: false,
    error: null,
    addPlayerToGameRoster: vi.fn(),
    removeFromLineup: vi.fn(),
    updatePosition: vi.fn(),
    substitutePlayer: vi.fn(),
    recordPositionChange: vi.fn(),
    bringPlayerOntoField: vi.fn(),
    refetchRoster: vi.fn(),
    formation: null,
  }),
}));

const baseProps = {
  gameTeamId: 'gt-1',
  gameId: 'game-1',
  teamId: 'team-1',
  teamName: 'Home',
  isManaged: true,
  playersPerTeam: 7,
  statsFeatures: { trackPositions: true, trackSubstitutions: true },
};

describe('GameLineupTab view mode', () => {
  it('defaults to the card view during first half', () => {
    render(<GameLineupTab {...baseProps} gameStatus={GameStatus.FirstHalf} />);
    expect(screen.getByRole('button', { name: 'Card view' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('defaults to the field view before kickoff', () => {
    render(<GameLineupTab {...baseProps} gameStatus={GameStatus.Scheduled} />);
    expect(screen.getByRole('button', { name: 'Field view' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('defaults to the field view at halftime', () => {
    render(<GameLineupTab {...baseProps} gameStatus={GameStatus.Halftime} />);
    expect(screen.getByRole('button', { name: 'Field view' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('lets the coach manually switch views within a phase', () => {
    render(<GameLineupTab {...baseProps} gameStatus={GameStatus.FirstHalf} />);

    fireEvent.click(screen.getByRole('button', { name: 'Field view' }));

    expect(screen.getByRole('button', { name: 'Field view' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('resets a manual override back to the phase default on a phase transition', () => {
    const { rerender } = render(<GameLineupTab {...baseProps} gameStatus={GameStatus.FirstHalf} />);

    fireEvent.click(screen.getByRole('button', { name: 'Field view' }));
    expect(screen.getByRole('button', { name: 'Field view' })).toHaveAttribute('aria-pressed', 'true');

    // Phase transition: first half -> halftime
    rerender(<GameLineupTab {...baseProps} gameStatus={GameStatus.Halftime} />);
    expect(screen.getByRole('button', { name: 'Field view' })).toHaveAttribute('aria-pressed', 'true');

    // Phase transition: halftime -> second half — should reset to Card,
    // not remember the earlier manual override
    rerender(<GameLineupTab {...baseProps} gameStatus={GameStatus.SecondHalf} />);
    expect(screen.getByRole('button', { name: 'Card view' })).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm nx test soccer-stats-ui --testPathPattern game-lineup-tab.smart.spec`
Expected: FAIL — no "Card view"/"Field view" toggle buttons exist yet.

- [ ] **Step 3: Add `gameEvents` prop, phase/view-mode state, and the toggle UI**

In `apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.tsx`:

Add imports:

```ts
import { OnFieldCardGrid } from '../presentation/on-field-card-grid.presentation';
import { usePlayTime } from '../../hooks/use-play-time';
```

Add a `gameEvents` prop to `GameLineupTabProps` (reusing the exact shape already defined on `SubstitutionPanelSmartProps` in `substitution-panel/types.ts`, so both components accept the same event objects from `game.page.tsx`):

```ts
/** Game events, used to compute live play time for the on-field card grid. */
gameEvents?: Array<{
  id: string;
  playerId?: string | null;
  externalPlayerName?: string | null;
  eventType: { category: string; name?: string };
  period: string;
  periodSecond: number;
  childEvents?: Array<{
    playerId?: string | null;
    externalPlayerName?: string | null;
    eventType: { name: string };
  }>;
}>;

/**
 * A second on-field player clicked in the card grid while a field player
 * is already selected there (selectedFieldPlayerId is set). Completes a
 * position swap.
 */
onFieldPlayerClickForSwap?: (player: GqlRosterPlayer) => void;
```

Destructure the two new props in the component signature, with `gameEvents = []` as the default (matching the `queuedPlayerIds = new Set()` default style already used on this component).

Add the phase computation and view-mode state, right after the existing `isActivePlay` declaration (line 397-401):

```ts
// Which phase of the game determines the default Lineup-tab view.
type GamePhase = 'pregame' | 'live' | 'halftime' | 'fulltime';
const phase: GamePhase = gameStatus === GameStatus.Halftime ? 'halftime' : gameStatus === GameStatus.Completed || gameStatus === GameStatus.Cancelled ? 'fulltime' : gameStatus === GameStatus.FirstHalf || gameStatus === GameStatus.SecondHalf || gameStatus === GameStatus.InProgress ? 'live' : 'pregame';

const defaultViewMode: 'field' | 'card' = phase === 'live' ? 'card' : 'field';
const [viewModeOverride, setViewModeOverride] = useState<'field' | 'card' | null>(null);
const viewMode = viewModeOverride ?? defaultViewMode;

// Reset any manual override whenever the game moves to a new phase.
useEffect(() => {
  setViewModeOverride(null);
}, [phase]);
```

Add the on-field-card-grid click handler, right after `handleOnFieldPlayerClick` (line 478, reusing it for every case except the swap-completion priority check that only the card grid needs — the SVG field view keeps its own separate swap-free `handlePositionClick`, unaffected by this task):

```ts
// Card grid's on-field click handler: same routing as
// handleOnFieldPlayerClick, but checks for an in-progress field-first
// swap selection first (the card grid is the only place a second
// on-field tap can complete a swap, since it's the only trackPositions
// on-field view with per-player click targets that stays mounted during
// live play).
const handleOnFieldCardClick = useCallback(
  (player: GqlRosterPlayer) => {
    if (selectedFieldPlayerId && selectedFieldPlayerId !== player.gameEventId && onFieldPlayerClickForSwap) {
      onFieldPlayerClickForSwap(player);
      return;
    }
    handleOnFieldPlayerClick(player);
  },
  [selectedFieldPlayerId, onFieldPlayerClickForSwap, handleOnFieldPlayerClick],
);
```

Add the play-time calculation, near the other `useMemo`/hook calls (anywhere before the `return` statement is fine — place it right before the `if (loading)` early return):

```ts
const onFieldPlayerIds = useMemo(() => onField.map((p) => p.playerId || p.externalPlayerName || ''), [onField]);
const playTimeByPlayer = usePlayTime(onFieldPlayerIds, gameEvents, {
  period: currentPeriod,
  periodSecond: currentPeriodSeconds,
});
```

- [ ] **Step 4: Render the toggle and swap in `OnFieldCardGrid`**

Replace the header block (lines 706-734) to add the toggle, only when `trackPositions` (mirroring how the formation selector is already gated):

```tsx
<div className="flex flex-wrap items-center justify-between gap-2">
  <h3 className="text-lg font-semibold">{teamName} Lineup</h3>
  {trackPositions && (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button type="button" onClick={() => setViewModeOverride('field')} aria-pressed={viewMode === 'field'} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'field' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          Field view
        </button>
        <button type="button" onClick={() => setViewModeOverride('card')} aria-pressed={viewMode === 'card'} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          Card view
        </button>
      </div>
      <label htmlFor="formation-select" className="text-sm text-gray-600">
        Formation:
      </label>
      <select
        id="formation-select"
        value={selectedFormation.code}
        onChange={(e) => {
          const formation = formations.find((f) => f.code === e.target.value);
          if (formation) handleFormationSelect(formation);
        }}
        disabled={savingFormation || mutating}
        className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
      >
        {formations.map((f) => (
          <option key={f.code} value={f.code}>
            {f.name}
          </option>
        ))}
      </select>
    </div>
  )}
</div>
```

Replace the `trackPositions ? (<FieldLineup .../>) : (<PlayerListLineup .../>)` block (lines 736-765) so the `trackPositions` branch itself switches on `viewMode`:

```tsx
{
  trackPositions ? (
    viewMode === 'field' ? (
      /* Full field visualization with position slots */
      <div id="field-lineup" className="mx-auto max-w-sm">
        <FieldLineup formation={selectedFormation} lineup={onField} onPositionClick={handlePositionClick} teamColor={teamColor} disabled={mutating} highlightClickableAssigned={hasBenchSelectionActive} queuedPlayerIds={queuedPlayerIds} selectedFieldPlayerId={selectedFieldPlayerId} />
      </div>
    ) : (
      /* Live-play card view — player-for-player, no position slots */
      <OnFieldCardGrid onFieldPlayers={onField} playTimeByPlayer={playTimeByPlayer} queuedPlayerIds={queuedPlayerIds} selectedFieldPlayerId={selectedFieldPlayerId} disabled={mutating} onFieldPlayerClick={handleOnFieldCardClick} />
    )
  ) : (
    /* Simplified on-field list when position tracking is off */
    <PlayerListLineup onField={onField} bench={[]} playersPerTeam={playersPerTeam} teamColor={teamColor} disabled={mutating} queuedPlayerIds={queuedPlayerIds} selectedFieldPlayerId={selectedFieldPlayerId} hasBenchSelectionActive={hasBenchSelectionActive} onFieldPlayerClick={handleOnFieldPlayerClick} onAddToFieldClick={onAddToFieldClick} getJerseyNumber={getJerseyNumber} />
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm nx test soccer-stats-ui --testPathPattern game-lineup-tab.smart.spec`
Expected: PASS (all 5 new tests, plus any pre-existing tests in the file unaffected).

- [ ] **Step 6: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.tsx \
        apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.spec.tsx
git commit -m "$(cat <<'EOF'
feat(soccer-stats): add phase-based Field/Card view toggle to GameLineupTab

Adds a manual Field/Card toggle to the Lineup tab, defaulting to Field
before kickoff and at halftime and Card once a period is live, and
resetting to that default on every phase transition. Card view renders
the new OnFieldCardGrid in place of the FieldLineup SVG, wired through
the same external-prop routing FieldLineup already uses for
bench-first substitutions, plus a new swap-completion path
(onFieldPlayerClickForSwap) for the one flow that has no field-view
equivalent today.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015P5yxzXSqHRqCa7Fn2Lbmn
EOF
)"
```

---

## Task 6: Wire `game.page.tsx` — pass `gameEvents` to `GameLineupTab`, add swap-completion plumbing

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx`

**Interfaces:**

- Consumes: `GameLineupTab`'s new `gameEvents`/`onFieldPlayerClickForSwap` props (Task 5), `SubstitutionPanel`'s new `externalFieldPlayerForSwap`/`onExternalFieldPlayerForSwapHandled` props (Task 4).

- [ ] **Step 1: Add the new state**

Near the other single-purpose `external*` state declarations for the substitution panel (e.g. wherever `fieldPlayerToReplaceForPanel`/`setFieldPlayerToReplaceForPanel` is declared — search for that identifier to find the right spot), add:

```ts
const [fieldPlayerForSwap, setFieldPlayerForSwap] = useState<GqlRosterPlayer | null>(null);
```

- [ ] **Step 2: Pass `gameEvents` and the new swap callback into `GameLineupTab`**

`GameLineupTab` is mounted once per team inside the tab content (around lines 1850-1900 per the earlier code survey — search for `<GameLineupTab` to find both mount sites, home and away). At each mount site, add two new props, reusing the exact same `gameEvents` expression already used for the `SubstitutionPanel` mount (lines 2784-2800 in the current file — copy that mapped-events expression verbatim for the matching team):

```tsx
gameEvents={
  (activeTeam === 'home' ? homeTeam.events : awayTeam.events)?.map(
    (e) => ({
      id: e.id,
      playerId: e.playerId,
      externalPlayerName: e.externalPlayerName,
      eventType: e.eventType,
      period: e.period ?? '1',
      periodSecond: e.periodSecond,
      childEvents: e.childEvents?.map((ce) => ({
        playerId: ce.playerId,
        externalPlayerName: ce.externalPlayerName,
        eventType: ce.eventType,
      })),
    }),
  ) ?? []
}
onFieldPlayerClickForSwap={setFieldPlayerForSwap}
```

(If `GameLineupTab` is mounted at two separate call sites — one per team/tab — add both props to both mount sites, exactly as `onFieldPlayerClickForSub` etc. already appear at both.)

- [ ] **Step 3: Pass the swap prop pair into `SubstitutionPanel`**

At the `<SubstitutionPanel` mount (around line 2767 in the current file), add:

```tsx
externalFieldPlayerForSwap={fieldPlayerForSwap}
onExternalFieldPlayerForSwapHandled={() => setFieldPlayerForSwap(null)}
```

(Add these alongside the existing `externalFieldPlayerToReplace`/`onExternalFieldPlayerToReplaceHandled` pair, same pattern.)

- [ ] **Step 4: Type-check and run the full UI test suite**

Run: `pnpm nx typecheck soccer-stats-ui`
Expected: no new type errors.

Run: `pnpm nx test soccer-stats-ui`
Expected: all tests pass (this is the full app test run — confirms nothing in `game.page.tsx`'s existing tests, if any target this file directly, broke).

- [ ] **Step 5: Commit**

```bash
git add apps/soccer-stats/ui/src/app/pages/game.page.tsx
git commit -m "$(cat <<'EOF'
feat(soccer-stats): wire field-first swap completion through game.page

Connects GameLineupTab's new onFieldPlayerClickForSwap to
SubstitutionPanel's externalFieldPlayerForSwap, and passes gameEvents
into GameLineupTab so the new on-field card grid can show live play
time. Completes the plumbing added in the last two tasks — the card
grid, hoisted into the Lineup tab in the previous commit, can now
complete substitutions and swaps end to end.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015P5yxzXSqHRqCa7Fn2Lbmn
EOF
)"
```

---

## Task 7: Full verification pass (lint, build, and manual QA in the browser)

**Files:** none (verification only).

- [ ] **Step 1: Check for Playwright E2E tests targeting the removed "On Field" tab**

```bash
grep -rln "On Field\|Swap Position\|onFieldPlayerClick" apps/soccer-stats/e2e apps/soccer-stats-e2e 2>/dev/null
```

If this finds any Playwright spec files, read each one and update selectors that targeted the removed nested tab (e.g. `getByRole('button', { name: 'On Field' })` inside the substitution panel) to instead interact with the hoisted `OnFieldCardGrid` in the Lineup tab's Card view. If no matches are found (likely, since the on-field tab was recently added and this repo's E2E coverage is Playwright-based but scoped per the root CLAUDE.md — confirm the actual e2e directory name via `pnpm nx show projects` if the paths above don't exist), there is nothing to update.

- [ ] **Step 2: Run the full affected check**

```bash
pnpm nx run-many --target=lint --all --parallel=3
pnpm nx run-many --target=test --all --parallel=2
pnpm nx run-many --target=build --all --parallel=3
```

Expected: all pass. Per this repo's CLAUDE.md, Nx Cloud connectivity may fail in this environment with exit code 1 without affecting actual build/test success — look for "Successfully ran target" in the output rather than trusting the process exit code alone.

- [ ] **Step 3: Manual QA — start the dev server**

```bash
pnpm nx serve soccer-stats-ui
```

- [ ] **Step 4: Walk the golden path in the browser**

For a game with `trackPositions: true` and at least one bench player:

1. **Pregame (`SCHEDULED`):** open the Lineup tab — confirm it defaults to **Field view** and the toggle shows "Field view" pressed.
2. **Start the game (move to first half):** confirm the Lineup tab automatically shows **Card view** (no manual action) and the substitution panel's bottom sheet, when opened, shows **only a Bench section — no "On Field" tab**.
3. **Bench-first substitution:** tap a bench player in the panel, then tap an on-field card in the main Card view. Confirm a "substitution" queue item appears in the panel and, after "Confirm All", the sub executes (playerIn is now on the field, in the exact same position playerOut had).
4. **Field-first substitution:** with no panel selection, tap an on-field card in the Card view first, then tap a bench player in the panel. Confirm the same result as step 3, reversed order.
5. **Field-first swap:** tap one on-field card in the Card view (it should highlight with a blue ring, not disappear), then tap a _different_ on-field card. Confirm a "swap" queue item appears (`↔` between the two names), and after confirming, the two players' positions are exchanged.
6. **Manual toggle:** while live, tap "Field view" — confirm the SVG field appears with the current lineup. Advance to halftime — confirm the view resets to Field view's _default_ (no visible change here, since Field is also halftime's default) — then manually toggle to Card view during halftime, and start the second half — confirm the view resets to Card (the phase default), not remembering the halftime override.
7. **`trackPositions: false` team:** open a game/team with position tracking off — confirm the Lineup tab shows the unchanged `PlayerListLineup` (no Field/Card toggle at all) and substitutions still work exactly as before.

- [ ] **Step 5: Report results**

If any step fails, use `superpowers:systematic-debugging` before making further code changes — do not guess-fix. If all steps pass, the feature is complete; no further commit is needed for this task (verification only).

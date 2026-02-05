# Lineup Panel Design

**Date:** 2026-02-05
**Status:** Approved
**Author:** Claude (brainstormed with user)

## Overview

A unified inline bottom panel for setting up game lineups, adapting the successful substitution panel pattern to work for both pre-game lineup setup and halftime lineup adjustments.

## Problem Statement

The current lineup setup uses modal dialogs for each player/position assignment, which feels disconnected from the inline bottom panel experience users have learned from the substitution flow. This creates inconsistent UX between related workflows.

## Solution

Create a `LineupPanel` component that:

- Appears during `SCHEDULED` and `HALFTIME` game statuses
- Uses the same 3-state pattern (collapsed/bench-view/expanded) as the substitution panel
- Supports hybrid interaction (position-first and player-first flows)
- Queues changes for batch execution
- Pre-populates with first-half lineup at halftime

---

## Core Concept & States

### Panel States

| State          | Height    | When                                  |
| -------------- | --------- | ------------------------------------- |
| **Collapsed**  | ~48px bar | Default when lineup is complete       |
| **Bench-view** | 40vh      | Default expansion, shows player lists |
| **Expanded**   | 60vh      | User drags up for more space          |

### Visibility Rules

- **SCHEDULED status**: Panel visible, auto-expands if no players assigned
- **FIRST_HALF / SECOND_HALF**: Panel hidden (substitution panel takes over)
- **HALFTIME status**: Panel visible, auto-expands to prompt lineup review
- **COMPLETED status**: Panel hidden

### Collapsed Bar Display

Shows contextual summary:

- Pre-game: "Starting Lineup" + count (e.g., "3/5 positions filled")
- Halftime: "Second Half Lineup" + indicator if changes queued

### Header Content (when expanded)

- Team name and badge
- Formation dropdown selector
- Game time context (pre-game vs halftime)
- Queue badge showing pending changes count

---

## Interaction Flows

### Position-First Flow (tap empty position on field)

1. User taps empty position on field visualization
2. Panel expands (if collapsed) with that position highlighted in header: "Assign: **Goalkeeper**"
3. Player lists show available players grouped by section
4. User taps player → assignment queued: "GK → Player Name"
5. Panel remains open for next assignment or user collapses

### Player-First Flow (tap player in panel)

1. User taps player in panel's player list
2. Panel header shows: "Place **Player Name** at position..."
3. Field visualization highlights available positions
4. User taps position on field → assignment queued
5. Panel updates to show queued change

### Modifying Queued Assignments

- Each queued item shows an "X" to remove it
- Tapping an already-queued position shows options: reassign or remove
- Tapping a queued player allows changing their position

### Confirming Changes

- "Confirm Lineup" button executes all queued changes as batch
- Pre-game: Calls mutations to add players to game roster with positions
- Halftime: Calls `setSecondHalfLineup` mutation with complete lineup

### Canceling

- Collapsing panel preserves queue (user can resume)
- Explicit "Clear" action removes all queued changes
- Navigating away prompts if queue has items

---

## Player List Organization

### Smart Grouping (scrollable sections in panel)

**Section 1: On Field** (only shown if players assigned)

- Players currently assigned to positions
- Shows position badge + player name + jersey number
- Tappable to change position or move to bench
- Dimmed if player is in queue for removal/move

**Section 2: Bench** (players in game but no position)

- Players added to game roster without position assignment
- Shows player name + jersey number + play time (if halftime)
- Tappable to start player-first assignment flow

**Section 3: Available from Roster**

- Team roster players not yet in this game
- Grouped separately to distinguish from bench
- Tappable to add to game and assign position in one flow

**Section 4: Add Player** (sticky at bottom)

- "Add New Player" button → inline form or mini-modal
- "Add External Player" for non-roster players (name + number input)
- New players go directly into assignment flow

### Visual Indicators

- Queued players show pending action badge (like sub panel's "S" badges)
- Position conflicts highlighted (same position queued twice)
- Play time shown at halftime to help rotation decisions

### Filtering/Search (optional, for large rosters)

- Simple text filter at top of player list
- Filters across all sections simultaneously

---

## Halftime Behavior

### Pre-population Logic

When game enters `HALFTIME` status:

1. Panel auto-expands to prompt lineup review
2. Current lineup (from first half) is displayed as the "starting point"
3. No changes are queued yet - what you see is the current state
4. Queue only fills when user makes modifications

### Detecting Changes

The panel tracks differences from first-half lineup:

- Position changes: "Player A: LB → RB"
- Substitutions: "Player B (out) → Player C (in) at CM"
- Additions: "Player D added at ST"
- Removals: "Player E removed from lineup"

### Quick Actions

**"Keep Same Lineup"** button (prominent placement):

- Confirms first-half lineup for second half with no changes
- Equivalent to confirming with empty queue
- Skips the need to review if coach is happy

**"Clear Changes"** button:

- Resets to first-half lineup state
- Removes all queued modifications

### Play Time Context

At halftime, the panel shows first-half play time for each player:

- Helps coaches make fair rotation decisions
- Uses same `calculatePlayTime()` hook as substitution panel
- Format: "Player Name (12 min)"

---

## Formation Handling

### Formation Selector

Located in panel header, dropdown showing formations for team size:

- 5v5: "2-1-1", "1-2-1", "2-2", "3-1", "1-3", "Diamond"
- 7v7: "2-3-1", "3-2-1", "3-1-2", "2-1-2-1"
- etc.

### Formation Change Flow

When user selects new formation:

1. **If positions are compatible**: Changes apply seamlessly, no queue entries needed

2. **If positions need reassignment**:
   - Panel shows inline reassignment UI (not a separate modal)
   - Lists affected players: "These players need new positions:"
   - Each player row shows dropdown of available positions in new formation
   - User assigns each, changes go into queue
   - Original positions marked as "pending removal"

3. **Queue entries for formation change**:
   - "Formation: 2-1-1 → 3-1"
   - "Player A: LW → LB" (position reassignment)
   - "Player B: RW → removed" (if new formation has fewer spots)

### Validation

- Cannot confirm if required positions unfilled
- Warning if formation has more positions than assigned players
- Position conflicts prevented (can't assign two players to same position)

### Pre-game vs Halftime

- Pre-game: Formation changes are straightforward, just reassign
- Halftime: Formation changes also trigger appropriate backend events (position change events with timing)

---

## Component Architecture

### File Structure

```
components/smart/lineup-panel/
├── index.ts                        # Barrel export
├── lineup-panel.smart.tsx          # State & logic (container)
├── lineup-panel.presentation.tsx   # UI rendering
├── types.ts                        # TypeScript interfaces
├── use-lineup-panel-state.ts       # Complex state hook (optional)
└── lineup-panel.spec.tsx           # Unit tests
```

### Smart Component Responsibilities

- Panel state management (collapsed/bench-view/expanded)
- Selection state (position-first vs player-first direction)
- Queue management (add, remove, clear queued changes)
- Formation change handling with reassignment logic
- Batch mutation execution on confirm
- Coordination with game page (external position clicks)

### Props Interface

```typescript
interface LineupPanelProps {
  gameId: string;
  gameStatus: GameStatus;
  gameTeamId: string;
  team: Team;
  roster: RosterPlayer[]; // Full team roster
  currentLineup: LineupPlayer[]; // Players in game with positions
  benchPlayers: RosterPlayer[]; // In game, no position
  formation: string | null;
  playersPerTeam: number;
  gameEvents?: GameEvent[]; // For play time calc at halftime

  // External coordination (like sub panel)
  externalPositionSelection?: Position | null;
  onPositionSelectionChange?: (position: Position | null) => void;
  onQueuedPlayerIdsChange?: (ids: Set<string>) => void;
}
```

### Mutations Used

- Pre-game: `ADD_PLAYER_TO_GAME_ROSTER` (existing)
- Halftime: `SET_SECOND_HALF_LINEUP` (existing)
- Formation: `UPDATE_GAME_TEAM_FORMATION` (existing)

---

## Game Page Integration

### Conditional Rendering

```tsx
// In game.page.tsx
{
  isLineupSetupPhase && managedTeam && (
    <LineupPanel
      gameId={gameId}
      gameStatus={gameStatus}
      // ... other props
    />
  );
}

{
  isActivePlay && managedTeam && (
    <SubstitutionPanel
    // ... existing props
    />
  );
}
```

Where `isLineupSetupPhase = status === 'SCHEDULED' || status === 'HALFTIME'`

### Field Visualization Coordination

Game page manages clicks on field positions:

1. User taps empty position on `FieldLineup` component
2. Game page captures click, sets `selectedPositionForLineup` state
3. Passes to `LineupPanel` via `externalPositionSelection` prop
4. Panel opens/expands and enters position-first flow

When panel is in player-first mode:

1. Panel calls `onPositionSelectionChange(null)` to clear external selection
2. Field visualization shows "tap to place" state for available positions
3. Position click completes the player-first flow

### Visual Feedback on Field

Reuse existing field visualization patterns:

- Empty positions: Dashed outline, tappable
- Filled positions: Player initials/number, tappable to modify
- Queued assignments: Show with pending indicator (pulsing border or badge)
- Player-first active: Available positions highlighted

### State Reset on Status Change

When game status changes (e.g., SCHEDULED → FIRST_HALF):

- Queue auto-clears (or warns if uncommitted)
- Panel visibility updates based on new status
- Substitution panel takes over seamlessly

---

## Edge Cases

### Incomplete lineup on game start

- If user tries to start game with unfilled positions → warning prompt
- Option to start anyway (some positions empty) or return to setup

### Mid-setup navigation

- If user navigates away with queued changes → confirmation dialog
- "You have unsaved lineup changes. Discard?"

### Roster changes during setup

- If team roster updates while panel open (rare) → refresh available players
- Queued items with now-invalid players show error state

### Two managed teams (both yours)

- Panel shows team selector or tabs to switch between teams
- Each team has independent queue

---

## Migration Plan

### What This Replaces

Current modal-based flows in `GameLineupTab` will be deprecated:

- "Assign Position" modal → panel's position-first flow
- "Add Player" modal → panel's inline add flow
- Position reassignment modal → panel's inline reassignment

The `GameLineupTab` component can be simplified to just show the field visualization and defer all interactions to the panel.

### Not In Scope (YAGNI)

- Drag-and-drop (can add later if requested)
- Preset lineups / saved formations
- AI lineup suggestions
- Multi-game lineup templates

---

## Implementation Sequence

1. **Create panel shell** - Basic component with 3-state behavior, no functionality
2. **Add player list sections** - Smart grouping with On Field/Bench/Roster/Add
3. **Implement position-first flow** - External position selection → player assignment
4. **Implement player-first flow** - Player selection → position assignment
5. **Add queue management** - Queue display, add/remove items, clear
6. **Add batch execution** - Confirm button with appropriate mutations
7. **Add formation handling** - Selector and reassignment flow
8. **Add halftime behavior** - Pre-population, play time display, quick actions
9. **Integrate with game page** - Conditional rendering, field coordination
10. **Deprecate old modals** - Remove/simplify GameLineupTab modals

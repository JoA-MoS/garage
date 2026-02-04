# Inline Substitution Panel Design

**Date:** 2026-01-31
**Status:** Draft
**Author:** Design session with Claude

## Problem Statement

The current modal-based substitution flow in soccer-stats-ui is cumbersome for live game tracking:

1. **Too many taps** - 5+ taps for a single substitution (open modal → select out → select in → confirm → close)
2. **Modal blocks game view** - Lose context of the game while making substitutions
3. **Queue breaks on interruptions** - Recording a goal requires closing the modal and rebuilding the queue
4. **Poor visibility** - Hard to see player availability and play time at a glance

### User Context

- Primary use: Phone-in-hand active tracking during games
- Future goal: Dedicated scorer role with comprehensive dashboard
- Mental model: Primarily reactive ("Sarah needs out → who replaces her"), sometimes by-name ("Put Jimmy in")

## Solution Overview

Replace the blocking modal with a **collapsible bottom panel** that coexists with the game view. Key improvements:

- **Two taps** for any substitution or position swap
- **Non-blocking** - can record goals and other events without closing
- **Bidirectional selection** - field-first or bench-first both work
- **Play time visibility** - see minutes played for fair rotation decisions

## Detailed Design

### Panel Layout & States

The substitution panel is a collapsible drawer anchored to the bottom of the game screen.

| State          | Height      | Content                                                      |
| -------------- | ----------- | ------------------------------------------------------------ |
| **Collapsed**  | ~48px       | "Substitutions" label + queue count badge (e.g., "2 queued") |
| **Bench view** | ~40% screen | Bench players in scrollable row/grid                         |
| **Expanded**   | ~60% screen | Bench players + queued changes list                          |

**Opening the panel:**

- Tap a player on the field → panel opens to bench view
- Tap the collapsed panel bar → opens to expanded view
- Swipe up on panel → expands

**Closing/minimizing:**

- Tap background / empty space → collapses (queue persists)
- Swipe down → collapses
- Panel never auto-closes after actions

### Player Selection Flow

#### Bidirectional Selection

Both field-first and bench-first selection patterns are supported:

| First Tap    | Second Tap               | Result                                          |
| ------------ | ------------------------ | ----------------------------------------------- |
| Field player | Bench player             | Substitution: field player out, bench player in |
| Field player | Field player             | Position swap: both players exchange positions  |
| Bench player | Field player             | Substitution: field player out, bench player in |
| Any selected | Background / empty space | Deselects, no action                            |
| Any selected | Same player again        | Deselects, no action                            |
| Bench player | Another bench player     | Switches selection to new bench player          |

**Note:** Bench-first selection cannot lead to a position swap (swaps only occur between two on-field players).

#### Visual Feedback

**Field-first selection (reactive flow):**

- Field player highlighted with "selected out" indicator (colored border)
- Panel opens showing bench players
- Panel header: "Replacing: Sarah #7"

**Bench-first selection (by-name flow):**

- Bench player highlighted with "selected in" indicator
- Field remains visible above panel
- Panel header: "Bringing in: Jimmy #12 — tap player to replace"

### Bench Player Display

Each bench player card shows:

```
┌─────────────────┐
│ #12  Jimmy      │
│ ▶ 8 min played  │
└─────────────────┘
```

- **Number** - Jersey number (prominent)
- **Name** - First name or display name
- **Play time** - Minutes played this game

**Play time calculation:**

- Calculated from game events using `period` and `periodSecond` fields (not wall-clock timestamps)
- Sum of all time spent on field across stints
- Shows "0 min" for players who haven't played yet
- Updates when substitutions are confirmed

**Ordering:**

- Bench players sorted by play time (least first) to support fair rotation

**Future (not v1):**

- Configurable display metrics per team preference
- Options: time on bench, shift count, season totals

### Queue Management

**Viewing the queue:**

Tap the collapsed panel or swipe up to see expanded view:

```
┌─────────────────────────────────────────┐
│ Queued Changes (3)          [Confirm All] │
├─────────────────────────────────────────┤
│ 1. Sarah #7  →  Jimmy #12          [✕] │
│ 2. Alex #3   ↔  Mike #10           [✕] │
│ 3. Taylor #9 →  Jordan #5          [✕] │
└─────────────────────────────────────────┘
```

- Substitutions displayed with `→` (one-way arrow)
- Position swaps displayed with `↔` (two-way arrow)

**Removing from queue:**

- Tap [✕] on any item → removed immediately
- Both players return to their available pools

**Conflict handling:**

- Manual resolution (no automatic magic)
- If a bench player is already queued and you select them again, remove old queue item manually first
- Predictable behavior over smart behavior

**Confirming:**

- "Confirm All" button executes batch mutation
- Uses current game time (period + periodSecond) at confirmation
- Existing batch mutation logic reused

### Integration with Other Game Events

**Core principle:** The panel is non-blocking. All game actions remain accessible.

**Recording a goal while panel is open:**

1. Goal button stays visible in main game area (above panel)
2. Tap goal → goal recording flow proceeds
3. Panel stays collapsed/minimized during goal flow
4. After goal recorded, panel still present with queue intact

**Same applies to:**

- Cards (yellow/red)
- Assists
- Saves
- Any other game event

**Period transitions:**

When a period ends, show prompt:

- "Confirm at [period end time]" → batch executes with period end timestamp
- "Keep for next period" → queue persists, will use next period's time
- "Clear queue" → discards all queued changes

### Visual States Summary

**Field players:**

| State                     | Visual                 |
| ------------------------- | ---------------------- |
| Available                 | Normal appearance      |
| Selected (tap-to-replace) | Highlighted border     |
| Queued out                | Orange badge/indicator |

**Bench players:**

| State                       | Visual                          |
| --------------------------- | ------------------------------- |
| Available                   | Normal appearance               |
| Selected (coming in)        | Highlighted border              |
| Queued in                   | Green badge + "for [name]" text |
| Unavailable (if applicable) | Grayed out                      |

**Accessibility:**

- States use icons/badges in addition to color
- Touch targets minimum 44px

## Technical Implementation

### New Components

| Component                   | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `SubstitutionPanel`         | Collapsible drawer UI with bench view and queue display |
| `useSubstitutionQueue` hook | Queue state management, persists across panel collapse  |
| `usePlayTime` hook          | Calculate play time per player from game events         |

### Modified Components

| Component               | Changes                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `game.page.tsx`         | Add SubstitutionPanel, lift queue state, remove modal trigger |
| Field player components | Add tap handler for selection                                 |

### Unchanged

- GraphQL schema and mutations (no backend changes)
- Batch mutation logic (`BATCH_LINEUP_CHANGES`)
- Game event data structure

### State Management

Queue state lives in `game.page.tsx` (lifted up) and passed to SubstitutionPanel:

- Survives panel collapse/expand
- Persists while recording other events
- Cleared on explicit user action or period transition prompt

### Play Time Calculation

```typescript
// Pseudocode for usePlayTime hook
function calculatePlayTime(playerId: string, gameEvents: GameEvent[], currentTime: GameTime): number {
  const stints = getPlayerStints(playerId, gameEvents); // [{onTime, offTime}, ...]

  let totalSeconds = 0;
  for (const stint of stints) {
    const endTime = stint.offTime ?? currentTime; // Use current time if still on field
    totalSeconds += gameTimeToSeconds(endTime) - gameTimeToSeconds(stint.onTime);
  }

  return Math.floor(totalSeconds / 60); // Return minutes
}

function gameTimeToSeconds(time: GameTime): number {
  // Convert period + periodSecond to absolute seconds
  // Accounts for period lengths
}
```

## Out of Scope (Future Enhancements)

- Drag-and-drop interactions
- Configurable bench player display metrics per team
- Queue reordering (drag to reorder)
- Position compatibility filtering/suggestions
- Automatic conflict resolution

## Migration Path

1. Build new SubstitutionPanel alongside existing modal
2. Feature flag to switch between old/new UI
3. Test with real game usage
4. Remove old modal once validated

## Open Questions

None currently - design validated through discussion.

## Appendix: User Flow Diagrams

### Substitution (Field-First)

```
[Field View]          [Panel]
     │                    │
     ▼                    │
Tap Sarah (#7)  ────────► Panel opens (bench view)
     │                    Header: "Replacing: Sarah #7"
     │                    │
     │                    ▼
     │              Tap Jimmy (#12)
     │                    │
     ▼                    ▼
Sarah shows         "Sarah → Jimmy queued"
"pending out"       Queue badge: "1 queued"
indicator           Ready for next selection
```

### Substitution (Bench-First)

```
[Field View]          [Panel]
     │                    │
     │                    ▼
     │              Tap Jimmy (#12)
     │              Header: "Bringing in: Jimmy #12"
     │                    │
     ▼                    │
Tap Sarah (#7)  ◄─────────┘
     │
     ▼
"Sarah → Jimmy queued"
Queue badge: "1 queued"
```

### Position Swap

```
[Field View]          [Panel]
     │                    │
     ▼                    │
Tap Alex (#3)   ────────► Panel opens
     │                    Header: "Replacing: Alex #3"
     │                    │
     ▼                    │
Tap Mike (#10)  ◄─────────┘ (tapped on field, not bench)
     │
     ▼
"Alex ↔ Mike queued" (position swap)
Queue badge: "1 queued"
```

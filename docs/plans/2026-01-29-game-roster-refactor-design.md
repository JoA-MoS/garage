# Game Roster Refactor Design

**Date:** 2026-01-29
**Status:** Approved
**Scope:** soccer-stats API + UI

## Problem

The current lineup system conflates roster membership with field status:

- `BENCH` events mark players as "in game but not starting"
- `SUBSTITUTION_OUT` events add players to the bench array again
- This causes duplicate players in the bench list at halftime

## Solution

Replace `BENCH` with a new `GAME_ROSTER` event that explicitly tracks game day roster membership. Field status is computed from `SUBSTITUTION_IN` / `SUBSTITUTION_OUT` events.

## Data Model

### New Event Type: `GAME_ROSTER`

| Field            | Value                           |
| ---------------- | ------------------------------- |
| name             | `GAME_ROSTER`                   |
| category         | `TACTICAL`                      |
| description      | Player added to game day roster |
| requiresPosition | false                           |
| allowsParent     | false                           |

The `position` field on `GAME_ROSTER` events is optional:

- If set → player is a planned starter at that position
- If null → player is available but not starting (bench)

### Event Type Changes

- **Delete:** `STARTING_LINEUP` (unused, 0 events in database)
- **Delete:** `BENCH` (replaced by `GAME_ROSTER` after migration)

### Data Flow

```
Team Roster (players on team)
    ↓ addPlayerToGameRoster
Game Roster (GAME_ROSTER events)
    ↓ startPeriod / bringPlayerOntoField
On Field (SUBSTITUTION_IN events)
    ↓ substitutePlayer / endPeriod
Off Field (SUBSTITUTION_OUT events)
```

### Derived State

- `gameRoster` = all players with `GAME_ROSTER` event for this gameTeam
- `currentOnField` = computed from SUB_IN/SUB_OUT event sequence
- `bench` = gameRoster where player is not in currentOnField
- `previousPeriodLineup` = SUB_OUT events that are children of PERIOD_END (for halftime pre-fill)

## API Changes

### New Mutation

```graphql
mutation AddPlayerToGameRoster($input: AddPlayerToGameRosterInput!) {
  addPlayerToGameRoster(input: $input): GameEvent!
}

input AddPlayerToGameRosterInput {
  gameTeamId: ID!
  playerId: ID
  externalPlayerName: String
  externalPlayerNumber: String
  position: String  # Optional - if set, player is a planned starter
}
```

### Removed Mutations

- `addToBench` → replaced by `addPlayerToGameRoster`
- `addToLineup` → replaced by `addPlayerToGameRoster(position: "...")`

### Updated Response Type

```graphql
type GameLineup {
  gameTeamId: ID!
  formation: String
  gameRoster: [LineupPlayer!]! # All players in game
  currentOnField: [LineupPlayer!]! # Currently on field
  bench: [LineupPlayer!]! # Game roster - on field
  previousPeriodLineup: [LineupPlayer!] # For halftime UI pre-fill
  starters: [LineupPlayer!]! # Backward compat
}
```

## Migration Plan

### Step 1: Add new event type

```sql
INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent")
VALUES (uuid_generate_v4(), 'GAME_ROSTER', 'TACTICAL', 'Player added to game day roster', false, false);
```

### Step 2: Convert BENCH → GAME_ROSTER

```sql
UPDATE game_events
SET "eventTypeId" = (SELECT id FROM event_types WHERE name = 'GAME_ROSTER')
WHERE "eventTypeId" = (SELECT id FROM event_types WHERE name = 'BENCH');
```

### Step 3: Create GAME_ROSTER for existing starters

```sql
INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "playerId",
  "externalPlayerName", "externalPlayerNumber", "position", "recordedByUserId",
  "gameMinute", "gameSecond", "period", "periodSecond", "createdAt", "updatedAt")
SELECT
  uuid_generate_v4(),
  ge."gameId",
  ge."gameTeamId",
  (SELECT id FROM event_types WHERE name = 'GAME_ROSTER'),
  ge."playerId",
  ge."externalPlayerName",
  ge."externalPlayerNumber",
  ge."position",
  ge."recordedByUserId",
  0, 0, '1', 0,
  ge."createdAt",
  NOW()
FROM game_events ge
JOIN event_types et ON ge."eventTypeId" = et.id
WHERE et.name = 'SUBSTITUTION_IN'
  AND ge.period = '1'
  AND ge."periodSecond" = 0
  AND NOT EXISTS (
    SELECT 1 FROM game_events gr
    JOIN event_types grt ON gr."eventTypeId" = grt.id
    WHERE grt.name = 'GAME_ROSTER'
      AND gr."gameTeamId" = ge."gameTeamId"
      AND (gr."playerId" = ge."playerId" OR gr."externalPlayerName" = ge."externalPlayerName")
  );
```

### Step 4: Delete unused event types

```sql
DELETE FROM event_types WHERE name IN ('BENCH', 'STARTING_LINEUP');
```

## Service Logic

### LineupService.getGameLineup() - Simplified

```typescript
async getGameLineup(gameTeamId: string): Promise<GameLineup> {
  const events = await this.gameEventsRepository.find({
    where: { gameTeamId },
    relations: ['eventType', 'player'],
    order: { createdAt: 'ASC' },
  });

  // 1. Build game roster from GAME_ROSTER events
  const gameRoster: LineupPlayer[] = [];
  for (const event of events) {
    if (event.eventType.name === 'GAME_ROSTER') {
      gameRoster.push(toLineupPlayer(event));
    }
  }

  // 2. Track current on-field status + last known positions
  const currentOnField = new Map<string, LineupPlayer>();
  const lastPositions = new Map<string, string>();

  for (const event of events) {
    const key = getPlayerKey(event);
    if (event.eventType.name === 'SUBSTITUTION_IN') {
      currentOnField.set(key, toLineupPlayer(event));
      lastPositions.set(key, event.position);
    } else if (event.eventType.name === 'SUBSTITUTION_OUT') {
      currentOnField.delete(key);
      lastPositions.set(key, event.position);
    }
  }

  // 3. Build bench (roster members not on field)
  const onFieldKeys = new Set(currentOnField.keys());
  const bench = gameRoster
    .filter(p => !onFieldKeys.has(getPlayerKey(p)))
    .map(p => ({
      ...p,
      position: lastPositions.get(getPlayerKey(p)) ?? p.position,
    }));

  // 4. Get previous period lineup (for halftime pre-fill)
  const periodEndEvent = events.find(e =>
    e.eventType.name === 'PERIOD_END'
  );
  const previousPeriodLineup = periodEndEvent
    ? events
        .filter(e =>
          e.eventType.name === 'SUBSTITUTION_OUT' &&
          e.parentEventId === periodEndEvent.id
        )
        .map(toLineupPlayer)
    : [];

  return {
    gameTeamId,
    gameRoster,
    currentOnField: Array.from(currentOnField.values()),
    bench,
    previousPeriodLineup,
    starters: /* period 1, sec 0 SUB_INs for backward compat */,
  };
}
```

## UI Changes

### Hook changes (use-lineup.ts)

```typescript
return {
  gameRoster,
  currentOnField,
  bench,
  previousPeriodLineup,

  // New mutation
  addPlayerToGameRoster,
  removeFromGameRoster,

  // Unchanged
  substitutePlayer,
  bringPlayerOntoField,
  startPeriod,
  endPeriod,
};
```

### Component changes

| Component       | Change                                                            |
| --------------- | ----------------------------------------------------------------- |
| `LineupBench`   | Rename prop `availableRoster` → `teamRoster`, keep "Bench" label  |
| `GameLineupTab` | Use `addPlayerToGameRoster` instead of `addToLineup`/`addToBench` |
| Field component | At halftime, pre-fill from `previousPeriodLineup`                 |

### Label changes

- "Bench" → stays "Bench"
- "Available Roster" → "Team Roster"

### State-based display

| Game State  | Field shows                     | Bench shows                   |
| ----------- | ------------------------------- | ----------------------------- |
| Pre-game    | GAME_ROSTER with positions      | GAME_ROSTER without positions |
| In-progress | currentOnField                  | bench                         |
| Halftime    | previousPeriodLineup (editable) | bench                         |

## Implementation Tasks

### Backend

1. Create migration - Add `GAME_ROSTER` event type
2. Create migration - Convert `BENCH` → `GAME_ROSTER`, backfill starters
3. Create migration - Delete `BENCH` and `STARTING_LINEUP` event types
4. Update `LineupService.getGameLineup()` - New logic
5. Update `GameLineup` DTO - Add new fields
6. Add `addPlayerToGameRoster` mutation
7. Update `removeFromLineup` mutation to operate on GAME_ROSTER-based lineups (no API rename)
8. Update `startPeriod` - Read from GAME_ROSTER positions
9. Remove old mutations after UI updated
10. Update tests

### Frontend

11. Run GraphQL codegen
12. Update `use-lineup.ts` - New mutations, new fields
13. Update `LineupBench` - Rename prop, update labels
14. Update `GameLineupTab` - Use new mutations, halftime pre-fill
15. Update substitution components
16. Remove old mutation calls

## Estimated Scope

- ~10-15 files changed
- 3 database migrations

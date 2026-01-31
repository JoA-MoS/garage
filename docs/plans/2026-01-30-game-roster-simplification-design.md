# Game Roster Query Simplification

**Date:** 2026-01-30
**Status:** Proposed
**Branch:** `refactor/game-roster-event`

## Overview

Simplify the `gameLineup` GraphQL query by:

1. Reducing response complexity from 5 arrays to 2
2. Using position field to determine on-field vs bench (null = bench)
3. Optimizing with SQL window functions instead of Node.js array processing
4. Deriving formation from events instead of storing on GameTeam entity

## Current State

### GraphQL Response (Before)

```graphql
type GameLineup {
  gameTeamId: ID!
  formation: String
  gameRoster: [LineupPlayer!]! # All players on game roster
  starters: [LineupPlayer!]! # Players who started
  bench: [LineupPlayer!]! # Players not on field
  currentOnField: [LineupPlayer!]! # Players currently on field
  previousPeriodLineup: [LineupPlayer] # For halftime pre-fill
}
```

### Current Backend Logic

- Fetches ALL events for a gameTeam
- Filters in Node.js by event type name
- Replays events to derive current state
- Multiple array traversals

## Proposed Changes

### Simplified GraphQL Response

```graphql
type GameRoster {
  gameTeamId: ID!
  formation: String
  players: [LineupPlayer!]! # All players with current position
  previousPeriodLineup: [LineupPlayer] # For halftime pre-fill
}

type LineupPlayer {
  gameEventId: ID!
  playerId: ID
  playerName: String
  firstName: String
  lastName: String
  externalPlayerName: String
  externalPlayerNumber: String
  position: String # null = bench, otherwise = on field
  # isOnField removed - derived from position != null
}
```

### Position Logic

- `position != null` → Player is on field at that position
- `position == null` → Player is on bench

### Frontend Derivation

```typescript
const onField = players.filter((p) => p.position != null);
const bench = players.filter((p) => p.position == null);
```

## Backend Implementation

### Optimized SQL Query

Uses window function to get latest state per player in a single DB query:

```typescript
async getGameRoster(gameTeamId: string): Promise<GameRoster> {
  const relevantTypes = ['GAME_ROSTER', 'SUBSTITUTION_IN', 'SUBSTITUTION_OUT', 'POSITION_CHANGE'];
  const typeIds = relevantTypes.map(name => this.coreService.getEventTypeByName(name).id);

  // Subquery with window function, outer query filters rn = 1
  const players = await this.gameEventsRepository.manager
    .createQueryBuilder()
    .select([
      'sub."gameEventId"',
      'sub."playerId"',
      'sub."externalPlayerName"',
      'sub."externalPlayerNumber"',
      'sub."position"',
      'sub."firstName"',
      'sub."lastName"',
    ])
    .from(subQuery => {
      return subQuery
        .select('e.id', 'gameEventId')
        .addSelect('e.player_id', 'playerId')
        .addSelect('e.external_player_name', 'externalPlayerName')
        .addSelect('e.external_player_number', 'externalPlayerNumber')
        .addSelect(`CASE WHEN et.name = 'SUBSTITUTION_OUT' THEN NULL ELSE e.position END`, 'position')
        .addSelect('p.first_name', 'firstName')
        .addSelect('p.last_name', 'lastName')
        .addSelect(
          `ROW_NUMBER() OVER (
            PARTITION BY COALESCE(e.player_id::text, e.external_player_name)
            ORDER BY e.period DESC, e.period_second DESC, e.created_at DESC
          )`,
          'rn'
        )
        .from(GameEvent, 'e')
        .innerJoin('e.eventType', 'et')
        .leftJoin('e.player', 'p')
        .where('e.gameTeamId = :gameTeamId', { gameTeamId })
        .andWhere('et.id IN (:...typeIds)', { typeIds });
    }, 'sub')
    .where('sub.rn = 1')
    .setParameters({ gameTeamId, typeIds })
    .getRawMany();

  // Get latest formation from FORMATION_CHANGE events
  const latestFormation = await this.gameEventsRepository
    .createQueryBuilder('e')
    .select('e.formation', 'formation')
    .innerJoin('e.eventType', 'et')
    .where('e.gameTeamId = :gameTeamId', { gameTeamId })
    .andWhere('et.name = :name', { name: 'FORMATION_CHANGE' })
    .orderBy('e.period', 'DESC')
    .addOrderBy('e.periodSecond', 'DESC')
    .addOrderBy('e.createdAt', 'DESC')
    .limit(1)
    .getRawOne();

  return {
    gameTeamId,
    formation: latestFormation?.formation ?? null,
    players: players.map(p => ({
      gameEventId: p.gameEventId,
      playerId: p.playerId,
      externalPlayerName: p.externalPlayerName,
      externalPlayerNumber: p.externalPlayerNumber,
      position: p.position,
      firstName: p.firstName,
      lastName: p.lastName,
      playerName: [p.firstName, p.lastName].filter(Boolean).join(' ') || null,
    })),
  };
}
```

### Event Types Used

Filtered by category at DB level for efficiency:

| Event Type         | Category     | Effect on Position                        |
| ------------------ | ------------ | ----------------------------------------- |
| `GAME_ROSTER`      | TACTICAL     | Sets initial position (or null for bench) |
| `SUBSTITUTION_IN`  | SUBSTITUTION | Sets position (onto field)                |
| `SUBSTITUTION_OUT` | SUBSTITUTION | Clears position to null (to bench)        |
| `POSITION_CHANGE`  | TACTICAL     | Updates position                          |
| `FORMATION_CHANGE` | TACTICAL     | Updates team formation                    |

### Formation Derived from Events

Formation is stored on `FORMATION_CHANGE` events in the `formation` column. The current formation is the most recent event's value.

This replaces the current dual-write to `GameTeam.formation`.

## Frontend Implementation

### Updated Hook

```typescript
export function useLineup({ gameTeamId, gameId }: UseLineupOptions) {
  const { data, loading, error, refetch } = useQuery(GetGameRosterDocument, {
    variables: { gameTeamId },
    skip: !gameTeamId,
    fetchPolicy: 'cache-and-network',
  });

  const players = data?.gameRoster?.players ?? [];

  const onField = useMemo(() => players.filter((p) => p.position != null), [players]);

  const bench = useMemo(() => players.filter((p) => p.position == null), [players]);

  return {
    formation: data?.gameRoster?.formation,
    players,
    onField,
    bench,
    previousPeriodLineup: data?.gameRoster?.previousPeriodLineup,
    // ... mutations unchanged
  };
}
```

### Component Updates

| Before           | After                      |
| ---------------- | -------------------------- |
| `currentOnField` | `onField`                  |
| `starters`       | Removed (derive if needed) |
| `gameRoster`     | `players`                  |

## Migration Plan

### Phase 1: Add New Query (Non-Breaking)

1. Create `GameRoster` DTO
2. Add `gameRoster` resolver alongside existing `gameLineup`
3. Implement optimized SQL query in `LineupService`

### Phase 2: Frontend Migration

1. Update `useLineup` hook to use `GetGameRosterDocument`
2. Update components to use `onField`/`bench` naming
3. Run GraphQL codegen
4. Test all lineup functionality

### Phase 3: Remove Old Query

1. Remove `gameLineup` resolver
2. Remove `GameLineup` DTO
3. Clean up unused methods in `LineupService`

### Phase 4: Remove GameTeam.formation

1. Ensure `FORMATION_CHANGE` event created on game setup
2. Create migration to remove `formation` column from `game_teams`
3. Remove dual-write in `recordFormationChange`

## Performance Comparison

| Metric          | Before               | After                   |
| --------------- | -------------------- | ----------------------- |
| DB Queries      | 1 (all events)       | 2 (players + formation) |
| Rows Fetched    | O(events) ~50-100    | O(players) ~15-25       |
| Node Processing | Array traversal × 4  | Simple map              |
| Memory          | All events in memory | Final state only        |

## Breaking Changes

- GraphQL query renamed: `gameLineup` → `gameRoster`
- Fields removed: `starters`, `bench`, `currentOnField`, `gameRoster`
- Field removed from `LineupPlayer`: `isOnField`
- Column removed: `game_teams.formation` (Phase 4)

## Testing

- Unit tests for new `getGameRoster` method
- Verify window function handles edge cases:
  - Player with no events
  - Player subbed in/out multiple times
  - Position changes during game
- E2E tests for lineup page functionality
- Verify `previousPeriodLineup` still works for halftime

## Open Questions

None - design approved.

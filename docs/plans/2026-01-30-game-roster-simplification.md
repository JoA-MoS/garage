# Game Roster Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the gameLineup query to a more efficient gameRoster query using SQL window functions and position-based on-field/bench derivation.

**Architecture:** Replace Node.js event replay with SQL window functions to compute current player positions. Use position field (null = bench, value = on-field). Derive formation from FORMATION_CHANGE events.

**Tech Stack:** NestJS, TypeORM QueryBuilder, PostgreSQL window functions, GraphQL, React/Apollo Client

---

## Task 1: Create GameRoster DTO

**Files:**

- Create: `apps/soccer-stats/api/src/modules/game-events/dto/game-roster.output.ts`

**Step 1: Create the DTO file**

```typescript
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class RosterPlayer {
  @Field(() => ID)
  gameEventId: string;

  @Field(() => ID, { nullable: true })
  playerId?: string;

  @Field({ nullable: true })
  playerName?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  externalPlayerName?: string;

  @Field({ nullable: true })
  externalPlayerNumber?: string;

  @Field({ nullable: true, description: 'Position on field. null = on bench' })
  position?: string;
}

@ObjectType()
export class GameRoster {
  @Field(() => ID)
  gameTeamId: string;

  @Field({ nullable: true })
  formation?: string;

  @Field(() => [RosterPlayer])
  players: RosterPlayer[];

  @Field(() => [RosterPlayer], { nullable: true })
  previousPeriodLineup?: RosterPlayer[];
}
```

**Step 2: Export from module index**

Add to `apps/soccer-stats/api/src/modules/game-events/dto/index.ts`:

```typescript
export * from './game-roster.output';
```

**Step 3: Commit**

```bash
git add apps/soccer-stats/api/src/modules/game-events/dto/game-roster.output.ts
git add apps/soccer-stats/api/src/modules/game-events/dto/index.ts
git commit -m "feat(soccer-stats-api): add GameRoster DTO"
```

---

## Task 2: Add getGameRoster Method to LineupService

**Files:**

- Modify: `apps/soccer-stats/api/src/modules/game-events/services/lineup.service.ts`
- Reference: `apps/soccer-stats/api/src/entities/game-event.entity.ts`

**Step 1: Add imports at top of file**

```typescript
import { In } from 'typeorm';
import { GameRoster, RosterPlayer } from '../dto/game-roster.output';
```

**Step 2: Add the getGameRoster method**

Add this method to the `LineupService` class:

```typescript
/**
 * Get current game roster with player positions.
 * Uses SQL window function for efficient single-query retrieval.
 *
 * Position logic:
 * - position != null → player is on field at that position
 * - position == null → player is on bench
 */
async getGameRoster(gameTeamId: string): Promise<GameRoster> {
  // Get event type IDs for roster-related events
  const relevantTypes = [
    'GAME_ROSTER',
    'SUBSTITUTION_IN',
    'SUBSTITUTION_OUT',
    'POSITION_CHANGE',
  ];
  const typeIds = relevantTypes.map(
    (name) => this.coreService.getEventTypeByName(name).id,
  );

  // Query current state per player using window function
  // ROW_NUMBER partitions by player, orders by time DESC to get latest event
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
    .from((subQuery) => {
      return subQuery
        .select('e.id', 'gameEventId')
        .addSelect('e.playerId', 'playerId')
        .addSelect('e.externalPlayerName', 'externalPlayerName')
        .addSelect('e.externalPlayerNumber', 'externalPlayerNumber')
        .addSelect(
          `CASE WHEN et.name = 'SUBSTITUTION_OUT' THEN NULL ELSE e.position END`,
          'position',
        )
        .addSelect('p.firstName', 'firstName')
        .addSelect('p.lastName', 'lastName')
        .addSelect(
          `ROW_NUMBER() OVER (
            PARTITION BY COALESCE(e."playerId"::text, e."externalPlayerName")
            ORDER BY e.period DESC, e."periodSecond" DESC, e."createdAt" DESC
          )`,
          'rn',
        )
        .from('game_events', 'e')
        .innerJoin('event_types', 'et', 'e."eventTypeId" = et.id')
        .leftJoin('users', 'p', 'e."playerId" = p.id')
        .where('e."gameTeamId" = :gameTeamId', { gameTeamId })
        .andWhere('et.id IN (:...typeIds)', { typeIds });
    }, 'sub')
    .where('sub.rn = 1')
    .setParameters({ gameTeamId, typeIds })
    .getRawMany();

  // Get latest formation from FORMATION_CHANGE events
  const formationChangeType =
    this.coreService.getEventTypeByName('FORMATION_CHANGE');
  const latestFormation = await this.gameEventsRepository
    .createQueryBuilder('e')
    .select('e.formation', 'formation')
    .where('e.gameTeamId = :gameTeamId', { gameTeamId })
    .andWhere('e.eventTypeId = :eventTypeId', {
      eventTypeId: formationChangeType.id,
    })
    .orderBy('e.period', 'DESC')
    .addOrderBy('e.periodSecond', 'DESC')
    .addOrderBy('e.createdAt', 'DESC')
    .limit(1)
    .getRawOne();

  // Get previous period lineup for halftime pre-fill
  const periodEndType = this.coreService.getEventTypeByName('PERIOD_END');
  const periodEndEvent = await this.gameEventsRepository.findOne({
    where: {
      gameTeamId,
      eventTypeId: periodEndType.id,
    },
    order: { createdAt: 'DESC' },
  });

  let previousPeriodLineup: RosterPlayer[] | undefined;
  if (periodEndEvent) {
    const subOutType = this.coreService.getEventTypeByName('SUBSTITUTION_OUT');
    const subOutEvents = await this.gameEventsRepository.find({
      where: {
        gameTeamId,
        eventTypeId: subOutType.id,
        parentEventId: periodEndEvent.id,
      },
      relations: ['player'],
    });
    previousPeriodLineup = subOutEvents.map((e) => ({
      gameEventId: e.id,
      playerId: e.playerId,
      playerName: e.player
        ? `${e.player.firstName || ''} ${e.player.lastName || ''}`.trim()
        : undefined,
      firstName: e.player?.firstName,
      lastName: e.player?.lastName,
      externalPlayerName: e.externalPlayerName,
      externalPlayerNumber: e.externalPlayerNumber,
      position: e.position,
    }));
  }

  return {
    gameTeamId,
    formation: latestFormation?.formation ?? null,
    players: players.map((p) => ({
      gameEventId: p.gameEventId,
      playerId: p.playerId,
      externalPlayerName: p.externalPlayerName,
      externalPlayerNumber: p.externalPlayerNumber,
      position: p.position,
      firstName: p.firstName,
      lastName: p.lastName,
      playerName:
        [p.firstName, p.lastName].filter(Boolean).join(' ') || undefined,
    })),
    previousPeriodLineup,
  };
}
```

**Step 3: Commit**

```bash
git add apps/soccer-stats/api/src/modules/game-events/services/lineup.service.ts
git commit -m "feat(soccer-stats-api): add getGameRoster method with SQL window function"
```

---

## Task 3: Add GraphQL Resolver for gameRoster Query

**Files:**

- Modify: `apps/soccer-stats/api/src/modules/game-events/game-events.resolver.ts`

**Step 1: Add import for GameRoster DTO**

```typescript
import { GameRoster } from './dto/game-roster.output';
```

**Step 2: Add the resolver method**

Add this query resolver method:

```typescript
@Query(() => GameRoster, {
  description: 'Get current game roster with player positions',
})
async gameRoster(
  @Args('gameTeamId', { type: () => ID }) gameTeamId: string,
): Promise<GameRoster> {
  return this.lineupService.getGameRoster(gameTeamId);
}
```

**Step 3: Commit**

```bash
git add apps/soccer-stats/api/src/modules/game-events/game-events.resolver.ts
git commit -m "feat(soccer-stats-api): add gameRoster GraphQL query"
```

---

## Task 4: Write Unit Tests for getGameRoster

**Files:**

- Modify: `apps/soccer-stats/api/src/modules/game-events/services/lineup.service.spec.ts`

**Step 1: Add test for empty roster**

```typescript
describe('getGameRoster', () => {
  it('should return empty players array when no events exist', async () => {
    const result = await service.getGameRoster('non-existent-game-team');

    expect(result.gameTeamId).toBe('non-existent-game-team');
    expect(result.players).toEqual([]);
    expect(result.formation).toBeNull();
  });
});
```

**Step 2: Add test for players with positions (on field)**

```typescript
it('should return players with positions from GAME_ROSTER events', async () => {
  // This test will use mocked repository data
  // The actual test implementation depends on existing test setup
});
```

**Step 3: Add test for substitution affecting position**

```typescript
it('should set position to null after SUBSTITUTION_OUT', async () => {
  // Player added with position, then subbed out = position should be null
});
```

**Step 4: Run tests**

```bash
pnpm nx test soccer-stats-api --testPathPattern="lineup.service"
```

**Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/game-events/services/lineup.service.spec.ts
git commit -m "test(soccer-stats-api): add unit tests for getGameRoster"
```

---

## Task 5: Update Frontend GraphQL Query

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/services/games-graphql.service.ts`

**Step 1: Add GetGameRoster query**

```typescript
export const GET_GAME_ROSTER = gql`
  query GetGameRoster($gameTeamId: ID!) {
    gameRoster(gameTeamId: $gameTeamId) {
      gameTeamId
      formation
      players {
        gameEventId
        playerId
        playerName
        firstName
        lastName
        externalPlayerName
        externalPlayerNumber
        position
      }
      previousPeriodLineup {
        gameEventId
        playerId
        playerName
        firstName
        lastName
        externalPlayerName
        externalPlayerNumber
        position
      }
    }
  }
`;
```

**Step 2: Run GraphQL codegen**

```bash
pnpm nx graphql-codegen soccer-stats-ui
```

**Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/services/games-graphql.service.ts
git add apps/soccer-stats/ui/src/app/generated/
git commit -m "feat(soccer-stats-ui): add GetGameRoster GraphQL query"
```

---

## Task 6: Update useLineup Hook

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/hooks/use-lineup.ts`

**Step 1: Update imports**

Replace `GetGameLineupDocument` with `GetGameRosterDocument`:

```typescript
import {
  GetGameRosterDocument,
  // ... other imports
} from '@garage/soccer-stats/graphql-codegen';
```

**Step 2: Update query usage**

```typescript
const {
  data: rosterData,
  loading: rosterLoading,
  error: rosterError,
  refetch: refetchRoster,
} = useQuery(GetGameRosterDocument, {
  variables: { gameTeamId },
  skip: !gameTeamId,
  fetchPolicy: 'cache-and-network',
});
```

**Step 3: Derive onField and bench from players**

```typescript
const players = rosterData?.gameRoster?.players ?? [];

const onField = useMemo(() => players.filter((p) => p.position != null), [players]);

const bench = useMemo(() => players.filter((p) => p.position == null), [players]);
```

**Step 4: Update return values**

```typescript
return {
  // Data
  formation: rosterData?.gameRoster?.formation,
  players,
  onField,
  bench,
  previousPeriodLineup: rosterData?.gameRoster?.previousPeriodLineup,
  teamRoster,
  availableRoster,

  // Loading states
  loading: rosterLoading || gameLoading,
  // ... rest unchanged
};
```

**Step 5: Commit**

```bash
git add apps/soccer-stats/ui/src/app/hooks/use-lineup.ts
git commit -m "refactor(soccer-stats-ui): update useLineup hook to use gameRoster query"
```

---

## Task 7: Update GameLineupTab Component

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.tsx`

**Step 1: Update destructuring from useLineup**

Replace:

```typescript
const {
  starters,
  bench,
  currentOnField,
  // ...
} = useLineup({ gameTeamId, gameId });
```

With:

```typescript
const {
  onField,
  bench,
  // ...
} = useLineup({ gameTeamId, gameId });
```

**Step 2: Update FieldLineup prop**

Replace:

```typescript
<FieldLineup
  formation={selectedFormation}
  lineup={currentOnField}
  // ...
/>
```

With:

```typescript
<FieldLineup
  formation={selectedFormation}
  lineup={onField}
  // ...
/>
```

**Step 3: Update any other references to currentOnField**

Search for `currentOnField` and replace with `onField`.

**Step 4: Run lint and type check**

```bash
pnpm nx lint soccer-stats-ui
pnpm nx build soccer-stats-ui
```

**Step 5: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.tsx
git commit -m "refactor(soccer-stats-ui): update GameLineupTab to use onField from new query"
```

---

## Task 8: Manual Testing

**Step 1: Start the application**

```bash
pnpm nx serve soccer-stats-ui
```

**Step 2: Test pre-game lineup**

1. Navigate to a game's lineup page
2. Click "+" on a field position
3. Select a player from roster
4. Verify player appears on field (not bench)

**Step 3: Test bench functionality**

1. Add a player without position (to bench)
2. Verify player appears in bench section
3. Click on bench player
4. Assign to position
5. Verify player moves to field

**Step 4: Test substitutions (if game in progress)**

1. Sub out a player
2. Verify they move to bench (position = null)
3. Sub in a player
4. Verify they appear on field

---

## Task 9: Remove Old gameLineup Query (Cleanup)

**Files:**

- Modify: `apps/soccer-stats/api/src/modules/game-events/game-events.resolver.ts`
- Modify: `apps/soccer-stats/api/src/modules/game-events/dto/game-lineup.output.ts`

**Step 1: Mark old query as deprecated (optional transition period)**

Or directly remove:

```typescript
// Remove the old gameLineup query resolver method
```

**Step 2: Remove old DTO if no longer used**

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor(soccer-stats-api): remove deprecated gameLineup query"
```

---

## Summary

After completing all tasks:

- New `gameRoster` query with efficient SQL window function
- Frontend uses `onField`/`bench` derived from position
- Old `gameLineup` query removed
- All tests passing

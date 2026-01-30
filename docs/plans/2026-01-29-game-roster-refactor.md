# Game Roster Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace BENCH event with GAME_ROSTER event to cleanly separate roster membership from field status, eliminating duplicate players in bench list.

**Architecture:** New GAME_ROSTER event type tracks game day roster membership. Field status (on/off field) computed from SUBSTITUTION_IN/OUT events. Bench is derived as gameRoster - currentOnField.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, GraphQL (TypeGraphQL), React, Apollo Client

---

## Task 1: Add GAME_ROSTER Event Type (Migration)

**Files:**
- Create: `apps/soccer-stats/api/src/database/migrations/TIMESTAMP-AddGameRosterEventType.ts`

**Step 1: Generate migration file**

Run:
```bash
cd /home/joamos/code/github/garage/.worktrees/game-roster-refactor
pnpm nx migration:generate soccer-stats-api --name=AddGameRosterEventType
```

**Step 2: Replace migration content**

Replace the generated migration with:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGameRosterEventType1706567400000 implements MigrationInterface {
  name = 'AddGameRosterEventType1706567400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add GAME_ROSTER event type
    await queryRunner.query(`
      INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent", "createdAt", "updatedAt")
      VALUES (
        uuid_generate_v4(),
        'GAME_ROSTER',
        'TACTICAL',
        'Player added to game day roster',
        false,
        false,
        NOW(),
        NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM event_types WHERE name = 'GAME_ROSTER'
    `);
  }
}
```

**Step 3: Run migration**

Run:
```bash
pnpm nx migration:run soccer-stats-api
```

Expected: Migration runs successfully

**Step 4: Verify event type exists**

Run:
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d soccer_stats -c "SELECT name, category FROM event_types WHERE name = 'GAME_ROSTER';"
```

Expected: One row with GAME_ROSTER, TACTICAL

**Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/database/migrations/
git commit -m "feat(soccer-stats-api): add GAME_ROSTER event type migration"
```

---

## Task 2: Convert BENCH to GAME_ROSTER and Backfill Starters (Migration)

**Files:**
- Create: `apps/soccer-stats/api/src/database/migrations/TIMESTAMP-ConvertBenchToGameRoster.ts`

**Step 1: Generate migration file**

Run:
```bash
pnpm nx migration:generate soccer-stats-api --name=ConvertBenchToGameRoster
```

**Step 2: Replace migration content**

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertBenchToGameRoster1706567500000 implements MigrationInterface {
  name = 'ConvertBenchToGameRoster1706567500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Convert existing BENCH events to GAME_ROSTER
    await queryRunner.query(`
      UPDATE game_events
      SET "eventTypeId" = (SELECT id FROM event_types WHERE name = 'GAME_ROSTER')
      WHERE "eventTypeId" = (SELECT id FROM event_types WHERE name = 'BENCH')
    `);

    // Step 2: Create GAME_ROSTER events for existing starters (SUBSTITUTION_IN at period 1, sec 0)
    // who don't already have a GAME_ROSTER event
    await queryRunner.query(`
      INSERT INTO game_events (
        id, "gameId", "gameTeamId", "eventTypeId", "playerId",
        "externalPlayerName", "externalPlayerNumber", "position", "recordedByUserId",
        "gameMinute", "gameSecond", "period", "periodSecond", "createdAt", "updatedAt"
      )
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
            AND (
              (gr."playerId" IS NOT NULL AND gr."playerId" = ge."playerId")
              OR (gr."externalPlayerName" IS NOT NULL AND gr."externalPlayerName" = ge."externalPlayerName")
            )
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Convert GAME_ROSTER back to BENCH (only the ones that were originally BENCH)
    // Note: This is a lossy rollback - we can't distinguish original BENCH from backfilled starters
    await queryRunner.query(`
      UPDATE game_events
      SET "eventTypeId" = (SELECT id FROM event_types WHERE name = 'BENCH')
      WHERE "eventTypeId" = (SELECT id FROM event_types WHERE name = 'GAME_ROSTER')
    `);
  }
}
```

**Step 3: Run migration**

Run:
```bash
pnpm nx migration:run soccer-stats-api
```

Expected: Migration runs successfully

**Step 4: Verify conversion**

Run:
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d soccer_stats -c "
SELECT et.name, COUNT(*)
FROM game_events ge
JOIN event_types et ON ge.\"eventTypeId\" = et.id
WHERE et.name IN ('BENCH', 'GAME_ROSTER')
GROUP BY et.name;
"
```

Expected: GAME_ROSTER with count > 0, no BENCH events

**Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/database/migrations/
git commit -m "feat(soccer-stats-api): convert BENCH to GAME_ROSTER and backfill starters"
```

---

## Task 3: Delete Unused Event Types (Migration)

**Files:**
- Create: `apps/soccer-stats/api/src/database/migrations/TIMESTAMP-RemoveUnusedEventTypes.ts`

**Step 1: Generate migration file**

Run:
```bash
pnpm nx migration:generate soccer-stats-api --name=RemoveUnusedEventTypes
```

**Step 2: Replace migration content**

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedEventTypes1706567600000 implements MigrationInterface {
  name = 'RemoveUnusedEventTypes1706567600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete BENCH and STARTING_LINEUP event types
    // BENCH has been converted to GAME_ROSTER
    // STARTING_LINEUP was never used (0 events)
    await queryRunner.query(`
      DELETE FROM event_types WHERE name IN ('BENCH', 'STARTING_LINEUP')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create the event types
    await queryRunner.query(`
      INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent", "createdAt", "updatedAt")
      VALUES
        (uuid_generate_v4(), 'BENCH', 'TACTICAL', 'Player assigned to bench roster for the game', false, false, NOW(), NOW()),
        (uuid_generate_v4(), 'STARTING_LINEUP', 'TACTICAL', 'Player assigned to starting lineup with formation position', true, false, NOW(), NOW())
    `);
  }
}
```

**Step 3: Run migration**

Run:
```bash
pnpm nx migration:run soccer-stats-api
```

Expected: Migration runs successfully

**Step 4: Verify event types removed**

Run:
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d soccer_stats -c "SELECT name FROM event_types WHERE name IN ('BENCH', 'STARTING_LINEUP');"
```

Expected: 0 rows

**Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/database/migrations/
git commit -m "feat(soccer-stats-api): remove BENCH and STARTING_LINEUP event types"
```

---

## Task 4: Update GameLineup DTO

**Files:**
- Modify: `apps/soccer-stats/api/src/modules/game-events/dto/game-lineup.output.ts`

**Step 1: Read current file**

Read the file to understand current structure.

**Step 2: Add new fields to GameLineup**

Add `gameRoster` and `previousPeriodLineup` fields:

```typescript
@ObjectType()
export class GameLineup {
  @Field(() => ID)
  gameTeamId: string;

  @Field({ nullable: true })
  formation?: string;

  @Field(() => [LineupPlayer])
  gameRoster: LineupPlayer[];  // NEW: All players in game roster

  @Field(() => [LineupPlayer])
  starters: LineupPlayer[];

  @Field(() => [LineupPlayer])
  bench: LineupPlayer[];

  @Field(() => [LineupPlayer])
  currentOnField: LineupPlayer[];

  @Field(() => [LineupPlayer], { nullable: true })
  previousPeriodLineup?: LineupPlayer[];  // NEW: For halftime pre-fill
}
```

**Step 3: Run lint**

Run:
```bash
pnpm nx lint soccer-stats-api
```

Expected: No errors

**Step 4: Commit**

```bash
git add apps/soccer-stats/api/src/modules/game-events/dto/game-lineup.output.ts
git commit -m "feat(soccer-stats-api): add gameRoster and previousPeriodLineup to GameLineup DTO"
```

---

## Task 5: Update EventCoreService for GAME_ROSTER

**Files:**
- Modify: `apps/soccer-stats/api/src/modules/game-events/services/event-core.service.ts`

**Step 1: Read current file**

Check how event types are cached/accessed.

**Step 2: Ensure GAME_ROSTER is available in event type cache**

The EventCoreService likely caches event types. Verify GAME_ROSTER can be retrieved via `getEventTypeByName('GAME_ROSTER')`.

If event types are loaded from DB on startup, no changes needed - just verify.

**Step 3: Run tests**

Run:
```bash
pnpm nx test soccer-stats-api
```

Expected: All tests pass

**Step 4: Commit (if changes made)**

```bash
git add apps/soccer-stats/api/src/modules/game-events/services/event-core.service.ts
git commit -m "feat(soccer-stats-api): support GAME_ROSTER in event type service"
```

---

## Task 6: Rewrite LineupService.getGameLineup()

**Files:**
- Modify: `apps/soccer-stats/api/src/modules/game-events/services/lineup.service.ts`

**Step 1: Write failing test**

Add to test file `apps/soccer-stats/api/src/modules/game-events/services/lineup.service.spec.ts` (create if needed):

```typescript
describe('getGameLineup with GAME_ROSTER', () => {
  it('should return gameRoster from GAME_ROSTER events', async () => {
    // Setup: Create mock events with GAME_ROSTER type
    const mockEvents = [
      createMockEvent('GAME_ROSTER', { playerId: 'player1', position: 'CM' }),
      createMockEvent('GAME_ROSTER', { playerId: 'player2', position: null }),
    ];
    mockGameEventsRepository.find.mockResolvedValue(mockEvents);
    mockGameTeamsRepository.findOne.mockResolvedValue({ id: 'gt1', formation: '4-3-3' });

    const result = await service.getGameLineup('gt1');

    expect(result.gameRoster).toHaveLength(2);
    expect(result.gameRoster[0].playerId).toBe('player1');
  });

  it('should compute bench as gameRoster minus currentOnField', async () => {
    const mockEvents = [
      createMockEvent('GAME_ROSTER', { playerId: 'player1', position: 'CM' }),
      createMockEvent('GAME_ROSTER', { playerId: 'player2', position: null }),
      createMockEvent('SUBSTITUTION_IN', { playerId: 'player1', position: 'CM' }),
    ];
    mockGameEventsRepository.find.mockResolvedValue(mockEvents);
    mockGameTeamsRepository.findOne.mockResolvedValue({ id: 'gt1' });

    const result = await service.getGameLineup('gt1');

    expect(result.currentOnField).toHaveLength(1);
    expect(result.bench).toHaveLength(1);
    expect(result.bench[0].playerId).toBe('player2');
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test soccer-stats-api --testPathPattern="lineup"
```

Expected: Tests fail (gameRoster not returned)

**Step 3: Implement new getGameLineup logic**

Replace the `getGameLineup` method in `lineup.service.ts`:

```typescript
async getGameLineup(gameTeamId: string): Promise<GameLineup> {
  const gameTeam = await this.gameTeamsRepository.findOne({
    where: { id: gameTeamId },
  });

  if (!gameTeam) {
    throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
  }

  const events = await this.gameEventsRepository.find({
    where: { gameTeamId },
    relations: ['eventType', 'player'],
    order: { createdAt: 'ASC' },
  });

  // 1. Build game roster from GAME_ROSTER events
  const gameRoster: LineupPlayer[] = [];
  const rosterByKey = new Map<string, LineupPlayer>();

  for (const event of events) {
    if (event.eventType.name === 'GAME_ROSTER') {
      const player = this.toLineupPlayer(event);
      gameRoster.push(player);
      const key = this.getPlayerKey(event);
      rosterByKey.set(key, player);
    }
  }

  // 2. Track current on-field status and last positions
  const currentOnField = new Map<string, LineupPlayer>();
  const lastPositions = new Map<string, string>();
  const starters: LineupPlayer[] = [];

  for (const event of events) {
    const key = this.getPlayerKey(event);

    if (event.eventType.name === 'SUBSTITUTION_IN') {
      const player = this.toLineupPlayer(event);
      player.isOnField = true;
      currentOnField.set(key, player);
      lastPositions.set(key, event.position || '');

      // Track starters (period 1, second 0)
      if (event.period === '1' && event.periodSecond === 0) {
        starters.push(player);
      }
    } else if (event.eventType.name === 'SUBSTITUTION_OUT') {
      currentOnField.delete(key);
      lastPositions.set(key, event.position || '');
    }
  }

  // 3. Build bench (roster members not on field)
  const onFieldKeys = new Set(currentOnField.keys());
  const bench = gameRoster
    .filter((p) => !onFieldKeys.has(this.getPlayerKeyFromLineup(p)))
    .map((p) => {
      const key = this.getPlayerKeyFromLineup(p);
      return {
        ...p,
        position: lastPositions.get(key) ?? p.position,
        isOnField: false,
      };
    });

  // 4. Get previous period lineup (for halftime pre-fill)
  const periodEndEvent = events.find(
    (e) => e.eventType.name === 'PERIOD_END'
  );
  const previousPeriodLineup = periodEndEvent
    ? events
        .filter(
          (e) =>
            e.eventType.name === 'SUBSTITUTION_OUT' &&
            e.parentEventId === periodEndEvent.id
        )
        .map((e) => this.toLineupPlayer(e))
    : undefined;

  return {
    gameTeamId,
    formation: gameTeam.formation,
    gameRoster,
    starters,
    bench,
    currentOnField: Array.from(currentOnField.values()),
    previousPeriodLineup,
  };
}

private toLineupPlayer(event: GameEvent): LineupPlayer {
  return {
    gameEventId: event.id,
    playerId: event.playerId,
    playerName: event.player
      ? `${event.player.firstName || ''} ${event.player.lastName || ''}`.trim() ||
        event.player.email
      : undefined,
    firstName: event.player?.firstName,
    lastName: event.player?.lastName,
    externalPlayerName: event.externalPlayerName,
    externalPlayerNumber: event.externalPlayerNumber,
    position: event.position,
    isOnField: false,
  };
}

private getPlayerKey(event: GameEvent): string {
  return event.playerId || event.externalPlayerName || event.id;
}

private getPlayerKeyFromLineup(player: LineupPlayer): string {
  return player.playerId || player.externalPlayerName || player.gameEventId;
}
```

**Step 4: Run tests**

Run:
```bash
pnpm nx test soccer-stats-api --testPathPattern="lineup"
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/game-events/services/lineup.service.ts
git add apps/soccer-stats/api/src/modules/game-events/services/lineup.service.spec.ts
git commit -m "feat(soccer-stats-api): rewrite getGameLineup for GAME_ROSTER model"
```

---

## Task 7: Add addPlayerToGameRoster Mutation

**Files:**
- Create: `apps/soccer-stats/api/src/modules/game-events/dto/add-to-game-roster.input.ts`
- Modify: `apps/soccer-stats/api/src/modules/game-events/services/lineup.service.ts`
- Modify: `apps/soccer-stats/api/src/modules/game-events/game-events.service.ts`
- Modify: `apps/soccer-stats/api/src/modules/game-events/game-events.resolver.ts`

**Step 1: Create input DTO**

Create `apps/soccer-stats/api/src/modules/game-events/dto/add-to-game-roster.input.ts`:

```typescript
import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class AddToGameRosterInput {
  @Field(() => ID)
  gameTeamId: string;

  @Field(() => ID, { nullable: true })
  playerId?: string;

  @Field({ nullable: true })
  externalPlayerName?: string;

  @Field({ nullable: true })
  externalPlayerNumber?: string;

  @Field({ nullable: true, description: 'Position if player is a planned starter' })
  position?: string;
}
```

**Step 2: Add service method**

Add to `lineup.service.ts`:

```typescript
async addPlayerToGameRoster(
  input: AddToGameRosterInput,
  recordedByUserId: string,
): Promise<GameEvent> {
  this.coreService.ensurePlayerInfoProvided(
    input.playerId,
    input.externalPlayerName,
    'game roster entry',
  );

  const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
  const eventType = this.coreService.getEventTypeByName('GAME_ROSTER');

  // Check if player is already in game roster
  await this.ensurePlayerNotInGameRoster(
    gameTeam.id,
    input.playerId,
    input.externalPlayerName,
  );

  const gameEvent = this.gameEventsRepository.create({
    gameId: gameTeam.gameId,
    gameTeamId: input.gameTeamId,
    eventTypeId: eventType.id,
    playerId: input.playerId,
    externalPlayerName: input.externalPlayerName,
    externalPlayerNumber: input.externalPlayerNumber,
    position: input.position,
    recordedByUserId,
    gameMinute: 0,
    gameSecond: 0,
    period: '1',
    periodSecond: 0,
  });

  return this.gameEventsRepository.save(gameEvent);
}

private async ensurePlayerNotInGameRoster(
  gameTeamId: string,
  playerId?: string,
  externalPlayerName?: string,
): Promise<void> {
  const gameRosterType = this.coreService.getEventTypeByName('GAME_ROSTER');

  let existingEvent: GameEvent | null = null;

  if (playerId) {
    existingEvent = await this.gameEventsRepository.findOne({
      where: {
        gameTeamId,
        playerId,
        eventTypeId: gameRosterType.id,
      },
    });
  } else if (externalPlayerName) {
    existingEvent = await this.gameEventsRepository.findOne({
      where: {
        gameTeamId,
        externalPlayerName,
        eventTypeId: gameRosterType.id,
      },
    });
  }

  if (existingEvent) {
    throw new BadRequestException('Player is already in the game roster');
  }
}
```

**Step 3: Add to game-events.service.ts**

```typescript
async addPlayerToGameRoster(
  input: AddToGameRosterInput,
  recordedByUserId: string,
): Promise<GameEvent> {
  return this.lineupService.addPlayerToGameRoster(input, recordedByUserId);
}
```

**Step 4: Add resolver mutation**

Add to `game-events.resolver.ts`:

```typescript
@Mutation(() => GameEvent)
async addPlayerToGameRoster(
  @Args('input') input: AddToGameRosterInput,
  @CurrentUser() user: { userId: string },
): Promise<GameEvent> {
  return this.gameEventsService.addPlayerToGameRoster(input, user.userId);
}
```

**Step 5: Run tests**

Run:
```bash
pnpm nx test soccer-stats-api
```

Expected: All tests pass

**Step 6: Commit**

```bash
git add apps/soccer-stats/api/src/modules/game-events/
git commit -m "feat(soccer-stats-api): add addPlayerToGameRoster mutation"
```

---

## Task 8: Update removeFromLineup to Handle GAME_ROSTER

**Files:**
- Modify: `apps/soccer-stats/api/src/modules/game-events/services/lineup.service.ts`

**Step 1: Update removeFromLineup method**

Update the allowed event types to include GAME_ROSTER:

```typescript
async removeFromLineup(gameEventId: string): Promise<boolean> {
  const gameEvent = await this.gameEventsRepository.findOne({
    where: { id: gameEventId },
    relations: ['eventType'],
  });

  if (!gameEvent) {
    throw new NotFoundException(`GameEvent ${gameEventId} not found`);
  }

  const lineupEventTypes = ['GAME_ROSTER', 'SUBSTITUTION_IN'];  // Updated
  if (!lineupEventTypes.includes(gameEvent.eventType.name)) {
    throw new BadRequestException(
      'Can only remove game roster or substitution events',
    );
  }

  await this.gameEventsRepository.remove(gameEvent);
  return true;
}
```

**Step 2: Run tests**

Run:
```bash
pnpm nx test soccer-stats-api
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add apps/soccer-stats/api/src/modules/game-events/services/lineup.service.ts
git commit -m "feat(soccer-stats-api): update removeFromLineup to handle GAME_ROSTER"
```

---

## Task 9: Remove Old Mutations (addToBench, addToLineup)

**Files:**
- Modify: `apps/soccer-stats/api/src/modules/game-events/game-events.resolver.ts`
- Modify: `apps/soccer-stats/api/src/modules/game-events/game-events.service.ts`
- Delete: `apps/soccer-stats/api/src/modules/game-events/dto/add-to-bench.input.ts`
- Delete: `apps/soccer-stats/api/src/modules/game-events/dto/add-to-lineup.input.ts`

**Step 1: Remove from resolver**

Remove `addToBench` and `addToLineup` mutations from resolver.

**Step 2: Remove from service**

Remove corresponding methods from service.

**Step 3: Delete old input DTOs**

Delete the old input files if they exist.

**Step 4: Run tests and fix any broken tests**

Run:
```bash
pnpm nx test soccer-stats-api
```

Fix any tests that reference old mutations.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(soccer-stats-api): remove deprecated addToBench and addToLineup mutations"
```

---

## Task 10: Run GraphQL Codegen for UI

**Files:**
- Generated: `apps/soccer-stats/ui/src/app/generated/`

**Step 1: Run codegen**

Run:
```bash
pnpm nx graphql-codegen soccer-stats-ui
```

Expected: Generated files updated with new types

**Step 2: Verify new types exist**

Check that `AddToGameRosterInput`, `gameRoster`, and `previousPeriodLineup` are in generated types.

**Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/generated/
git commit -m "chore(soccer-stats-ui): regenerate GraphQL types for game roster"
```

---

## Task 11: Update use-lineup.ts Hook

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/hooks/use-lineup.ts`

**Step 1: Add new mutation and update returns**

Update the hook to:
1. Add `addPlayerToGameRoster` mutation
2. Return `gameRoster` and `previousPeriodLineup`
3. Remove `addToBench` and `addToLineup`

```typescript
// Add new mutation
const [addToGameRosterMutation, { loading: addingToRoster }] = useMutation(
  AddPlayerToGameRosterDocument,
  {
    refetchQueries: [
      { query: GetGameLineupDocument, variables: { gameTeamId } },
    ],
    awaitRefetchQueries: true,
  },
);

// Add action handler
const addPlayerToGameRoster = useCallback(
  async (params: {
    playerId?: string;
    externalPlayerName?: string;
    externalPlayerNumber?: string;
    position?: string;
  }) => {
    return addToGameRosterMutation({
      variables: {
        input: {
          gameTeamId,
          playerId: params.playerId,
          externalPlayerName: params.externalPlayerName,
          externalPlayerNumber: params.externalPlayerNumber,
          position: params.position,
        },
      },
    });
  },
  [gameTeamId, addToGameRosterMutation],
);

// Update return
return {
  gameRoster: lineupData?.gameLineup?.gameRoster ?? [],
  currentOnField: lineupData?.gameLineup?.currentOnField ?? [],
  bench: lineupData?.gameLineup?.bench ?? [],
  previousPeriodLineup: lineupData?.gameLineup?.previousPeriodLineup ?? [],
  // ... other returns
  addPlayerToGameRoster,
  // Remove: addToBench, addToLineup
};
```

**Step 2: Run lint**

Run:
```bash
pnpm nx lint soccer-stats-ui
```

Expected: No errors (may have warnings about unused imports to clean up)

**Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/hooks/use-lineup.ts
git commit -m "feat(soccer-stats-ui): update use-lineup hook for game roster model"
```

---

## Task 12: Update LineupBench Component

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/components/presentation/lineup-bench.presentation.tsx`

**Step 1: Rename prop and update label**

Change `availableRoster` → `teamRoster` and update "Available Roster" → "Team Roster":

```typescript
interface LineupBenchProps {
  bench: LineupPlayer[];
  teamRoster: RosterPlayer[];  // Renamed from availableRoster
  // ... rest unchanged
}

// In JSX:
<h4 className="mb-2 text-sm font-medium text-gray-700">
  Team Roster ({teamRoster.length})  {/* Changed label */}
</h4>
```

**Step 2: Run lint**

Run:
```bash
pnpm nx lint soccer-stats-ui
```

**Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/presentation/lineup-bench.presentation.tsx
git commit -m "refactor(soccer-stats-ui): rename availableRoster to teamRoster in LineupBench"
```

---

## Task 13: Update GameLineupTab Smart Component

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.tsx`

**Step 1: Update to use new mutations**

Replace `addToLineup` + `addToBench` calls with `addPlayerToGameRoster`:

```typescript
// Old: await addToLineup({ playerId, position });
// New:
await addPlayerToGameRoster({ playerId, position });

// Old: await addToBench({ playerId });
// New:
await addPlayerToGameRoster({ playerId }); // No position = bench
```

**Step 2: Update prop passed to LineupBench**

Change `availableRoster` → `teamRoster`.

**Step 3: Run lint and build**

Run:
```bash
pnpm nx lint soccer-stats-ui
pnpm nx build soccer-stats-ui
```

**Step 4: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/game-lineup-tab.smart.tsx
git commit -m "feat(soccer-stats-ui): update GameLineupTab to use addPlayerToGameRoster"
```

---

## Task 14: Final Integration Test

**Step 1: Start the API and database**

Run:
```bash
pnpm nx serve:dev soccer-stats-api
```

**Step 2: Test via GraphQL Playground**

Open `http://localhost:3333/api/graphql` and test:

1. Add player to game roster:
```graphql
mutation {
  addPlayerToGameRoster(input: {
    gameTeamId: "<id>"
    playerId: "<player-id>"
    position: "CM"
  }) {
    id
    eventType { name }
  }
}
```

2. Query game lineup:
```graphql
query {
  gameLineup(gameTeamId: "<id>") {
    gameRoster { playerId position }
    currentOnField { playerId position }
    bench { playerId position }
  }
}
```

**Step 3: Run all tests**

Run:
```bash
pnpm nx test soccer-stats-api
pnpm nx test soccer-stats-ui
```

Expected: All tests pass

**Step 4: Final commit**

```bash
git add -A
git commit -m "test(soccer-stats): verify game roster refactor integration"
```

---

## Summary

After completing all tasks:
- GAME_ROSTER event type replaces BENCH
- Lineup computed from gameRoster - currentOnField (no duplicates)
- New `addPlayerToGameRoster` mutation with optional position
- UI updated with "Team Roster" label
- Old mutations removed

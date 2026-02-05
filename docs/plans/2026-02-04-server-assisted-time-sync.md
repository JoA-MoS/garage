# Server-Assisted Game Time Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add server-authoritative time sync to GraphQL responses so multiple clients tracking the same game stay synchronized.

**Architecture:** Extend `GameTimingService.getPeriodTimingInfo()` to include a `serverTimestamp`, expose three new fields on the `Game` GraphQL type (`currentPeriod`, `currentPeriodSecond`, `serverTimestamp`), and create a frontend hook `useSyncedGameTime()` that adjusts for network latency. The existing `calculatePlayTime()` function remains unchanged—only its input source changes.

**Tech Stack:** NestJS + TypeGraphQL (backend), React hooks (frontend), Vitest (testing)

---

## Task 1: Add serverTimestamp to GameTimingService

**Files:**

- Modify: `apps/soccer-stats/api/src/modules/games/game-timing.service.ts:326-424`
- Test: `apps/soccer-stats/api/src/modules/games/game-timing.service.spec.ts` (create if not exists)

**Step 1: Write the failing test**

Create test file if it doesn't exist:

```typescript
// apps/soccer-stats/api/src/modules/games/game-timing.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GameTimingService } from './game-timing.service';
import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';

describe('GameTimingService', () => {
  let service: GameTimingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameTimingService,
        {
          provide: getRepositoryToken(GameEvent),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getRepositoryToken(EventType),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<GameTimingService>(GameTimingService);
  });

  describe('getPeriodTimingInfo', () => {
    it('should include serverTimestamp in response', async () => {
      const beforeCall = Date.now();
      const result = await service.getPeriodTimingInfo('game-123');
      const afterCall = Date.now();

      expect(result.serverTimestamp).toBeDefined();
      expect(result.serverTimestamp).toBeGreaterThanOrEqual(beforeCall);
      expect(result.serverTimestamp).toBeLessThanOrEqual(afterCall);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test soccer-stats-api --testPathPattern=game-timing.service.spec`
Expected: FAIL with "serverTimestamp" not defined in result

**Step 3: Update the return type and implementation**

Modify `game-timing.service.ts` - update the return type interface and add `serverTimestamp`:

```typescript
// At line ~326, update the return type to include serverTimestamp
async getPeriodTimingInfo(
  gameId: string,
  durationMinutes = 60,
): Promise<{
  period1DurationSeconds: number;
  period2DurationSeconds: number;
  currentPeriod?: string;
  currentPeriodSeconds: number;
  serverTimestamp: number;  // ADD THIS LINE
}> {
  const timing = await this.getGameTiming(gameId);
  const halfDuration = (durationMinutes / 2) * 60;
  const serverTimestamp = Date.now();  // ADD THIS LINE - capture early for accuracy

  // ... existing logic unchanged ...

  // Update ALL return statements to include serverTimestamp
  // Example for "game hasn't started" case (~line 344):
  if (!timing.actualStart) {
    return {
      period1DurationSeconds: 0,
      period2DurationSeconds: 0,
      currentPeriod: undefined,
      currentPeriodSeconds: 0,
      serverTimestamp,  // ADD to each return
    };
  }

  // ... repeat for all other return statements (lines ~354, ~377, ~398, ~410, ~422)
```

**Step 4: Run test to verify it passes**

Run: `pnpm nx test soccer-stats-api --testPathPattern=game-timing.service.spec`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/games/game-timing.service.ts apps/soccer-stats/api/src/modules/games/game-timing.service.spec.ts
git commit -m "feat(soccer-stats-api): add serverTimestamp to getPeriodTimingInfo"
```

---

## Task 2: Add GraphQL fields to Game type

**Files:**

- Modify: `apps/soccer-stats/api/src/modules/games/game-fields.resolver.ts`
- Reference: `apps/soccer-stats/api/src/modules/games/game-timing.service.ts`

**Step 1: Write the failing test**

Add to existing resolver test or create:

```typescript
// apps/soccer-stats/api/src/modules/games/game-fields.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GameFieldsResolver } from './game-fields.resolver';
import { GameTimingService } from './game-timing.service';

describe('GameFieldsResolver', () => {
  let resolver: GameFieldsResolver;
  let timingService: jest.Mocked<GameTimingService>;

  beforeEach(async () => {
    const mockTimingService = {
      getPeriodTimingInfo: jest.fn().mockResolvedValue({
        period1DurationSeconds: 300,
        period2DurationSeconds: 0,
        currentPeriod: '1',
        currentPeriodSeconds: 300,
        serverTimestamp: 1706889600000,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GameFieldsResolver, { provide: GameTimingService, useValue: mockTimingService }],
    }).compile();

    resolver = module.get<GameFieldsResolver>(GameFieldsResolver);
    timingService = module.get(GameTimingService);
  });

  describe('currentPeriod', () => {
    it('should return current period from timing service', async () => {
      const game = { id: 'game-123', gameFormatId: 'format-1' } as any;
      const result = await resolver.currentPeriod(game);

      expect(result).toBe('1');
      expect(timingService.getPeriodTimingInfo).toHaveBeenCalledWith('game-123', undefined);
    });
  });

  describe('currentPeriodSecond', () => {
    it('should return current period seconds from timing service', async () => {
      const game = { id: 'game-123', gameFormatId: 'format-1' } as any;
      const result = await resolver.currentPeriodSecond(game);

      expect(result).toBe(300);
    });
  });

  describe('serverTimestamp', () => {
    it('should return server timestamp from timing service', async () => {
      const game = { id: 'game-123', gameFormatId: 'format-1' } as any;
      const result = await resolver.serverTimestamp(game);

      expect(result).toBe(1706889600000);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test soccer-stats-api --testPathPattern=game-fields.resolver.spec`
Expected: FAIL - methods don't exist

**Step 3: Add the three field resolvers**

Add to `game-fields.resolver.ts` after the existing timing resolvers (after line ~173):

```typescript
// Add import at top of file
import { GameTimingService } from './game-timing.service';

// Add to constructor (resolver needs to inject GameTimingService)
constructor(private readonly gameTimingService: GameTimingService) {}

// Add these three field resolvers after pausedAt resolver:

/**
 * Current game period (e.g., "1", "2").
 * Returns undefined if game not started or at halftime.
 */
@ResolveField('currentPeriod', () => String, {
  nullable: true,
  description: 'Current period of the game (null if not started or at halftime)',
})
async currentPeriod(@Parent() game: Game): Promise<string | undefined> {
  const timingInfo = await this.gameTimingService.getPeriodTimingInfo(
    game.id,
    game.durationMinutes,
  );
  return timingInfo.currentPeriod;
}

/**
 * Seconds elapsed in the current period.
 * Used with serverTimestamp for client-side time sync.
 */
@ResolveField('currentPeriodSecond', () => Number, {
  description: 'Seconds elapsed in the current period',
})
async currentPeriodSecond(@Parent() game: Game): Promise<number> {
  const timingInfo = await this.gameTimingService.getPeriodTimingInfo(
    game.id,
    game.durationMinutes,
  );
  return timingInfo.currentPeriodSeconds;
}

/**
 * Unix timestamp (milliseconds) when this response was generated.
 * Clients use this to calculate elapsed time since the response.
 */
@ResolveField('serverTimestamp', () => Number, {
  description: 'Unix timestamp (ms) when response was generated - for client time sync',
})
async serverTimestamp(@Parent() game: Game): Promise<number> {
  const timingInfo = await this.gameTimingService.getPeriodTimingInfo(
    game.id,
    game.durationMinutes,
  );
  return timingInfo.serverTimestamp;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm nx test soccer-stats-api --testPathPattern=game-fields.resolver.spec`
Expected: PASS

**Step 5: Run GraphQL codegen to update types**

Run: `pnpm nx run soccer-stats-graphql-codegen:codegen`
Expected: New fields appear in generated types

**Step 6: Commit**

```bash
git add apps/soccer-stats/api/src/modules/games/game-fields.resolver.ts apps/soccer-stats/api/src/modules/games/game-fields.resolver.spec.ts
git commit -m "feat(soccer-stats-api): add currentPeriod, currentPeriodSecond, serverTimestamp to Game GraphQL type"
```

---

## Task 3: Update GET_GAME_BY_ID query to include time sync fields

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/services/games-graphql.service.ts:53-76`

**Step 1: Add new fields to query**

Update `GET_GAME_BY_ID` query to include the three new fields:

```typescript
export const GET_GAME_BY_ID = graphql(/* GraphQL */ `
  query GetGameById($id: ID!) {
    game(id: $id) {
      id
      name
      scheduledStart
      status
      actualStart
      firstHalfEnd
      secondHalfStart
      actualEnd
      pausedAt
      statsTrackingLevel
      notes
      venue
      weatherConditions
      currentPeriod        # ADD
      currentPeriodSecond  # ADD
      serverTimestamp      # ADD
      format {
        # ... rest unchanged
```

**Step 2: Run codegen to verify types update**

Run: `pnpm nx run soccer-stats-graphql-codegen:codegen`
Expected: Generated types include the new fields

**Step 3: Verify TypeScript compiles**

Run: `pnpm nx build soccer-stats-ui --skip-nx-cache`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/soccer-stats/ui/src/app/services/games-graphql.service.ts libs/soccer-stats/graphql-codegen/src/generated/
git commit -m "feat(soccer-stats-ui): add time sync fields to GET_GAME_BY_ID query"
```

---

## Task 4: Create useSyncedGameTime hook

**Files:**

- Create: `apps/soccer-stats/ui/src/app/hooks/use-synced-game-time.ts`
- Create: `apps/soccer-stats/ui/src/app/hooks/use-synced-game-time.spec.ts`

**Step 1: Write the failing test**

```typescript
// apps/soccer-stats/ui/src/app/hooks/use-synced-game-time.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useSyncedGameTime } from './use-synced-game-time';

describe('useSyncedGameTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial values when no sync data provided', () => {
    const { result } = renderHook(() => useSyncedGameTime(undefined));

    expect(result.current).toEqual({
      period: '1',
      periodSecond: 0,
    });
  });

  it('calculates current time based on elapsed time since sync', () => {
    const syncData = {
      currentPeriod: '1',
      currentPeriodSecond: 300, // 5 minutes into period
      serverTimestamp: Date.now() - 10000, // 10 seconds ago
    };

    const { result } = renderHook(() => useSyncedGameTime(syncData));

    // Should be ~310 seconds (300 + 10 elapsed)
    expect(result.current.period).toBe('1');
    expect(result.current.periodSecond).toBeGreaterThanOrEqual(309);
    expect(result.current.periodSecond).toBeLessThanOrEqual(311);
  });

  it('updates periodSecond over time', () => {
    const syncData = {
      currentPeriod: '1',
      currentPeriodSecond: 100,
      serverTimestamp: Date.now(),
    };

    const { result } = renderHook(() => useSyncedGameTime(syncData));

    expect(result.current.periodSecond).toBe(100);

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.periodSecond).toBe(105);
  });

  it('handles null currentPeriod (halftime/not started)', () => {
    const syncData = {
      currentPeriod: null,
      currentPeriodSecond: 0,
      serverTimestamp: Date.now(),
    };

    const { result } = renderHook(() => useSyncedGameTime(syncData));

    // Should not tick when no current period
    expect(result.current.period).toBeUndefined();
    expect(result.current.periodSecond).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test soccer-stats-ui --testPathPattern=use-synced-game-time.spec`
Expected: FAIL - module not found

**Step 3: Implement the hook**

```typescript
// apps/soccer-stats/ui/src/app/hooks/use-synced-game-time.ts
import { useState, useEffect, useMemo } from 'react';

interface ServerTimeSync {
  currentPeriod: string | null | undefined;
  currentPeriodSecond: number;
  serverTimestamp: number;
}

interface GameTime {
  period: string | undefined;
  periodSecond: number;
}

/**
 * Hook that synchronizes game time from server timestamp.
 *
 * Calculates the current game time by:
 * 1. Taking the server's reported time (currentPeriod, currentPeriodSecond)
 * 2. Adding the elapsed time since serverTimestamp
 *
 * This allows multiple clients to stay in sync without constant polling.
 *
 * @param syncData - Time sync data from server (null if game not active)
 * @returns Current game time with 1-second update interval
 */
export function useSyncedGameTime(syncData: ServerTimeSync | undefined | null): GameTime {
  // Track elapsed seconds since last sync
  const [elapsedSinceSync, setElapsedSinceSync] = useState(0);

  // Calculate initial elapsed time when sync data changes
  const initialElapsed = useMemo(() => {
    if (!syncData?.serverTimestamp) return 0;
    return Math.floor((Date.now() - syncData.serverTimestamp) / 1000);
  }, [syncData?.serverTimestamp]);

  // Reset elapsed counter when sync data changes
  useEffect(() => {
    setElapsedSinceSync(initialElapsed);
  }, [initialElapsed]);

  // Tick the clock every second (only when game is active)
  useEffect(() => {
    // Don't tick if no sync data or game is paused/halftime
    if (!syncData?.currentPeriod) return;

    const interval = setInterval(() => {
      setElapsedSinceSync((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [syncData?.currentPeriod]);

  // Compute current time
  return useMemo(() => {
    if (!syncData) {
      return { period: '1', periodSecond: 0 };
    }

    // If no current period (halftime, not started, completed), don't tick
    if (!syncData.currentPeriod) {
      return {
        period: undefined,
        periodSecond: syncData.currentPeriodSecond,
      };
    }

    return {
      period: syncData.currentPeriod,
      periodSecond: syncData.currentPeriodSecond + elapsedSinceSync,
    };
  }, [syncData, elapsedSinceSync]);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm nx test soccer-stats-ui --testPathPattern=use-synced-game-time.spec`
Expected: PASS

**Step 5: Export from hooks index**

Add to `apps/soccer-stats/ui/src/app/hooks/index.ts` (create if needed):

```typescript
export { useSyncedGameTime } from './use-synced-game-time';
```

**Step 6: Commit**

```bash
git add apps/soccer-stats/ui/src/app/hooks/use-synced-game-time.ts apps/soccer-stats/ui/src/app/hooks/use-synced-game-time.spec.ts
git commit -m "feat(soccer-stats-ui): add useSyncedGameTime hook for server time sync"
```

---

## Task 5: Integrate useSyncedGameTime in game.page.tsx

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx`

**Step 1: Read current implementation**

Note: The game page currently tracks time with `elapsedSeconds` state and local timer. We'll replace this with the synced hook.

**Step 2: Add the hook import and usage**

At the top of `game.page.tsx`, add import:

```typescript
import { useSyncedGameTime } from '../hooks/use-synced-game-time';
```

**Step 3: Replace local timer with synced time**

Find where `elapsedSeconds` is used and replace with synced time. In the component:

```typescript
// REMOVE these lines (around line 127):
// const [elapsedSeconds, setElapsedSeconds] = useState(0);

// AFTER the useQuery for game data, ADD:
const syncedTime = useSyncedGameTime(
  data?.game
    ? {
        currentPeriod: data.game.currentPeriod,
        currentPeriodSecond: data.game.currentPeriodSecond,
        serverTimestamp: data.game.serverTimestamp,
      }
    : null,
);

// Use syncedTime.period and syncedTime.periodSecond instead of local state
// Pass to child components that need current time
```

**Step 4: Update components receiving time**

Pass the synced time to components like `SubstitutionPanel`:

```typescript
<SubstitutionPanel
  // ... other props
  period={syncedTime.period ?? '1'}
  periodSecond={syncedTime.periodSecond}
  // ...
/>
```

**Step 5: Remove old timer useEffect**

Find and remove the `useEffect` that was incrementing `elapsedSeconds` locally.

**Step 6: Verify app compiles and runs**

Run: `pnpm nx serve soccer-stats-ui`
Expected: App loads without errors, time syncs from server

**Step 7: Commit**

```bash
git add apps/soccer-stats/ui/src/app/pages/game.page.tsx
git commit -m "feat(soccer-stats-ui): integrate server time sync in game page"
```

---

## Task 6: Update play time calculation to use synced time

**Files:**

- Modify: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.smart.tsx`

**Step 1: Verify current usage**

The substitution panel already receives `period` and `periodSecond` as props and passes them to `calculatePlayTime`. No changes needed to `calculatePlayTime` itself—it already accepts the time interface.

**Step 2: Verify the props flow correctly**

Trace the data flow:

1. `game.page.tsx` gets synced time from `useSyncedGameTime`
2. Passes to `SubstitutionPanel` as `period` and `periodSecond` props
3. `SubstitutionPanel` passes to `calculatePlayTime`

This should already work with Task 5's changes.

**Step 3: Add integration test**

```typescript
// In substitution-panel.smart.spec.tsx, add:
it('calculates play time using provided period and periodSecond', () => {
  // Test that the component correctly uses props for time
  // rather than its own state
});
```

**Step 4: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/substitution-panel/
git commit -m "test(soccer-stats-ui): verify substitution panel uses synced time"
```

---

## Task 7: End-to-end verification

**Files:**

- None (manual testing)

**Step 1: Start the full stack**

```bash
pnpm nx serve:dev soccer-stats-api  # Start DB + API
pnpm nx serve soccer-stats-ui       # Start UI (auto-runs codegen)
```

**Step 2: Test time sync**

1. Open a game in two browser tabs
2. Start the game in one tab
3. Verify both tabs show the same time
4. Make a substitution in one tab
5. Verify the play time calculation is consistent in both

**Step 3: Test reconnection**

1. Open a game in progress
2. Disconnect network (browser dev tools)
3. Reconnect after 30 seconds
4. Verify time catches up correctly on reconnect

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(soccer-stats): complete server-assisted time sync implementation"
```

---

## Summary of Changes

| Component                                 | Change                                                            |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `GameTimingService.getPeriodTimingInfo()` | Returns `serverTimestamp`                                         |
| `GameFieldsResolver`                      | Exposes `currentPeriod`, `currentPeriodSecond`, `serverTimestamp` |
| `GET_GAME_BY_ID` query                    | Requests the three new fields                                     |
| `useSyncedGameTime` hook                  | Calculates client time from server timestamp                      |
| `game.page.tsx`                           | Uses synced time instead of local timer                           |
| `calculatePlayTime()`                     | **No changes** - interface already correct                        |

## Notes

- The `serverTimestamp` is captured at the moment the GraphQL response is generated, not when the request was received
- Network latency is not compensated for in this implementation (typically <100ms, acceptable for this use case)
- The hook ticks locally to avoid constant network requests while still staying roughly in sync
- When the game is paused or at halftime, the clock does not tick

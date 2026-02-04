# Soccer Stats API Performance Optimization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address performance concerns and production-readiness issues in the soccer-stats API, specifically database connection pooling and DataLoader query optimization.

**Architecture:** Configure TypeORM connection pooling for production workloads, optimize DataLoader relation loading to reduce memory pressure during game tracking, and add optional production-ready PubSub infrastructure.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, GraphQL, DataLoader, graphql-subscriptions

---

## Background

Analysis identified three concerns:

1. **Database Connection Pool** - No explicit pool configuration in TypeORM
2. **Heavy DataLoader Relations** - Deep relation chains load large object graphs
3. **In-memory PubSub** - Single-server limitation (not a memory leak, but scalability concern)

**Note:** GraphQL subscription cleanup was validated as safe - graphql-ws properly calls `.return()` on all async iterators when connections close.

---

## Task 1: Configure Database Connection Pool

**Files:**

- Modify: `apps/soccer-stats/api/src/database/typeorm.config.ts`
- Modify: `apps/soccer-stats/api/src/app/environment.ts`
- Create: `apps/soccer-stats/api/src/database/typeorm.config.spec.ts`

**Step 1: Add environment variables for pool configuration**

In `apps/soccer-stats/api/src/app/environment.ts`, add pool configuration getters:

```typescript
/**
 * Database connection pool configuration.
 * Defaults are conservative for development, override in production.
 */
export function getDbPoolMax(): number {
  return parseInt(process.env['DB_POOL_MAX'] || '10', 10);
}

export function getDbPoolMin(): number {
  return parseInt(process.env['DB_POOL_MIN'] || '2', 10);
}

export function getDbPoolIdleTimeout(): number {
  return parseInt(process.env['DB_POOL_IDLE_TIMEOUT'] || '30000', 10);
}

export function getDbPoolConnectionTimeout(): number {
  return parseInt(process.env['DB_POOL_CONNECTION_TIMEOUT'] || '5000', 10);
}
```

**Step 2: Update TypeORM config with pool settings**

In `apps/soccer-stats/api/src/database/typeorm.config.ts`, add pool configuration:

```typescript
import { getDbHost, getDbPort, getDbUsername, getDbPassword, getDbName, getDbSynchronize, getDbLogging, getDbSsl, getDbPoolMax, getDbPoolMin, getDbPoolIdleTimeout, getDbPoolConnectionTimeout } from '../app/environment';

// ... existing code ...

export const baseTypeOrmConfig = {
  type: 'postgres' as const,
  host: getDbHost(),
  port: getDbPort(),
  username: getDbUsername(),
  password: getDbPassword(),
  database: getDbName(),
  synchronize: getDbSynchronize(),
  logging: getDbLogging(),
  ssl: getDbSsl() ? { rejectUnauthorized: false } : false,
  migrationsTableName: MIGRATIONS_TABLE_NAME,
  // Connection pool configuration
  extra: {
    max: getDbPoolMax(),
    min: getDbPoolMin(),
    idleTimeoutMillis: getDbPoolIdleTimeout(),
    connectionTimeoutMillis: getDbPoolConnectionTimeout(),
  },
};
```

**Step 3: Write unit test for pool configuration**

Create `apps/soccer-stats/api/src/database/typeorm.config.spec.ts`:

```typescript
import { baseTypeOrmConfig } from './typeorm.config';

describe('TypeORM Configuration', () => {
  describe('connection pool settings', () => {
    it('should have extra property with pool configuration', () => {
      expect(baseTypeOrmConfig.extra).toBeDefined();
    });

    it('should have max pool size configured', () => {
      expect(baseTypeOrmConfig.extra.max).toBeGreaterThan(0);
    });

    it('should have min pool size configured', () => {
      expect(baseTypeOrmConfig.extra.min).toBeGreaterThanOrEqual(0);
    });

    it('should have idle timeout configured', () => {
      expect(baseTypeOrmConfig.extra.idleTimeoutMillis).toBeGreaterThan(0);
    });

    it('should have connection timeout configured', () => {
      expect(baseTypeOrmConfig.extra.connectionTimeoutMillis).toBeGreaterThan(0);
    });

    it('should have min <= max', () => {
      expect(baseTypeOrmConfig.extra.min).toBeLessThanOrEqual(baseTypeOrmConfig.extra.max);
    });
  });
});
```

**Step 4: Run tests to verify**

```bash
pnpm nx test soccer-stats-api --testPathPattern=typeorm.config.spec
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/database/typeorm.config.ts \
        apps/soccer-stats/api/src/database/typeorm.config.spec.ts \
        apps/soccer-stats/api/src/app/environment.ts
git commit -m "feat(soccer-stats-api): add database connection pool configuration

- Add environment variables for pool size (min/max), idle timeout, connection timeout
- Configure TypeORM extra.pool settings for PostgreSQL
- Add unit tests for pool configuration
- Defaults: max=10, min=2, idle=30s, connect=5s"
```

---

## Task 2: Optimize DataLoader - Remove Eager Child Relations

**Files:**

- Modify: `apps/soccer-stats/api/src/modules/dataloaders/dataloaders.service.ts`
- Create: `apps/soccer-stats/api/src/modules/dataloaders/dataloaders.service.spec.ts`

**Step 1: Analyze current relation loading**

Current `gameEventsByGameLoader` and `gameEventsByGameTeamLoader` load:

```typescript
relations: [
  'eventType',
  'player',
  'gameTeam',
  'childEvents',           // ← Heavy: loads all child events
  'childEvents.eventType', // ← Heavy: nested relation
  'childEvents.player',    // ← Heavy: nested relation
],
```

**Step 2: Remove nested childEvents relations from batch loaders**

In `apps/soccer-stats/api/src/modules/dataloaders/dataloaders.service.ts`, update `createGameEventsByGameLoader`:

```typescript
private createGameEventsByGameLoader(): DataLoader<string, GameEvent[]> {
  return this.createLoader<string, GameEvent[]>(
    'gameEventsByGameLoader',
    async (gameIds) => {
      const gameEvents = await this.gameEventRepository.find({
        where: { gameId: In([...gameIds]) },
        relations: [
          'eventType',
          'player',
          'gameTeam',
          // Removed: childEvents and nested relations
          // Use childEventsByParentIdLoader for on-demand loading
        ],
        order: { period: 'ASC', periodSecond: 'ASC', createdAt: 'ASC' },
      });

      const eventsMap = new Map<string, GameEvent[]>();
      for (const event of gameEvents) {
        const existing = eventsMap.get(event.gameId) || [];
        existing.push(event);
        eventsMap.set(event.gameId, existing);
      }

      return gameIds.map((id) => eventsMap.get(id) || []);
    },
  );
}
```

**Step 3: Update createGameEventsByGameTeamLoader similarly**

```typescript
private createGameEventsByGameTeamLoader(): DataLoader<string, GameEvent[]> {
  return this.createLoader<string, GameEvent[]>(
    'gameEventsByGameTeamLoader',
    async (gameTeamIds) => {
      const gameEvents = await this.gameEventRepository.find({
        where: { gameTeamId: In([...gameTeamIds]) },
        relations: [
          'eventType',
          'player',
          'gameTeam',
          // Removed: childEvents and nested relations
          // Use childEventsByParentIdLoader for on-demand loading
        ],
        order: { period: 'ASC', periodSecond: 'ASC', createdAt: 'ASC' },
      });

      const eventsMap = new Map<string, GameEvent[]>();
      for (const event of gameEvents) {
        if (event.gameTeamId) {
          const existing = eventsMap.get(event.gameTeamId) || [];
          existing.push(event);
          eventsMap.set(event.gameTeamId, existing);
        }
      }

      return gameTeamIds.map((id) => eventsMap.get(id) || []);
    },
  );
}
```

**Step 4: Update childEventsByParentIdLoader to include relations**

Since childEvents are now loaded on-demand, ensure the loader includes needed relations:

```typescript
private createChildEventsByParentIdLoader(): DataLoader<string, GameEvent[]> {
  return this.createLoader<string, GameEvent[]>(
    'childEventsByParentIdLoader',
    async (parentIds) => {
      const events = await this.gameEventRepository.find({
        where: { parentEventId: In([...parentIds]) },
        relations: ['eventType', 'player'], // Add relations for child events
        order: { period: 'ASC', periodSecond: 'ASC', createdAt: 'ASC' },
      });

      const eventsMap = new Map<string, GameEvent[]>();
      for (const event of events) {
        if (event.parentEventId) {
          const existing = eventsMap.get(event.parentEventId) || [];
          existing.push(event);
          eventsMap.set(event.parentEventId, existing);
        }
      }

      return parentIds.map((id) => eventsMap.get(id) || []);
    },
  );
}
```

**Step 5: Verify field resolver uses DataLoader for childEvents**

Check that `GameEvent.childEvents` field resolver exists and uses the DataLoader. If not present, this needs to be added in a game-events fields resolver.

Search for existing resolver:

```bash
grep -r "childEvents" apps/soccer-stats/api/src/modules --include="*.resolver.ts"
```

**Step 6: Run existing tests to verify no regressions**

```bash
pnpm nx test soccer-stats-api
```

Expected: All tests PASS

**Step 7: Run E2E tests if available**

```bash
pnpm nx e2e soccer-stats-api-e2e
```

**Step 8: Commit**

```bash
git add apps/soccer-stats/api/src/modules/dataloaders/dataloaders.service.ts
git commit -m "perf(soccer-stats-api): optimize DataLoader relation loading

- Remove eager childEvents loading from gameEventsByGameLoader
- Remove eager childEvents loading from gameEventsByGameTeamLoader
- Add eventType and player relations to childEventsByParentIdLoader
- Child events now loaded on-demand via field resolver

This reduces memory pressure during game tracking by avoiding
loading the entire event tree in batch queries."
```

---

## Task 3: Add Field Resolver for childEvents (if missing)

**Prerequisite:** Only needed if Step 5 of Task 2 shows no existing resolver.

**Files:**

- Create or Modify: `apps/soccer-stats/api/src/modules/game-events/game-event-fields.resolver.ts`
- Modify: `apps/soccer-stats/api/src/modules/game-events/game-events.module.ts`

**Step 1: Check if field resolver file exists**

```bash
ls apps/soccer-stats/api/src/modules/game-events/*fields*.ts 2>/dev/null || echo "No fields resolver"
```

**Step 2: Create field resolver if needed**

Create `apps/soccer-stats/api/src/modules/game-events/game-event-fields.resolver.ts`:

```typescript
import { Parent, ResolveField, Resolver, Context } from '@nestjs/graphql';
import { GameEvent } from '../../entities/game-event.entity';
import { GraphQLContext } from '../dataloaders/graphql-context';

@Resolver(() => GameEvent)
export class GameEventFieldsResolver {
  /**
   * Resolve childEvents using DataLoader for batched loading.
   * Only loads when field is actually queried.
   */
  @ResolveField(() => [GameEvent])
  async childEvents(@Parent() gameEvent: GameEvent, @Context() ctx: GraphQLContext): Promise<GameEvent[]> {
    // If already loaded (e.g., via eager loading), return directly
    if (gameEvent.childEvents) {
      return gameEvent.childEvents;
    }
    // Use DataLoader for batched on-demand loading
    return ctx.loaders.childEventsByParentIdLoader.load(gameEvent.id);
  }
}
```

**Step 3: Register resolver in module**

In `apps/soccer-stats/api/src/modules/game-events/game-events.module.ts`, add the resolver:

```typescript
import { GameEventFieldsResolver } from './game-event-fields.resolver';

@Module({
  // ...
  providers: [
    GameEventsService,
    GameEventsResolver,
    GameEventFieldsResolver, // Add this
    // ... other providers
  ],
})
export class GameEventsModule {}
```

**Step 4: Run tests**

```bash
pnpm nx test soccer-stats-api
```

**Step 5: Commit**

```bash
git add apps/soccer-stats/api/src/modules/game-events/game-event-fields.resolver.ts \
        apps/soccer-stats/api/src/modules/game-events/game-events.module.ts
git commit -m "feat(soccer-stats-api): add field resolver for childEvents

- Create GameEventFieldsResolver for on-demand child event loading
- Use childEventsByParentIdLoader DataLoader for batching
- Supports the DataLoader optimization from previous commit"
```

---

## Task 4: Document Production PubSub Options for Multi-Server Scaling

**Files:**

- Create: `apps/soccer-stats/api/docs/SUBSCRIPTIONS.md`

**Step 1: Document the current limitation and multi-server options**

Create `apps/soccer-stats/api/docs/SUBSCRIPTIONS.md`:

````markdown
# GraphQL Subscriptions Architecture

## Current Implementation

The soccer-stats API uses `graphql-subscriptions` with an in-memory PubSub for real-time game updates.

### How It Works

1. Mutations publish events via `pubSub.publish('eventName', payload)`
2. Subscriptions listen via `pubSub.asyncIterableIterator('eventName')`
3. graphql-ws handles WebSocket transport and cleanup

### Cleanup Behavior

**Validated Safe:** When WebSocket connections close (gracefully or ungracefully), graphql-ws calls `.return()` on all async iterators, which triggers `pubSub.unsubscribe()`. No memory leaks occur from disconnects.

## Multi-Server Scaling

### The Problem

The in-memory PubSub only works within a single Node.js process. If you deploy multiple API instances behind a load balancer:

- User A connects to Server 1
- User B connects to Server 2
- Mutation on Server 1 publishes event
- **Problem:** User B on Server 2 doesn't receive the event

### Solution Options

| Option                          | Cost                  | Latency  | Complexity | Best For                 |
| ------------------------------- | --------------------- | -------- | ---------- | ------------------------ |
| **PostgreSQL LISTEN/NOTIFY**    | $0 (uses existing DB) | ~10-50ms | Low        | Small-medium scale       |
| **Upstash Redis**               | $0-10/month           | ~5-10ms  | Low        | Serverless deployments   |
| **Redis (ElastiCache/Railway)** | $15-50/month          | <5ms     | Medium     | High-volume, low-latency |

---

## Option 1: PostgreSQL LISTEN/NOTIFY (Recommended)

PostgreSQL has built-in pub/sub via LISTEN/NOTIFY. Since we already use PostgreSQL, this requires **no additional infrastructure**.

### Installation

```bash
pnpm add graphql-postgres-subscriptions pg
```
````

### Implementation

```typescript
// apps/soccer-stats/api/src/modules/pubsub/pubsub.module.ts
import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { PostgresPubSub } from 'graphql-postgres-subscriptions';
import { Client } from 'pg';

@Global()
@Module({
  providers: [
    {
      provide: 'PUB_SUB',
      useFactory: async () => {
        // Dedicated connection for LISTEN/NOTIFY (separate from TypeORM pool)
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
          // Or individual params:
          // host: process.env.DB_HOST,
          // port: parseInt(process.env.DB_PORT || '5432'),
          // user: process.env.DB_USERNAME,
          // password: process.env.DB_PASSWORD,
          // database: process.env.DB_NAME,
        });

        await client.connect();

        return new PostgresPubSub({ client });
      },
    },
  ],
  exports: ['PUB_SUB'],
})
export class PubSubModule implements OnModuleDestroy {
  constructor(@Inject('PUB_SUB') private pubSub: PostgresPubSub) {}

  async onModuleDestroy() {
    await this.pubSub.close();
  }
}
```

### How It Works

```
┌─────────────┐                      ┌─────────────┐
│   Task 1    │                      │   Task 2    │
│  (publish)  │                      │ (subscribe) │
└──────┬──────┘                      └──────┬──────┘
       │ NOTIFY game_updated                │ LISTEN game_updated
       │                                    │
       ▼                                    ▼
┌─────────────────────────────────────────────────┐
│                  PostgreSQL                      │
│         (shared by all server instances)         │
└─────────────────────────────────────────────────┘
```

### Usage (No Changes to Resolvers)

The API is identical to in-memory PubSub:

```typescript
// Publishing
this.pubSub.publish('GAME_UPDATED', { gameUpdated: game });

// Subscribing
this.pubSub.asyncIterator('GAME_UPDATED');
```

### Considerations

- **Connection:** Uses a dedicated pg connection (not from TypeORM pool)
- **Latency:** ~10-50ms (acceptable for game updates)
- **Scale:** Handles hundreds of messages/second easily
- **Neon Compatible:** Works with Neon's connection pooling

---

## Option 2: Redis PubSub (For High-Volume Needs)

If PostgreSQL becomes a bottleneck, migrate to Redis:

### Upstash (Serverless - Recommended for Cloud)

```bash
pnpm add graphql-redis-subscriptions @upstash/redis
```

```typescript
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const options = {
  host: process.env.UPSTASH_REDIS_HOST,
  port: parseInt(process.env.UPSTASH_REDIS_PORT || '6379'),
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {}, // Required for Upstash
};

@Global()
@Module({
  providers: [
    {
      provide: 'PUB_SUB',
      useValue: new RedisPubSub({
        publisher: new Redis(options),
        subscriber: new Redis(options),
      }),
    },
  ],
  exports: ['PUB_SUB'],
})
export class PubSubModule {}
```

### Self-Hosted/ElastiCache Redis

```typescript
const options = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

// Same RedisPubSub setup as above
```

---

## When to Use Each Option

| Scenario                             | Recommendation             |
| ------------------------------------ | -------------------------- |
| Single ECS task                      | In-memory PubSub (current) |
| 2-4 ECS tasks, <100 concurrent users | PostgreSQL LISTEN/NOTIFY   |
| 4+ ECS tasks, >100 concurrent users  | Upstash Redis              |
| High-frequency updates (1000+/sec)   | Self-hosted Redis          |

## Migration Path

1. **Now:** In-memory PubSub (sufficient for single task)
2. **When scaling to 2+ tasks:** Swap to PostgreSQL LISTEN/NOTIFY
3. **If latency becomes an issue:** Migrate to Upstash Redis

The migration is a drop-in replacement - no resolver changes needed.

````

**Step 2: Commit**

```bash
git add apps/soccer-stats/api/docs/SUBSCRIPTIONS.md
git commit -m "docs(soccer-stats-api): document multi-server subscription options

- Explain current in-memory PubSub and single-server limitation
- Add PostgreSQL LISTEN/NOTIFY as primary multi-server solution (no extra infra)
- Document Redis options (Upstash, ElastiCache) for high-volume scenarios
- Include decision matrix for when to use each option"
````

---

## Task 5: Add Environment Variable Documentation

**Files:**

- Modify: `apps/soccer-stats/api/.env.example` (create if doesn't exist)

**Step 1: Document new environment variables**

Create or update `apps/soccer-stats/api/.env.example`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=soccer_stats
DB_SYNCHRONIZE=false
DB_LOGGING=false
DB_SSL=false

# Database Connection Pool (production tuning)
# Max connections in pool (default: 10)
DB_POOL_MAX=10
# Min connections in pool (default: 2)
DB_POOL_MIN=2
# Close idle connections after this many ms (default: 30000)
DB_POOL_IDLE_TIMEOUT=30000
# Timeout for acquiring connection from pool in ms (default: 5000)
DB_POOL_CONNECTION_TIMEOUT=5000

# Production pool recommendations:
# - Small workload: max=10, min=2
# - Medium workload: max=25, min=5
# - High workload: max=50, min=10
# - Rule of thumb: max = (core_count * 2) + effective_spindle_count
```

**Step 2: Commit**

```bash
git add apps/soccer-stats/api/.env.example
git commit -m "docs(soccer-stats-api): add .env.example with connection pool settings

- Document all database environment variables
- Include connection pool configuration with production recommendations"
```

---

## Summary

| Task | Description                          | Risk Addressed                                              |
| ---- | ------------------------------------ | ----------------------------------------------------------- |
| 1    | Configure database connection pool   | Medium - Pool exhaustion                                    |
| 2    | Optimize DataLoader relations        | Medium - Memory pressure                                    |
| 3    | Add childEvents field resolver       | Supports Task 2                                             |
| 4    | Document multi-server PubSub options | Medium - Scalability (PostgreSQL LISTEN/NOTIFY recommended) |
| 5    | Document environment variables       | Developer experience                                        |

## Testing Checklist

After all tasks:

- [ ] `pnpm nx test soccer-stats-api` - Unit tests pass
- [ ] `pnpm nx lint soccer-stats-api` - No lint errors
- [ ] `pnpm nx build soccer-stats-api` - Builds successfully
- [ ] Manual test: Start API, create game, track events, verify subscriptions work
- [ ] Manual test: Query gameEvents and verify childEvents load correctly

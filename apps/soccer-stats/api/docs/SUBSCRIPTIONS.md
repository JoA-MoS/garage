# GraphQL Subscriptions Architecture

## Current Implementation

The soccer-stats API uses `graphql-subscriptions` with an in-memory PubSub for real-time game updates.

### How It Works

1. Mutations publish events via `pubSub.publish('eventName', payload)`
2. Subscriptions listen via `pubSub.asyncIterableIterator('eventName')`
3. graphql-ws handles WebSocket transport and cleanup

### Cleanup Behavior

**Validated Safe:** When WebSocket connections close (gracefully or ungracefully), graphql-ws calls `.return()` on all async iterators, which triggers `pubSub.unsubscribe()`. No memory leaks occur from disconnects.

## Production Considerations

### Single-Server Limitation

The in-memory PubSub only works within a single Node.js process. If you deploy multiple API instances behind a load balancer:

- User A connects to Server 1
- User B connects to Server 2
- Mutation on Server 1 publishes event
- **Problem:** User B on Server 2 doesn't receive the event

### Recommended: Redis-Backed PubSub

For multi-instance deployments, use `graphql-redis-subscriptions`:

```bash
pnpm add graphql-redis-subscriptions ioredis
```

```typescript
// pubsub.module.ts
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

const options = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
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

### When to Migrate

- **Single instance:** Current in-memory PubSub is fine
- **Multiple instances:** Migrate to Redis PubSub
- **Kubernetes/ECS:** Migrate to Redis PubSub

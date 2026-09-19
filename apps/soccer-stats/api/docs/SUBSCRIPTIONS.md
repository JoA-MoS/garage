# GraphQL Subscriptions Architecture

## Current Implementation

The soccer-stats API uses `graphql-subscriptions` for real-time game updates,
backed by Postgres LISTEN/NOTIFY via `PostgresPubSub`
(`src/modules/pubsub/postgres-pubsub.ts`) instead of a purely in-memory
`PubSub`. This is what allows the ECS service to run more than one task.

### How It Works

1. Mutations publish events via `pubSub.publish('eventName', payload)`.
2. `PostgresPubSub.publish()` doesn't deliver the event locally itself - it
   sends a Postgres `NOTIFY` on a shared channel (`graphql_pubsub_events`)
   with `{ triggerName, payload }` as the JSON body.
3. Every task (including the one that published) is `LISTEN`-ing on that
   channel via [`pg-listen`](https://github.com/andywer/pg-listen). When the
   `NOTIFY` round-trips back, each task's instance calls the underlying
   in-memory `PubSub.publish()` to fan out to its own local subscribers.
4. Subscriptions listen via `pubSub.asyncIterableIterator('eventName')`, same
   as before - this part didn't change.
5. graphql-ws handles WebSocket transport and cleanup.

This means an event published on Task A is delivered to a client subscribed
via Task B, which is the property that was missing before.

### Cleanup Behavior

**Validated Safe:** When WebSocket connections close (gracefully or ungracefully), graphql-ws calls `.return()` on all async iterators, which triggers `pubSub.unsubscribe()`. No memory leaks occur from disconnects.

`PostgresPubSub` also implements `OnModuleDestroy`, which closes its
underlying `pg-listen` connection when the Nest app shuts down.

### Connection Details

- `pg-listen` opens its own dedicated connection to Postgres - it does not
  share TypeORM's connection pool (a pooled connection can't reliably
  receive `NOTIFY`s; see the
  [node-postgres docs](https://node-postgres.com/features/pubsub)).
- Connection config mirrors `database/typeorm.config.ts`: `DATABASE_URL` when
  set (ECS/Aurora), otherwise the individual `DB_*` vars (local Docker). No
  new environment variables are required.
- `pg-listen` reconnects automatically on connection loss.
- `NOTIFY` payloads are capped at 8000 bytes by Postgres. Game event payloads
  are small, so this hasn't been a constraint - keep it in mind before
  publishing large objects.

### Testing

`postgres-pubsub.spec.ts` and `pubsub.module.spec.ts` fake the `pg-listen`
`Subscriber` (see `PG_LISTEN_SUBSCRIBER` in `pubsub.module.ts`) so these
tests don't need a live database - CI's `test` target has no Postgres
service. The fake models real NOTIFY semantics (a channel only receives a
message if something is `LISTEN`-ing on it), so the relay logic itself is
still exercised for real, not mocked away.

## If This Ever Isn't Enough

Postgres LISTEN/NOTIFY is fine at soccer-stats' current scale (a handful of
ECS tasks, a few concurrent games). If it ever becomes a bottleneck - very
high task counts or very high event volume - the drop-in replacement is a
Redis-backed `PubSubEngine` (e.g. `graphql-redis-subscriptions` +
`ioredis`, pointed at ElastiCache or Upstash). It slots into the same
`PUB_SUB` provider in `pubsub.module.ts`; no resolver changes needed.

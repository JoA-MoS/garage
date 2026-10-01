import { Global, Module } from '@nestjs/common';
import createSubscriber from 'pg-listen';

import {
  getDatabaseUrl,
  getDbHost,
  getDbName,
  getDbPassword,
  getDbPort,
  getDbSsl,
  getDbUsername,
} from '../../app/environment';

import {
  PostgresPubSub,
  type PgListenSubscriberFactory,
  type PubSubChannelEvents,
} from './postgres-pubsub';

export const PG_LISTEN_SUBSCRIBER_FACTORY = 'PG_LISTEN_SUBSCRIBER_FACTORY';

/**
 * Mirrors the connection selection in `database/typeorm.config.ts`: prefer
 * DATABASE_URL (App Runner/ECS/RDS), falling back to individual vars for
 * local Docker. Kept separate from pg-listen's own reconnect logic - pg-listen
 * opens its own dedicated client, it does not share TypeORM's pool.
 */
function buildPgListenConnectionConfig() {
  const databaseUrl = getDatabaseUrl();
  if (databaseUrl) {
    return { connectionString: databaseUrl };
  }

  return {
    host: getDbHost(),
    port: getDbPort(),
    user: getDbUsername(),
    password: getDbPassword(),
    database: getDbName(),
    ssl: getDbSsl() ? { rejectUnauthorized: false } : false,
  };
}

/**
 * Shared PubSub module for GraphQL subscriptions.
 *
 * This module provides a SINGLE PubSub instance across the entire application.
 * All modules that need to publish or subscribe to events should inject 'PUB_SUB'
 * instead of creating their own instance.
 *
 * Why this matters:
 * - GraphQL subscriptions work by publishing events to a PubSub instance
 * - Subscribers listen on the same instance to receive events
 * - If modules create separate PubSub instances, events published to one
 *   instance won't reach subscribers on another instance
 * - This breaks cross-client updates (e.g., multiple browser tabs)
 *
 * The PubSub instance is backed by Postgres LISTEN/NOTIFY (see
 * `postgres-pubsub.ts` and `docs/SUBSCRIPTIONS.md`), so this also holds
 * across multiple ECS tasks, not just within one process. The LISTEN
 * connection is opened lazily and released when idle so Aurora can pause.
 */
@Global() // Makes PUB_SUB available to all modules without explicit imports
@Module({
  providers: [
    {
      provide: PG_LISTEN_SUBSCRIBER_FACTORY,
      useValue: (() =>
        createSubscriber<PubSubChannelEvents>(
          buildPgListenConnectionConfig(),
        )) satisfies PgListenSubscriberFactory,
    },
    {
      provide: 'PUB_SUB',
      inject: [PG_LISTEN_SUBSCRIBER_FACTORY],
      useFactory: (createListenSubscriber: PgListenSubscriberFactory) =>
        new PostgresPubSub(createListenSubscriber),
    },
  ],
  exports: ['PUB_SUB'],
})
export class PubSubModule {}

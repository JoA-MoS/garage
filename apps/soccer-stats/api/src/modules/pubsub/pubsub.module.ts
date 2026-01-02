import { Global, Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

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
 */
@Global() // Makes PUB_SUB available to all modules without explicit imports
@Module({
  providers: [
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: ['PUB_SUB'],
})
export class PubSubModule {}

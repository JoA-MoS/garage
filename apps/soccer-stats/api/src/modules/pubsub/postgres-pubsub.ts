import { OnModuleDestroy } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import type { Subscriber } from 'pg-listen';

export const PUBSUB_NOTIFY_CHANNEL = 'graphql_pubsub_events';

export interface PubSubRelayMessage {
  triggerName: string;
  payload: unknown;
}

type PubSubChannelEvents = Record<
  typeof PUBSUB_NOTIFY_CHANNEL,
  PubSubRelayMessage
>;

/**
 * A `graphql-subscriptions` PubSub that fans out across processes using
 * Postgres LISTEN/NOTIFY instead of only in-memory delivery.
 *
 * `publish()` never delivers locally by itself - it only NOTIFYs. Every
 * instance (including the publisher's own) receives the event through the
 * `notifications` round trip, so all ECS tasks stay consistent with each
 * other and there is no double-delivery on the publishing task.
 */
export class PostgresPubSub extends PubSub implements OnModuleDestroy {
  private connectPromise: Promise<void> | undefined;

  constructor(private readonly subscriber: Subscriber<PubSubChannelEvents>) {
    super();
    this.subscriber.notifications.on(PUBSUB_NOTIFY_CHANNEL, (message) => {
      void super.publish(message.triggerName, message.payload);
    });
  }

  async connect(): Promise<void> {
    if (!this.connectPromise) {
      this.connectPromise = this.subscriber
        .connect()
        .then(() => this.subscriber.listenTo(PUBSUB_NOTIFY_CHANNEL))
        .then(() => undefined)
        .catch((error) => {
          this.connectPromise = undefined;
          throw error;
        });
    }
    await this.connectPromise;
  }

  override async publish(triggerName: string, payload: unknown): Promise<void> {
    await this.connect();
    await this.subscriber.notify(PUBSUB_NOTIFY_CHANNEL, {
      triggerName,
      payload,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber.close();
  }
}

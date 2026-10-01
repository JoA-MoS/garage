import { Logger, OnModuleDestroy } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import type { Subscriber } from 'pg-listen';

export const PUBSUB_NOTIFY_CHANNEL = 'graphql_pubsub_events';

/** How long the LISTEN connection stays open after it was last needed. */
export const DEFAULT_IDLE_RELEASE_MS = 60_000;

export interface PubSubRelayMessage {
  triggerName: string;
  payload: unknown;
}

export type PubSubChannelEvents = Record<
  typeof PUBSUB_NOTIFY_CHANNEL,
  PubSubRelayMessage
>;

export type PgListenSubscriberFactory = () => Subscriber<PubSubChannelEvents>;

export interface PostgresPubSubOptions {
  idleReleaseMs?: number;
}

interface ListenSession {
  subscriber: Subscriber<PubSubChannelEvents>;
  ready: Promise<void>;
}

/**
 * A `graphql-subscriptions` PubSub that fans out across processes using
 * Postgres LISTEN/NOTIFY instead of only in-memory delivery.
 *
 * `publish()` never delivers locally by itself - it only NOTIFYs. Every
 * instance (including the publisher's own) receives the event through the
 * `notifications` round trip, so all ECS tasks stay consistent with each
 * other and there is no double-delivery on the publishing task.
 *
 * The LISTEN connection is opened on demand and released once there have
 * been no local subscriptions for `idleReleaseMs`. Aurora Serverless v2 can
 * only auto-pause with zero open connections, so a permanently held LISTEN
 * connection would keep the database billing around the clock. pg-listen
 * subscribers can't reconnect after `close()`, hence the factory.
 */
export class PostgresPubSub extends PubSub implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresPubSub.name);
  private readonly idleReleaseMs: number;
  private readonly activeSubscriptionIds = new Set<number>();
  private session: ListenSession | undefined;
  private releaseTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly createSubscriber: PgListenSubscriberFactory,
    options: PostgresPubSubOptions = {},
  ) {
    super();
    this.idleReleaseMs = options.idleReleaseMs ?? DEFAULT_IDLE_RELEASE_MS;
  }

  async connect(): Promise<void> {
    this.cancelRelease();
    if (!this.session) {
      this.session = this.openSession();
    }
    const session = this.session;
    try {
      await session.ready;
    } catch (error) {
      if (this.session === session) {
        this.session = undefined;
      }
      void session.subscriber.close().catch(() => undefined);
      throw error;
    }
  }

  override async subscribe(
    triggerName: string,
    onMessage: (payload: unknown) => void,
  ): Promise<number> {
    const subId = await super.subscribe(triggerName, onMessage);
    this.activeSubscriptionIds.add(subId);
    try {
      await this.connect();
    } catch (error) {
      this.unsubscribe(subId);
      throw error;
    }
    return subId;
  }

  override unsubscribe(subId: number): void {
    super.unsubscribe(subId);
    this.activeSubscriptionIds.delete(subId);
    this.scheduleRelease();
  }

  override async publish(triggerName: string, payload: unknown): Promise<void> {
    await this.connect();
    try {
      await this.session?.subscriber.notify(PUBSUB_NOTIFY_CHANNEL, {
        triggerName,
        payload,
      });
    } finally {
      this.scheduleRelease();
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.cancelRelease();
    await this.release();
  }

  private openSession(): ListenSession {
    const subscriber = this.createSubscriber();
    subscriber.notifications.on(PUBSUB_NOTIFY_CHANNEL, (message) => {
      void super.publish(message.triggerName, message.payload);
    });
    // pg-listen emits 'error' when its own reconnect gives up; an unhandled
    // 'error' event would crash the process.
    subscriber.events.on('error', (error) => {
      this.logger.error(`LISTEN connection error: ${error.message}`);
    });

    const ready = subscriber
      .connect()
      .then(() => subscriber.listenTo(PUBSUB_NOTIFY_CHANNEL))
      .then(() => undefined);
    return { subscriber, ready };
  }

  private scheduleRelease(): void {
    if (this.activeSubscriptionIds.size > 0 || !this.session) return;
    this.cancelRelease();
    this.releaseTimer = setTimeout(() => {
      this.releaseTimer = undefined;
      if (this.activeSubscriptionIds.size === 0) {
        void this.release();
      }
    }, this.idleReleaseMs);
    this.releaseTimer.unref?.();
  }

  private cancelRelease(): void {
    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = undefined;
    }
  }

  private async release(): Promise<void> {
    const session = this.session;
    if (!session) return;
    this.session = undefined;
    try {
      await session.ready.catch(() => undefined);
      await session.subscriber.close();
    } catch (error) {
      this.logger.warn(
        `Failed to close LISTEN connection: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

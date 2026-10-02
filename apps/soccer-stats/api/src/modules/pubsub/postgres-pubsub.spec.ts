import { EventEmitter } from 'events';

import { PubSub } from 'graphql-subscriptions';
import type { Subscriber } from 'pg-listen';

import {
  PostgresPubSub,
  PUBSUB_NOTIFY_CHANNEL,
  type PubSubRelayMessage,
} from './postgres-pubsub';

type FakeSubscriber = Subscriber<Record<string, PubSubRelayMessage>>;

/**
 * A fake pg-listen Subscriber that mimics real Postgres NOTIFY semantics:
 * calling `.notify()` on a channel echoes the payload back through
 * `.notifications` for every listener of that channel (Postgres delivers
 * NOTIFY to the issuing session too, if it's LISTENing).
 */
function createFakeSubscriber(): FakeSubscriber {
  const notifications = new EventEmitter();
  const events = new EventEmitter();
  const listenedChannels = new Set<string>();

  const subscriber = {
    notifications,
    events,
    connect: jest.fn().mockResolvedValue(undefined),
    listenTo: jest.fn().mockImplementation((channel: string) => {
      listenedChannels.add(channel);
      return Promise.resolve();
    }),
    notify: jest
      .fn()
      .mockImplementation((channel: string, payload: PubSubRelayMessage) => {
        if (listenedChannels.has(channel)) {
          notifications.emit(channel, payload);
        }
        return Promise.resolve();
      }),
    close: jest.fn().mockResolvedValue(undefined),
  } as unknown as FakeSubscriber;

  return subscriber;
}

/**
 * pg-listen subscribers can't reconnect once closed, so PostgresPubSub takes
 * a factory. This records every subscriber it hands out.
 */
function createSubscriberFactory() {
  const created: FakeSubscriber[] = [];
  const factory = jest.fn(() => {
    const subscriber = createFakeSubscriber();
    created.push(subscriber);
    return subscriber;
  });
  return { factory, created };
}

const IDLE_RELEASE_MS = 60_000;

/** Lets pending promise callbacks run without advancing fake timers. */
async function flushPromises(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

describe('PostgresPubSub', () => {
  it('is a graphql-subscriptions PubSub', () => {
    const { factory } = createSubscriberFactory();
    const pubSub = new PostgresPubSub(factory);
    expect(pubSub).toBeInstanceOf(PubSub);
  });

  it('connects and starts listening before notifying', async () => {
    const { factory, created } = createSubscriberFactory();
    const pubSub = new PostgresPubSub(factory);

    await pubSub.publish('game-event', { hello: 'world' });

    const [subscriber] = created;
    expect(subscriber.connect).toHaveBeenCalledTimes(1);
    expect(subscriber.listenTo).toHaveBeenCalledWith(PUBSUB_NOTIFY_CHANNEL);
    expect(subscriber.notify).toHaveBeenCalledWith(PUBSUB_NOTIFY_CHANNEL, {
      triggerName: 'game-event',
      payload: { hello: 'world' },
    });
  });

  it('only connects once across multiple publishes', async () => {
    const { factory, created } = createSubscriberFactory();
    const pubSub = new PostgresPubSub(factory);

    await pubSub.publish('game-event', { seq: 1 });
    await pubSub.publish('game-event', { seq: 2 });

    expect(factory).toHaveBeenCalledTimes(1);
    expect(created[0].connect).toHaveBeenCalledTimes(1);
    expect(created[0].listenTo).toHaveBeenCalledTimes(1);
  });

  it('retries with a fresh subscriber after a connection failure', async () => {
    const { factory, created } = createSubscriberFactory();
    factory.mockImplementationOnce(() => {
      const failing = createFakeSubscriber();
      failing.connect = jest
        .fn()
        .mockRejectedValue(new Error('temporary connection failure'));
      created.push(failing);
      return failing;
    });
    const pubSub = new PostgresPubSub(factory);

    await expect(pubSub.publish('game-event', { seq: 1 })).rejects.toThrow(
      'temporary connection failure',
    );
    await expect(
      pubSub.publish('game-event', { seq: 2 }),
    ).resolves.toBeUndefined();

    expect(factory).toHaveBeenCalledTimes(2);
    expect(created[0].close).toHaveBeenCalledTimes(1);
    expect(created[1].notify).toHaveBeenCalledWith(PUBSUB_NOTIFY_CHANNEL, {
      triggerName: 'game-event',
      payload: { seq: 2 },
    });
  });

  it('delivers a published event back to a local subscriber via the round trip', async () => {
    const { factory } = createSubscriberFactory();
    const pubSub = new PostgresPubSub(factory);
    const iterator = pubSub
      .asyncIterableIterator<{ hello: string }>('game-event')
      [Symbol.asyncIterator]();

    const received = iterator.next();
    await pubSub.publish('game-event', { hello: 'world' });

    await expect(received).resolves.toEqual({
      value: { hello: 'world' },
      done: false,
    });
  });

  it('delivers notifications that originated from another process/instance', async () => {
    const { factory, created } = createSubscriberFactory();
    const pubSub = new PostgresPubSub(factory);
    const iterator = pubSub
      .asyncIterableIterator<{ from: string }>('game-event')
      [Symbol.asyncIterator]();

    const received = iterator.next();
    // Subscribing is what opens the LISTEN connection.
    await flushPromises();

    // Simulate a NOTIFY arriving from a different ECS task's connection.
    created[0].notifications.emit(PUBSUB_NOTIFY_CHANNEL, {
      triggerName: 'game-event',
      payload: { from: 'other-task' },
    } satisfies PubSubRelayMessage);

    await expect(received).resolves.toEqual({
      value: { from: 'other-task' },
      done: false,
    });
  });

  it('closes the underlying subscriber on module destroy', async () => {
    const { factory, created } = createSubscriberFactory();
    const pubSub = new PostgresPubSub(factory);
    await pubSub.publish('game-event', {});

    await pubSub.onModuleDestroy();

    expect(created[0].close).toHaveBeenCalledTimes(1);
  });

  it('does not open a connection on module destroy if it never connected', async () => {
    const { factory } = createSubscriberFactory();
    const pubSub = new PostgresPubSub(factory);

    await pubSub.onModuleDestroy();

    expect(factory).not.toHaveBeenCalled();
  });

  /**
   * Aurora Serverless v2 can only auto-pause when there are zero open
   * connections. A permanently open LISTEN connection kept the database at
   * 0.5 ACU around the clock, so the connection is only held while it's
   * needed.
   */
  describe('idle connection release', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not connect until something subscribes or publishes', () => {
      const { factory } = createSubscriberFactory();
      new PostgresPubSub(factory, { idleReleaseMs: IDLE_RELEASE_MS });

      expect(factory).not.toHaveBeenCalled();
    });

    it('opens the LISTEN connection when the first subscription starts', async () => {
      const { factory, created } = createSubscriberFactory();
      const pubSub = new PostgresPubSub(factory, {
        idleReleaseMs: IDLE_RELEASE_MS,
      });

      await pubSub.subscribe('game-event', jest.fn());

      expect(factory).toHaveBeenCalledTimes(1);
      expect(created[0].listenTo).toHaveBeenCalledWith(PUBSUB_NOTIFY_CHANNEL);
    });

    it('keeps the connection open while a subscription is active', async () => {
      const { factory, created } = createSubscriberFactory();
      const pubSub = new PostgresPubSub(factory, {
        idleReleaseMs: IDLE_RELEASE_MS,
      });

      await pubSub.subscribe('game-event', jest.fn());
      await pubSub.publish('game-event', {});
      jest.advanceTimersByTime(IDLE_RELEASE_MS * 10);
      await flushPromises();

      expect(created[0].close).not.toHaveBeenCalled();
    });

    it('releases the connection once the last subscription has been gone for the idle period', async () => {
      const { factory, created } = createSubscriberFactory();
      const pubSub = new PostgresPubSub(factory, {
        idleReleaseMs: IDLE_RELEASE_MS,
      });
      const first = await pubSub.subscribe('game-event', jest.fn());
      const second = await pubSub.subscribe('game-event', jest.fn());

      pubSub.unsubscribe(first);
      jest.advanceTimersByTime(IDLE_RELEASE_MS);
      await flushPromises();
      expect(created[0].close).not.toHaveBeenCalled();

      pubSub.unsubscribe(second);
      jest.advanceTimersByTime(IDLE_RELEASE_MS - 1);
      await flushPromises();
      expect(created[0].close).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      await flushPromises();
      expect(created[0].close).toHaveBeenCalledTimes(1);
    });

    it('cancels the pending release if a new subscription arrives during the grace period', async () => {
      const { factory, created } = createSubscriberFactory();
      const pubSub = new PostgresPubSub(factory, {
        idleReleaseMs: IDLE_RELEASE_MS,
      });
      pubSub.unsubscribe(await pubSub.subscribe('game-event', jest.fn()));

      jest.advanceTimersByTime(IDLE_RELEASE_MS / 2);
      await pubSub.subscribe('game-event', jest.fn());
      jest.advanceTimersByTime(IDLE_RELEASE_MS * 2);
      await flushPromises();

      expect(factory).toHaveBeenCalledTimes(1);
      expect(created[0].close).not.toHaveBeenCalled();
    });

    it('releases the connection after a publish when nothing is subscribed locally', async () => {
      const { factory, created } = createSubscriberFactory();
      const pubSub = new PostgresPubSub(factory, {
        idleReleaseMs: IDLE_RELEASE_MS,
      });

      await pubSub.publish('game-event', {});
      jest.advanceTimersByTime(IDLE_RELEASE_MS);
      await flushPromises();

      expect(created[0].close).toHaveBeenCalledTimes(1);
    });

    it('opens a fresh subscriber after a release and delivers through it', async () => {
      const { factory, created } = createSubscriberFactory();
      const pubSub = new PostgresPubSub(factory, {
        idleReleaseMs: IDLE_RELEASE_MS,
      });
      pubSub.unsubscribe(await pubSub.subscribe('game-event', jest.fn()));
      jest.advanceTimersByTime(IDLE_RELEASE_MS);
      await flushPromises();

      const onMessage = jest.fn();
      await pubSub.subscribe('game-event', onMessage);
      await pubSub.publish('game-event', { seq: 2 });

      expect(factory).toHaveBeenCalledTimes(2);
      expect(created[1].listenTo).toHaveBeenCalledWith(PUBSUB_NOTIFY_CHANNEL);
      expect(onMessage).toHaveBeenCalledWith({ seq: 2 });
    });

    it('does not leak a subscription when the connection cannot be opened', async () => {
      const { factory, created } = createSubscriberFactory();
      factory.mockImplementationOnce(() => {
        const failing = createFakeSubscriber();
        failing.connect = jest.fn().mockRejectedValue(new Error('db down'));
        created.push(failing);
        return failing;
      });
      const pubSub = new PostgresPubSub(factory, {
        idleReleaseMs: IDLE_RELEASE_MS,
      });

      await expect(pubSub.subscribe('game-event', jest.fn())).rejects.toThrow(
        'db down',
      );

      // A later publish-only connection must still be released, which only
      // happens if the failed subscription wasn't counted as active.
      await pubSub.publish('game-event', {});
      jest.advanceTimersByTime(IDLE_RELEASE_MS);
      await flushPromises();
      expect(created[1].close).toHaveBeenCalledTimes(1);
    });
  });
});

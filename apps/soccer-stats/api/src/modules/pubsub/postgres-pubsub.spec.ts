import { EventEmitter } from 'events';

import { PubSub } from 'graphql-subscriptions';
import type { Subscriber } from 'pg-listen';

import {
  PostgresPubSub,
  PUBSUB_NOTIFY_CHANNEL,
  type PubSubRelayMessage,
} from './postgres-pubsub';

/**
 * A fake pg-listen Subscriber that mimics real Postgres NOTIFY semantics:
 * calling `.notify()` on a channel echoes the payload back through
 * `.notifications` for every listener of that channel (Postgres delivers
 * NOTIFY to the issuing session too, if it's LISTENing).
 */
function createFakeSubscriber() {
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
  } as unknown as Subscriber<Record<string, PubSubRelayMessage>>;

  return subscriber;
}

describe('PostgresPubSub', () => {
  it('is a graphql-subscriptions PubSub', () => {
    const pubSub = new PostgresPubSub(createFakeSubscriber());
    expect(pubSub).toBeInstanceOf(PubSub);
  });

  it('connects and starts listening before notifying', async () => {
    const subscriber = createFakeSubscriber();
    const pubSub = new PostgresPubSub(subscriber);

    await pubSub.publish('game-event', { hello: 'world' });

    expect(subscriber.connect).toHaveBeenCalledTimes(1);
    expect(subscriber.listenTo).toHaveBeenCalledWith(PUBSUB_NOTIFY_CHANNEL);
    expect(subscriber.notify).toHaveBeenCalledWith(PUBSUB_NOTIFY_CHANNEL, {
      triggerName: 'game-event',
      payload: { hello: 'world' },
    });
  });

  it('only connects once across multiple publishes', async () => {
    const subscriber = createFakeSubscriber();
    const pubSub = new PostgresPubSub(subscriber);

    await pubSub.publish('game-event', { seq: 1 });
    await pubSub.publish('game-event', { seq: 2 });

    expect(subscriber.connect).toHaveBeenCalledTimes(1);
    expect(subscriber.listenTo).toHaveBeenCalledTimes(1);
  });

  it('delivers a published event back to a local subscriber via the round trip', async () => {
    const pubSub = new PostgresPubSub(createFakeSubscriber());
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
    const subscriber = createFakeSubscriber();
    const pubSub = new PostgresPubSub(subscriber);
    const iterator = pubSub
      .asyncIterableIterator<{ from: string }>('game-event')
      [Symbol.asyncIterator]();

    // Get this instance LISTENing, the same way a real process would on boot.
    await pubSub.connect();

    const received = iterator.next();
    // Simulate a NOTIFY arriving from a different ECS task's connection.
    subscriber.notifications.emit(PUBSUB_NOTIFY_CHANNEL, {
      triggerName: 'game-event',
      payload: { from: 'other-task' },
    } satisfies PubSubRelayMessage);

    await expect(received).resolves.toEqual({
      value: { from: 'other-task' },
      done: false,
    });
  });

  it('closes the underlying subscriber on module destroy', async () => {
    const subscriber = createFakeSubscriber();
    const pubSub = new PostgresPubSub(subscriber);

    await pubSub.onModuleDestroy();

    expect(subscriber.close).toHaveBeenCalledTimes(1);
  });
});

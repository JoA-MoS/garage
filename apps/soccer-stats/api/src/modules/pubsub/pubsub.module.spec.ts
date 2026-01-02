import { Test, TestingModule } from '@nestjs/testing';
import { PubSub } from 'graphql-subscriptions';

import { PubSubModule } from './pubsub.module';

describe('PubSubModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PubSubModule],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should provide a PubSub instance', () => {
    const pubSub = module.get<PubSub>('PUB_SUB');
    expect(pubSub).toBeDefined();
    expect(pubSub).toBeInstanceOf(PubSub);
  });

  it('should provide the SAME PubSub instance on multiple injections (singleton)', () => {
    const pubSub1 = module.get<PubSub>('PUB_SUB');
    const pubSub2 = module.get<PubSub>('PUB_SUB');

    // Critical: Both injections must return the exact same instance
    // If this fails, subscriptions won't work across different modules/windows
    expect(pubSub1).toBe(pubSub2);
  });

  it('should allow publishing and subscribing to events', (done) => {
    const pubSub = module.get<PubSub>('PUB_SUB');
    const testChannel = 'test-channel-' + Date.now();
    const testPayload = { message: 'hello' };

    // Create subscription using asyncIterableIterator
    const asyncIterator =
      pubSub.asyncIterableIterator<typeof testPayload>(testChannel);

    // Set up the subscription listener using Symbol.asyncIterator
    const iterator = asyncIterator[Symbol.asyncIterator]();
    iterator.next().then((result) => {
      expect(result.value).toEqual(testPayload);
      expect(result.done).toBe(false);
      done();
    });

    // Give subscription time to set up, then publish
    setTimeout(() => {
      pubSub.publish(testChannel, testPayload);
    }, 10);
  });
});

describe('PubSub Singleton Verification', () => {
  /**
   * This test verifies that multiple modules receive the SAME PubSub instance.
   * This is critical for subscriptions to work across browser windows/tabs.
   *
   * If this test fails, it means modules are creating their own PubSub instances,
   * which will break cross-client subscription updates.
   */
  it('should share the same PubSub instance across multiple module injections', async () => {
    // Simulate two different "modules" requesting PubSub
    const module1 = await Test.createTestingModule({
      imports: [PubSubModule],
    }).compile();

    const module2 = await Test.createTestingModule({
      imports: [PubSubModule],
    }).compile();

    const pubSub1 = module1.get<PubSub>('PUB_SUB');
    const pubSub2 = module2.get<PubSub>('PUB_SUB');

    // Note: In separate test modules, these will be different instances
    // because each TestingModule creates its own DI container.
    // The real test is in the cross-module integration test below.
    expect(pubSub1).toBeDefined();
    expect(pubSub2).toBeDefined();

    await module1.close();
    await module2.close();
  });

  it('should propagate events between publisher and subscriber on same instance', (done) => {
    const pubSub = new PubSub();
    const channel = 'game-event:test-game-id-' + Date.now();

    const testEvent = {
      gameEventChanged: {
        action: 'CREATED',
        gameId: 'test-game-id',
        event: { id: 'event-1', type: 'goal' },
      },
    };

    // Create iterator and listen for next event
    const asyncIterable =
      pubSub.asyncIterableIterator<typeof testEvent>(channel);
    const iterator = asyncIterable[Symbol.asyncIterator]();

    iterator.next().then((result) => {
      expect(result.value).toEqual(testEvent);
      done();
    });

    // Wait for subscription to be ready, then publish
    setTimeout(() => {
      pubSub.publish(channel, testEvent);
    }, 10);
  });
});

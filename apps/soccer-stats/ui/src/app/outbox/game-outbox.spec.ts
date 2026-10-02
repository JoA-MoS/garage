import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CombinedGraphQLErrors } from '@apollo/client/errors';

import {
  GameOutbox,
  MAX_RETRY_ATTEMPTS,
  type GameOutboxOptions,
} from './game-outbox';
import { indexedDbOutboxStorage, memoryOutboxStorage } from './outbox-storage';
import type { OutboxAction } from './outbox-types';

let counter = 0;
function action(overrides: Partial<OutboxAction> = {}): OutboxAction {
  counter += 1;
  return {
    actionId: `a${counter}`,
    gameId: 'game-1',
    kind: 'swapPositions',
    variables: { input: { n: counter } },
    pendingEvents: [],
    createdAt: new Date(0).toISOString(),
    attempts: 0,
    nextAttemptAt: 0,
    status: 'queued',
    ...overrides,
  };
}

function rejection(message: string, extensions: Record<string, unknown>) {
  return new CombinedGraphQLErrors({
    data: null,
    errors: [{ message, extensions }],
  });
}

function makeOutbox(overrides: Partial<GameOutboxOptions> = {}) {
  const send = vi.fn().mockResolvedValue(undefined);
  const onChange = vi.fn();
  const outbox = new GameOutbox({
    scope: 'user-1:game-1',
    storage: memoryOutboxStorage(),
    send,
    onChange,
    ...overrides,
  });
  return { outbox, send, onChange };
}

describe('GameOutbox', () => {
  beforeEach(() => {
    counter = 0;
  });

  it('keeps actions on the device and reports them as pending', async () => {
    const { outbox, onChange } = makeOutbox();

    await outbox.enqueue(action());

    expect((await outbox.load()).map((a) => a.actionId)).toEqual(['a1']);
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ actionId: 'a1' }),
    ]);
  });

  it('sends in recording order, one at a time, and removes each once sent', async () => {
    const order: string[] = [];
    let inFlight = 0;
    const send = vi.fn(async (a: OutboxAction) => {
      inFlight += 1;
      expect(inFlight).toBe(1);
      order.push(a.actionId);
      await Promise.resolve();
      inFlight -= 1;
    });
    const { outbox } = makeOutbox({ send });
    await outbox.enqueue(action());
    await outbox.enqueue(action());
    await outbox.enqueue(action());

    await outbox.sync();

    expect(order).toEqual(['a1', 'a2', 'a3']);
    expect(await outbox.load()).toEqual([]);
  });

  it('shares one drain between concurrent sync calls', async () => {
    const { outbox, send } = makeOutbox();
    await outbox.enqueue(action());

    await Promise.all([outbox.sync(), outbox.sync(), outbox.sync()]);

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('backs off on a transient failure and holds later actions behind it', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(undefined);
    const { outbox } = makeOutbox({ send });
    await outbox.enqueue(action());
    await outbox.enqueue(action());

    await outbox.sync(1_000);

    expect(send).toHaveBeenCalledTimes(1);
    const [first, second] = await outbox.load();
    expect(first).toMatchObject({
      actionId: 'a1',
      status: 'queued',
      attempts: 1,
      nextAttemptAt: 2_000,
    });
    expect(second.actionId).toBe('a2');

    await outbox.sync(1_500); // still backing off
    expect(send).toHaveBeenCalledTimes(1);

    await outbox.sync(2_000);
    expect(send).toHaveBeenCalledTimes(3);
    expect(await outbox.load()).toEqual([]);
  });

  it('stops for the user when the server rejects an action, keeping it and everything after it', async () => {
    const send = vi.fn().mockRejectedValue(
      rejection('Both players must have positions to swap', {
        code: 'BAD_REQUEST',
      }),
    );
    const { outbox } = makeOutbox({ send });
    await outbox.enqueue(action());
    await outbox.enqueue(action());

    await outbox.sync();
    await outbox.sync();

    expect(send).toHaveBeenCalledTimes(1);
    expect(await outbox.load()).toEqual([
      expect.objectContaining({
        actionId: 'a1',
        status: 'failed',
        error: 'Both players must have positions to swap',
      }),
      expect.objectContaining({ actionId: 'a2', status: 'queued' }),
    ]);
  });

  it('drops an action the server reports as already applied', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(
        rejection('already applied', {
          code: 'INTERNAL_SERVER_ERROR',
          status: 409,
        }),
      )
      .mockResolvedValue(undefined);
    const { outbox } = makeOutbox({ send });
    await outbox.enqueue(action());
    await outbox.enqueue(action());

    await outbox.sync();

    expect(send).toHaveBeenCalledTimes(2);
    expect(await outbox.load()).toEqual([]);
  });

  it(`gives up on a repeated transient failure after ${MAX_RETRY_ATTEMPTS} attempts`, async () => {
    const send = vi
      .fn()
      .mockRejectedValue(
        rejection('Internal server error', { code: 'INTERNAL_SERVER_ERROR' }),
      );
    const { outbox } = makeOutbox({ send });
    await outbox.enqueue(action());

    // Each sync is past the (at most 60s) backoff of the previous attempt.
    for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
      await outbox.sync((i + 1) * 120_000);
    }

    expect(await outbox.load()).toEqual([
      expect.objectContaining({
        status: 'failed',
        attempts: MAX_RETRY_ATTEMPTS,
      }),
    ]);
  });

  it('retries a failed action on request', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(rejection('nope', { code: 'BAD_REQUEST' }))
      .mockResolvedValue(undefined);
    const { outbox } = makeOutbox({ send });
    await outbox.enqueue(action());
    await outbox.sync();

    await outbox.retry('a1');
    await outbox.sync();

    expect(await outbox.load()).toEqual([]);
  });

  it('discards only failed actions', async () => {
    const send = vi
      .fn()
      .mockRejectedValue(rejection('nope', { code: 'BAD_REQUEST' }));
    const { outbox } = makeOutbox({ send });
    await outbox.enqueue(action());
    await outbox.enqueue(action());
    await outbox.sync();

    await outbox.discard('a2'); // still queued - ignored
    await outbox.discard('a1');

    expect((await outbox.load()).map((a) => a.actionId)).toEqual(['a2']);
  });

  it('does nothing while inactive (e.g. signed out)', async () => {
    const { outbox, send } = makeOutbox({ isActive: () => false });
    await outbox.enqueue(action()).catch(() => undefined);

    await outbox.sync();

    expect(send).not.toHaveBeenCalled();
  });

  describe('with IndexedDB storage', () => {
    it('survives a reload: a new outbox for the same scope sees queued actions', async () => {
      const storage = indexedDbOutboxStorage('test-outbox-reload');
      const first = new GameOutbox({
        scope: 'user-1:game-1',
        storage,
        send: vi.fn(),
      });
      await first.enqueue(action());

      const afterReload = new GameOutbox({
        scope: 'user-1:game-1',
        storage: indexedDbOutboxStorage('test-outbox-reload'),
        send: vi.fn(),
      });

      expect((await afterReload.load()).map((a) => a.actionId)).toEqual(['a1']);
    });

    it('does not lose actions enqueued concurrently (e.g. from two tabs)', async () => {
      const scope = 'user-1:game-concurrent';
      const tabA = new GameOutbox({
        scope,
        storage: indexedDbOutboxStorage('test-outbox-concurrent'),
        send: vi.fn(),
      });
      const tabB = new GameOutbox({
        scope,
        storage: indexedDbOutboxStorage('test-outbox-concurrent'),
        send: vi.fn(),
      });

      await Promise.all([
        tabA.enqueue(action()),
        tabB.enqueue(action()),
        tabA.enqueue(action()),
        tabB.enqueue(action()),
      ]);

      expect(await tabA.load()).toHaveLength(4);
    });

    it('keeps users and games apart', async () => {
      const storage = indexedDbOutboxStorage('test-outbox-scopes');
      const mine = new GameOutbox({
        scope: 'user-1:game-1',
        storage,
        send: vi.fn(),
      });
      const someoneElse = new GameOutbox({
        scope: 'user-2:game-1',
        storage,
        send: vi.fn(),
      });

      await mine.enqueue(action());

      expect(await someoneElse.load()).toEqual([]);
    });
  });
});

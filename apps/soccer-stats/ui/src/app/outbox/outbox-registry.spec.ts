import { beforeEach, describe, expect, it, vi } from 'vitest';

import { memoryOutboxStorage } from './outbox-storage';
import {
  getGameOutbox,
  setActiveOutboxUser,
  syncAllQueuedGames,
} from './outbox-registry';
import type { OutboxAction } from './outbox-types';

function action(gameId: string, actionId: string): OutboxAction {
  return {
    actionId,
    gameId,
    kind: 'recordGoal',
    variables: {},
    pendingEvents: [],
    createdAt: '2026-10-02T10:00:00.000Z',
    attempts: 0,
    nextAttemptAt: 0,
    status: 'queued',
  };
}

describe('outbox registry', () => {
  beforeEach(() => setActiveOutboxUser('user-1'));

  it('shares one outbox per user and game, so a change is only sent once', async () => {
    const storage = memoryOutboxStorage();
    const send = vi.fn().mockResolvedValue(undefined);
    const fromGamePage = getGameOutbox('user-1', 'g1', { storage, send });
    const fromBackground = getGameOutbox('user-1', 'g1', { storage, send });

    expect(fromBackground.outbox).toBe(fromGamePage.outbox);

    await fromGamePage.outbox.enqueue(action('g1', 'a1'));
    await Promise.all([
      fromGamePage.outbox.sync(),
      fromBackground.outbox.sync(),
    ]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('tells every subscriber about changes', async () => {
    const storage = memoryOutboxStorage();
    const entry = getGameOutbox('user-1', 'g1', {
      storage,
      send: vi.fn().mockResolvedValue(undefined),
    });
    const a = vi.fn();
    const b = vi.fn();
    const unsubscribeB = entry.subscribe(b);
    entry.subscribe(a);

    await entry.outbox.enqueue(action('g1', 'a1'));
    unsubscribeB();
    await entry.outbox.enqueue(action('g1', 'a2'));

    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('stops touching a queue once its user is no longer signed in', async () => {
    const storage = memoryOutboxStorage();
    const entry = getGameOutbox('user-1', 'g1', {
      storage,
      send: vi.fn().mockResolvedValue(undefined),
    });

    setActiveOutboxUser(null);

    await expect(entry.outbox.enqueue(action('g1', 'a1'))).rejects.toThrow(
      'Sign in',
    );
  });

  describe('syncAllQueuedGames', () => {
    it("sends every game's queued changes for the user, from anywhere in the app", async () => {
      const storage = memoryOutboxStorage();
      const send = vi.fn().mockResolvedValue(undefined);
      await storage.update('user-1:g1', () => [action('g1', 'a1')]);
      await storage.update('user-1:g2', () => [action('g2', 'a2')]);
      await storage.update('user-2:g3', () => [action('g3', 'a3')]);

      const pending = await syncAllQueuedGames('user-1', { storage, send });

      expect(send.mock.calls.map(([a]) => a.actionId).sort()).toEqual([
        'a1',
        'a2',
      ]);
      expect(pending).toBe(false);
      expect(await storage.read('user-2:g3')).toHaveLength(1);
    });

    it('reports whether anything is still queued (e.g. offline)', async () => {
      const storage = memoryOutboxStorage();
      const send = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      await storage.update('user-1:g1', () => [action('g1', 'a1')]);

      expect(await syncAllQueuedGames('user-1', { storage, send })).toBe(true);
    });
  });
});

import { GameOutbox } from './game-outbox';
import { indexedDbOutboxStorage, type OutboxStorage } from './outbox-storage';
import type { OutboxAction } from './outbox-types';

/**
 * One GameOutbox per user and game, shared by everything that sends: the
 * game page (GameOutboxProvider) and the app-wide background sync
 * (OutboxBackgroundSync). Sharing the instance shares its drain, so a queued
 * change is sent once even when both try to sync at the same time.
 */

type Listener = (actions: OutboxAction[]) => void;

interface Entry {
  outbox: GameOutbox;
  listeners: Set<Listener>;
}

export interface OutboxDeps {
  storage?: OutboxStorage;
  send: (action: OutboxAction) => Promise<void>;
}

export interface RegisteredOutbox {
  outbox: GameOutbox;
  /** Called with the full list after every change. Returns unsubscribe. */
  subscribe: (listener: Listener) => () => void;
}

let defaultStorage: OutboxStorage | undefined;
// Keyed by storage too, so tests with their own storage never share state.
const registries = new WeakMap<OutboxStorage, Map<string, Entry>>();
let activeUserId: string | null | undefined;

function storageOrDefault(storage?: OutboxStorage): OutboxStorage {
  return storage ?? (defaultStorage ??= indexedDbOutboxStorage());
}

/**
 * The signed-in user. A user's queue is only read, written or sent while
 * they're the active user, so signing out stops everything at once.
 */
export function setActiveOutboxUser(userId: string | null | undefined): void {
  activeUserId = userId;
}

export function getGameOutbox(
  userId: string,
  gameId: string,
  deps: OutboxDeps,
): RegisteredOutbox {
  const storage = storageOrDefault(deps.storage);
  let registry = registries.get(storage);
  if (!registry) {
    registry = new Map();
    registries.set(storage, registry);
  }

  const scope = `${userId}:${gameId}`;
  let entry = registry.get(scope);
  if (!entry) {
    const listeners = new Set<Listener>();
    entry = {
      listeners,
      outbox: new GameOutbox({
        scope,
        storage,
        send: deps.send,
        onChange: (actions) => listeners.forEach((l) => l(actions)),
        isActive: () => activeUserId === userId,
      }),
    };
    registry.set(scope, entry);
  }

  const { outbox, listeners } = entry;
  return {
    outbox,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Sends the queued changes of every game this user has a queue for, wherever
 * they are in the app. Resolves true if anything is still queued afterwards
 * (offline, backing off, or waiting on Retry/Discard).
 */
export async function syncAllQueuedGames(
  userId: string,
  deps: OutboxDeps,
): Promise<boolean> {
  const storage = storageOrDefault(deps.storage);
  const prefix = `${userId}:`;
  const scopes = await storage.listScopes(prefix);
  let stillQueued = false;

  for (const scope of scopes) {
    const gameId = scope.slice(prefix.length);
    const { outbox } = getGameOutbox(userId, gameId, { ...deps, storage });
    if (!(await outbox.load()).some((a) => a.status === 'queued')) continue;
    await outbox.sync();
    if ((await outbox.load()).some((a) => a.status === 'queued')) {
      stillQueued = true;
    }
  }
  return stillQueued;
}

/** Whether a game has changes not yet confirmed by the server. */
export async function hasUnsyncedChanges(
  userId: string,
  gameId: string,
  storage?: OutboxStorage,
): Promise<boolean> {
  const actions = await storageOrDefault(storage).read(`${userId}:${gameId}`);
  return actions.length > 0;
}

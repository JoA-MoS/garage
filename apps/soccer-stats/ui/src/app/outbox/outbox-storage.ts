import { createStore, get, keys, update, type UseStore } from 'idb-keyval';

import type { OutboxAction } from './outbox-types';

/**
 * Where queued actions live. One list per scope (`${userId}:${gameId}`), so
 * users sharing a device never see or send each other's actions.
 */
export interface OutboxStorage {
  read(scope: string): Promise<OutboxAction[]>;
  /** Read-modify-write as one step, so concurrent writers can't lose work. */
  update(
    scope: string,
    change: (actions: OutboxAction[]) => OutboxAction[],
  ): Promise<OutboxAction[]>;
  /** Scopes starting with `prefix` (e.g. `${userId}:`) that have a list. */
  listScopes(prefix: string): Promise<string[]>;
}

/**
 * IndexedDB storage: survives reloads and the OS killing the app. Each
 * update runs in a single readwrite transaction, so two tabs enqueueing at
 * the same time can't overwrite each other.
 */
export function indexedDbOutboxStorage(
  databaseName = 'soccer-stats-outbox',
): OutboxStorage {
  let store: UseStore | undefined;
  const getStore = () => (store ??= createStore(databaseName, 'actions'));

  return {
    async read(scope) {
      return (await get<OutboxAction[]>(scope, getStore())) ?? [];
    },
    async update(scope, change) {
      let next: OutboxAction[] = [];
      await update<OutboxAction[]>(
        scope,
        (current) => (next = change(current ?? [])),
        getStore(),
      );
      return next;
    },
    async listScopes(prefix) {
      const all = await keys<string>(getStore());
      return all.filter(
        (key): key is string =>
          typeof key === 'string' && key.startsWith(prefix),
      );
    },
  };
}

/** In-memory storage for tests. */
export function memoryOutboxStorage(): OutboxStorage {
  const lists = new Map<string, OutboxAction[]>();
  return {
    async read(scope) {
      return lists.get(scope) ?? [];
    },
    async update(scope, change) {
      const next = change(lists.get(scope) ?? []);
      lists.set(scope, next);
      return next;
    },
    async listScopes(prefix) {
      return [...lists.keys()].filter((key) => key.startsWith(prefix));
    },
  };
}

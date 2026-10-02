import { InMemoryCache, type NormalizedCacheObject } from '@apollo/client';
import { createStore, del, get, set, type UseStore } from 'idb-keyval';

/**
 * Saves the Apollo cache on the device so the app opens straight onto the
 * last known data (e.g. the live game) instead of waiting for the network,
 * then refreshes in the background (docs/event-outbox.md, phase 4).
 */

/**
 * Bump when a query's shape changes in a way old cached data can't satisfy
 * (e.g. a field became non-null). Older snapshots are then ignored.
 */
export const CACHE_SCHEMA_VERSION = 1;

/** Snapshots older than this are ignored rather than shown. */
export const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface CacheSnapshot {
  version: number;
  /** Epoch ms. */
  savedAt: number;
  /** Whose data it is - never shown to another user. */
  userId: string;
  data: NormalizedCacheObject;
}

export interface CacheStore {
  read(): Promise<CacheSnapshot | undefined>;
  write(snapshot: CacheSnapshot): Promise<void>;
  clear(): Promise<void>;
}

/** An InMemoryCache that reports every change (after watchers are told). */
export class ObservableInMemoryCache extends InMemoryCache {
  onChange?: () => void;

  protected override broadcastWatches(
    ...args: Parameters<InMemoryCache['broadcastWatches']>
  ): void {
    super.broadcastWatches(...args);
    this.onChange?.();
  }
}

export function shouldRestoreSnapshot(
  snapshot: CacheSnapshot | undefined,
  now: number = Date.now(),
): snapshot is CacheSnapshot {
  return (
    !!snapshot &&
    snapshot.version === CACHE_SCHEMA_VERSION &&
    now - snapshot.savedAt <= MAX_CACHE_AGE_MS
  );
}

/**
 * Loads the saved snapshot into `cache`. Returns it (so the caller can check
 * it belongs to the signed-in user), or undefined if there was nothing
 * usable. Never throws: a broken snapshot just means a cold start.
 *
 * With `deadlineMs`, gives up after that long, and a snapshot read after the
 * deadline is never applied. A late restore would overwrite data fetched
 * since startup, and its owner would be unknown to the caller, so the
 * cross-user wipe in CachePersistence couldn't run.
 */
export async function restoreCache(
  cache: InMemoryCache,
  { store = defaultStore(), now = Date.now, deadlineMs }: RestoreOptions = {},
): Promise<CacheSnapshot | undefined> {
  let expired = false;
  const restore = (async () => {
    try {
      const snapshot = await store.read();
      if (expired || !shouldRestoreSnapshot(snapshot, now())) return undefined;
      cache.restore(snapshot.data);
      return snapshot;
    } catch (error) {
      console.warn('[cache-persistence] Ignoring unreadable snapshot:', error);
      return undefined;
    }
  })();
  if (deadlineMs === undefined) return restore;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      expired = true;
      resolve(undefined);
    }, deadlineMs);
  });
  try {
    return await Promise.race([restore, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

interface RestoreOptions {
  store?: CacheStore;
  now?: () => number;
  /** Give up after this long; a late snapshot is then never applied. */
  deadlineMs?: number;
}

export interface PersistOptions {
  store?: CacheStore;
  /** The signed-in user; nothing is saved while null. */
  getUserId: () => string | null | undefined;
  debounceMs?: number;
  now?: () => number;
}

/**
 * Saves the cache shortly after it changes, and immediately when the app
 * goes to the background (the last reliable moment on a phone). Returns a
 * function that stops saving.
 */
export function persistCache(
  cache: ObservableInMemoryCache,
  {
    store = defaultStore(),
    getUserId,
    debounceMs = 1000,
    now = Date.now,
  }: PersistOptions,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const save = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const userId = getUserId();
    if (stopped || !userId) return;
    void store
      .write({
        version: CACHE_SCHEMA_VERSION,
        savedAt: now(),
        userId,
        data: cache.extract(),
      })
      .catch((error) =>
        console.warn('[cache-persistence] Failed to save cache:', error),
      );
  };

  const scheduleSave = () => {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, debounceMs);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') save();
  };

  cache.onChange = scheduleSave;
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (cache.onChange === scheduleSave) cache.onChange = undefined;
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

export async function clearPersistedCache(
  store: CacheStore = defaultStore(),
): Promise<void> {
  await store.clear();
}

const SNAPSHOT_KEY = 'apollo-cache';

export function indexedDbCacheStore(
  databaseName = 'soccer-stats-cache',
): CacheStore {
  let idb: UseStore | undefined;
  const getStore = () => (idb ??= createStore(databaseName, 'snapshots'));
  return {
    read: () => get<CacheSnapshot>(SNAPSHOT_KEY, getStore()),
    write: (snapshot) => set(SNAPSHOT_KEY, snapshot, getStore()),
    clear: () => del(SNAPSHOT_KEY, getStore()),
  };
}

export function memoryCacheStore(): CacheStore {
  let snapshot: CacheSnapshot | undefined;
  return {
    read: async () => snapshot,
    write: async (next) => {
      snapshot = next;
    },
    clear: async () => {
      snapshot = undefined;
    },
  };
}

let sharedStore: CacheStore | undefined;
function defaultStore(): CacheStore {
  return (sharedStore ??= indexedDbCacheStore());
}

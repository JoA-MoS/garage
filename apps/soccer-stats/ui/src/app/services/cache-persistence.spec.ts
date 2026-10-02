import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gql } from '@apollo/client';

import {
  CACHE_SCHEMA_VERSION,
  MAX_CACHE_AGE_MS,
  ObservableInMemoryCache,
  clearPersistedCache,
  indexedDbCacheStore,
  memoryCacheStore,
  persistCache,
  restoreCache,
  shouldRestoreSnapshot,
  type CacheSnapshot,
} from './cache-persistence';

const GAME = gql`
  query Game {
    game(id: "g1") {
      id
      name
    }
  }
`;

function writeGame(cache: ObservableInMemoryCache, name: string) {
  cache.writeQuery({
    query: GAME,
    data: { game: { __typename: 'Game', id: 'g1', name } },
  });
}

const NOW = Date.parse('2026-10-02T12:00:00.000Z');

function snapshot(overrides: Partial<CacheSnapshot> = {}): CacheSnapshot {
  return {
    version: CACHE_SCHEMA_VERSION,
    savedAt: NOW - 60_000,
    userId: 'user-1',
    data: {},
    ...overrides,
  };
}

describe('shouldRestoreSnapshot', () => {
  it('restores a recent snapshot of the current schema version', () => {
    expect(shouldRestoreSnapshot(snapshot(), NOW)).toBe(true);
  });

  it('ignores a snapshot from another schema version (query shapes may differ)', () => {
    expect(
      shouldRestoreSnapshot(
        snapshot({ version: CACHE_SCHEMA_VERSION - 1 }),
        NOW,
      ),
    ).toBe(false);
  });

  it(`ignores a snapshot older than ${MAX_CACHE_AGE_MS / 86_400_000} days`, () => {
    expect(
      shouldRestoreSnapshot(
        snapshot({ savedAt: NOW - MAX_CACHE_AGE_MS - 1 }),
        NOW,
      ),
    ).toBe(false);
  });

  it('ignores a missing snapshot', () => {
    expect(shouldRestoreSnapshot(undefined, NOW)).toBe(false);
  });
});

describe('cache persistence', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves the cache after changes (debounced) and restores it into a fresh cache', async () => {
    vi.useFakeTimers();
    const store = memoryCacheStore();
    const cache = new ObservableInMemoryCache();
    const stop = persistCache(cache, {
      store,
      getUserId: () => 'user-1',
      debounceMs: 1000,
      now: () => NOW,
    });

    writeGame(cache, 'Rough');
    writeGame(cache, 'Final');
    expect(await store.read()).toBeUndefined(); // still debouncing
    await vi.advanceTimersByTimeAsync(1000);
    stop();

    const fresh = new ObservableInMemoryCache();
    const restored = await restoreCache(fresh, { store, now: () => NOW });

    expect(restored?.userId).toBe('user-1');
    expect(fresh.readQuery({ query: GAME })).toEqual({
      game: { __typename: 'Game', id: 'g1', name: 'Final' },
    });
  });

  it('does not save while nobody is signed in', async () => {
    vi.useFakeTimers();
    const store = memoryCacheStore();
    const cache = new ObservableInMemoryCache();
    persistCache(cache, { store, getUserId: () => null, debounceMs: 10 });

    writeGame(cache, 'Final');
    await vi.advanceTimersByTimeAsync(10);

    expect(await store.read()).toBeUndefined();
  });

  it('saves immediately when the app goes to the background', async () => {
    const store = memoryCacheStore();
    const cache = new ObservableInMemoryCache();
    const stop = persistCache(cache, {
      store,
      getUserId: () => 'user-1',
      debounceMs: 60_000,
    });
    writeGame(cache, 'Final');

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(async () => expect(await store.read()).toBeDefined());

    stop();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });

  it('stops saving after stop()', async () => {
    vi.useFakeTimers();
    const store = memoryCacheStore();
    const cache = new ObservableInMemoryCache();
    const stop = persistCache(cache, {
      store,
      getUserId: () => 'user-1',
      debounceMs: 10,
    });

    stop();
    writeGame(cache, 'Final');
    await vi.advanceTimersByTimeAsync(10);

    expect(await store.read()).toBeUndefined();
  });

  it('does not restore an expired snapshot', async () => {
    const store = memoryCacheStore();
    await store.write(snapshot({ savedAt: NOW - MAX_CACHE_AGE_MS - 1 }));
    const cache = new ObservableInMemoryCache();

    expect(
      await restoreCache(cache, { store, now: () => NOW }),
    ).toBeUndefined();
  });

  it('clears the saved cache', async () => {
    const store = memoryCacheStore();
    await store.write(snapshot());

    await clearPersistedCache(store);

    expect(await store.read()).toBeUndefined();
  });

  it('round-trips through IndexedDB', async () => {
    const store = indexedDbCacheStore('test-cache-roundtrip');
    await store.write(
      snapshot({ data: { ROOT_QUERY: { __typename: 'Query' } } }),
    );

    expect(
      await indexedDbCacheStore('test-cache-roundtrip').read(),
    ).toMatchObject({ userId: 'user-1' });
  });
});

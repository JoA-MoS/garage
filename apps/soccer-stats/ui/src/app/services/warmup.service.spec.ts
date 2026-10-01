import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  registerWarmupOnWake,
  resetWarmupThrottleForTests,
  warmUpApi,
} from './warmup.service';

describe('Warmup service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_API_URL', '');
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    resetWarmupThrottleForTests();
    global.fetch = vi.fn(() => Promise.resolve({ ok: true } as Response));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('warmUpApi', () => {
    it('calls the warmup endpoint', () => {
      warmUpApi();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('/api/warmup');
    });

    it('throttles a second call within 60 seconds', () => {
      warmUpApi();
      vi.advanceTimersByTime(59_000);
      warmUpApi();

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('calls again after 60 seconds', () => {
      warmUpApi();
      vi.advanceTimersByTime(60_000);
      warmUpApi();

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('never throws when fetch rejects', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('network down')));

      expect(() => warmUpApi()).not.toThrow();
      await vi.advanceTimersByTimeAsync(0);
    });

    it('never throws when fetch throws synchronously', () => {
      global.fetch = vi.fn(() => {
        throw new Error('boom');
      });

      expect(() => warmUpApi()).not.toThrow();
    });
  });

  describe('registerWarmupOnWake', () => {
    const setVisibility = (state: DocumentVisibilityState) => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
      });
    };

    afterEach(() => {
      setVisibility('visible');
    });

    it('warms up when the document becomes visible', () => {
      const cleanup = registerWarmupOnWake();

      setVisibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));

      expect(fetch).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('does not warm up when the document becomes hidden', () => {
      const cleanup = registerWarmupOnWake();

      setVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));

      expect(fetch).not.toHaveBeenCalled();
      cleanup();
    });

    it('warms up when the browser comes back online', () => {
      const cleanup = registerWarmupOnWake();

      window.dispatchEvent(new Event('online'));

      expect(fetch).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('removes listeners on cleanup', () => {
      const cleanup = registerWarmupOnWake();
      cleanup();

      setVisibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('online'));

      expect(fetch).not.toHaveBeenCalled();
    });
  });
});

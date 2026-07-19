import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerServiceWorker } from './register-service-worker';

describe('registerServiceWorker', () => {
  const originalServiceWorker = navigator.serviceWorker;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    console.error = vi.fn();

    if (originalServiceWorker === undefined) {
      Reflect.deleteProperty(navigator, 'serviceWorker');
    } else {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: originalServiceWorker,
      });
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    console.error = originalConsoleError;

    if (originalServiceWorker === undefined) {
      Reflect.deleteProperty(navigator, 'serviceWorker');
    } else {
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: originalServiceWorker,
      });
    }
  });

  it('does not register outside production builds', () => {
    const register = vi.fn();
    vi.stubEnv('PROD', false);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    registerServiceWorker();
    window.dispatchEvent(new Event('load'));

    expect(register).not.toHaveBeenCalled();
  });

  it('safely no-ops when service workers are not supported', () => {
    vi.stubEnv('PROD', true);
    Reflect.deleteProperty(navigator, 'serviceWorker');

    expect(() => registerServiceWorker()).not.toThrow();
  });

  it('registers the service worker on window load in production builds', () => {
    const register = vi.fn().mockResolvedValue(undefined);
    vi.stubEnv('PROD', true);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    registerServiceWorker();
    window.dispatchEvent(new Event('load'));

    expect(register).toHaveBeenCalledWith('/sw.js');
  });
});

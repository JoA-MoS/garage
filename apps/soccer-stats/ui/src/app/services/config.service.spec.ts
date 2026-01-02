import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchPublicConfig } from './config.service';

// Store original window.location for restoration
const originalLocation = window.location;

describe('Config Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.restoreAllMocks();
    // Clear import.meta.env
    vi.stubEnv('VITE_API_URL', '');
  });

  afterEach(() => {
    // Restore original window.location after each test
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('should fetch configuration from the API using relative URL', async () => {
    const mockConfig = {
      clerkPublishableKey: 'pk_test_12345',
    };

    // Mock the fetch function
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      } as Response)
    );

    const config = await fetchPublicConfig();

    expect(config).toEqual(mockConfig);
    // Uses relative URL so requests go through Vite proxy in dev / Vercel rewrites in prod
    expect(fetch).toHaveBeenCalledWith('/api/config/public');
  });

  it('should use VITE_API_URL when set', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com');

    const mockConfig = {
      clerkPublishableKey: 'pk_test_12345',
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      } as Response)
    );

    await fetchPublicConfig();

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/config/public'
    );
  });

  it('should throw error when fetch fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
    );

    await expect(fetchPublicConfig()).rejects.toThrow(
      'Configuration fetch failed: Failed to fetch configuration: 500 Internal Server Error'
    );
  });

  it('should throw error when clerkPublishableKey is missing', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    await expect(fetchPublicConfig()).rejects.toThrow(
      'Invalid configuration: missing clerkPublishableKey'
    );
  });

  it('should throw error with context when network error occurs', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    await expect(fetchPublicConfig()).rejects.toThrow(
      'Configuration fetch failed: Network error. Make sure the API is running at same origin (via Vite proxy)'
    );
  });

  it('should use Railway URL when running on Vercel deployment', async () => {
    // Mock window.location.host to simulate Vercel deployment
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        host: 'soccer-stats-abc123.vercel.app',
        protocol: 'https:',
      },
      writable: true,
    });

    // Need to re-import to pick up the mocked location
    // Since getApiUrl() checks window.location at call time, we need to reset the module
    vi.resetModules();
    const { fetchPublicConfig: fetchPublicConfigFresh } = await import(
      './config.service'
    );

    const mockConfig = {
      clerkPublishableKey: 'pk_test_12345',
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      } as Response)
    );

    await fetchPublicConfigFresh();

    // Should call Railway URL directly, not relative URL
    expect(fetch).toHaveBeenCalledWith(
      'https://soccer-stats.up.railway.app/api/config/public'
    );
  });

  it('should detect Vercel deployment with different URL patterns', async () => {
    // Test with preview deployment URL pattern
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        host: 'my-project-git-feature-branch.vercel.app',
        protocol: 'https:',
      },
      writable: true,
    });

    vi.resetModules();
    const { fetchPublicConfig: fetchPublicConfigFresh } = await import(
      './config.service'
    );

    const mockConfig = {
      clerkPublishableKey: 'pk_test_12345',
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      } as Response)
    );

    await fetchPublicConfigFresh();

    expect(fetch).toHaveBeenCalledWith(
      'https://soccer-stats.up.railway.app/api/config/public'
    );
  });
});

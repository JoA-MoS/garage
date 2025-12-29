import { describe, it, expect, vi, beforeEach } from 'vitest';

import { fetchPublicConfig } from './config.service';

describe('Config Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.restoreAllMocks();
    // Clear import.meta.env
    vi.stubEnv('VITE_API_URL', '');
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
      } as Response),
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
      } as Response),
    );

    await fetchPublicConfig();

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/config/public',
    );
  });

  it('should throw error when fetch fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response),
    );

    await expect(fetchPublicConfig()).rejects.toThrow(
      'Configuration fetch failed: Failed to fetch configuration: 500 Internal Server Error',
    );
  });

  it('should throw error when clerkPublishableKey is missing', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response),
    );

    await expect(fetchPublicConfig()).rejects.toThrow(
      'Invalid configuration: missing clerkPublishableKey',
    );
  });

  it('should throw error with context when network error occurs', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    await expect(fetchPublicConfig()).rejects.toThrow(
      'Configuration fetch failed: Network error. Make sure the API is running at same origin (via Vercel rewrites)',
    );
  });
});

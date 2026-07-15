import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchApiBuildInfo, getUiBuildInfo } from './build-info.service';

describe('Build info service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('VITE_API_URL', '');
  });

  it('returns UI build metadata embedded at build time', () => {
    expect(getUiBuildInfo()).toMatchObject({
      name: 'soccer-stats-ui',
      version: expect.any(String),
      gitSha: expect.any(String),
      buildTime: expect.any(String),
      environment: expect.any(String),
    });
  });

  it('fetches API build metadata through the same-origin API route', async () => {
    const apiBuildInfo = {
      name: 'soccer-stats-api',
      version: '1.2.3',
      gitSha: 'abc1234',
      buildTime: '2026-07-15T02:22:42.000Z',
      environment: 'production',
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(apiBuildInfo),
      } as Response),
    );

    await expect(fetchApiBuildInfo()).resolves.toEqual(apiBuildInfo);
    expect(fetch).toHaveBeenCalledWith('/api/version');
  });

  it('fetches API build metadata from VITE_API_URL when configured', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com');
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response),
    );

    await fetchApiBuildInfo();

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/api/version');
  });
});

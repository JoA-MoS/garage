import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsPage } from './settings.page';

vi.mock('../services/build-info.service', async () => {
  const actual = await vi.importActual<
    typeof import('../services/build-info.service')
  >('../services/build-info.service');

  return {
    ...actual,
    getUiBuildInfo: () => ({
      name: 'soccer-stats-ui',
      version: '0.0.0',
      gitSha: 'ui12345',
      buildTime: '2026-07-15T02:22:42.000Z',
      environment: 'production',
    }),
    fetchApiBuildInfo: vi.fn().mockResolvedValue({
      name: 'soccer-stats-api',
      version: '0.0.1',
      gitSha: 'api12345',
      buildTime: '2026-07-15T02:18:42.000Z',
      environment: 'production',
    }),
  };
});

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows UI and API build information', async () => {
    render(<SettingsPage />);

    expect(screen.getByText('Build Info')).toBeTruthy();
    expect(screen.getByText('UI')).toBeTruthy();
    expect(screen.getByText('0.0.0')).toBeTruthy();
    expect(screen.getByText('ui12345')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('API')).toBeTruthy();
      expect(screen.getByText('0.0.1')).toBeTruthy();
      expect(screen.getByText('api12345')).toBeTruthy();
    });
  });

  it('uses touch-friendly targets for settings controls', async () => {
    render(<SettingsPage />);

    for (const select of screen.getAllByRole('combobox')) {
      expect(select.className).toContain('min-h-[44px]');
      expect(select.className).toContain('min-w-[44px]');
    }

    expect(
      screen.getByRole('button', { name: 'Export Game Data' }).className,
    ).toContain('min-h-[44px]');
    expect(
      screen.getByRole('button', { name: 'Clear All Data' }).className,
    ).toContain('min-h-[44px]');

    await waitFor(() => {
      expect(screen.getByText('api12345')).toBeTruthy();
    });
  });
});

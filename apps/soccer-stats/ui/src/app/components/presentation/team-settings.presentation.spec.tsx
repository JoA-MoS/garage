import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UITeam } from '../types/ui.types';

import { TeamSettingsPresentation } from './team-settings.presentation';

const team: UITeam = {
  id: 'team-1',
  name: 'Mountain Lions',
  shortName: 'Lions',
  description: '',
  homePrimaryColor: '#2563eb',
  homeSecondaryColor: '#ffffff',
  awayPrimaryColor: '#ffffff',
  awaySecondaryColor: '#2563eb',
  logoUrl: '',
  isActive: true,
  isManaged: true,
  sourceType: 'INTERNAL',
};

const baseProps = {
  team,
  selectedGameFormat: '7v7',
  selectedFormation: '2-3-1',
  statsFeatures: {
    trackGoals: true,
    trackScorer: true,
    trackAssists: true,
    trackSubstitutions: true,
    trackPositions: true,
  },
  playerNameDisplay: {
    format: 'FIRST_LAST' as const,
    showJerseyNumber: true,
    jerseyNumberPosition: 'BEFORE' as const,
  },
  gameFormats: [],
  formations: [],
  positions: [],
  calendarSources: [],
  calendarSourcesLoading: false,
  creatingCalendarSource: false,
  syncingCalendarSource: false,
  onCreateCalendarSource: vi.fn(),
  onSyncCalendarSource: vi.fn(),
  onSaveSettings: vi.fn(),
  onGameFormatSelect: vi.fn(),
  onFormationSelect: vi.fn(),
  onStatsFeaturesChange: vi.fn(),
  onPlayerNameDisplayChange: vi.fn(),
  onPositionUpdate: vi.fn(),
  onAddPosition: vi.fn(),
  onRemovePosition: vi.fn(),
  loading: false,
};

describe('TeamSettingsPresentation calendar import', () => {
  it('renders an empty-state calendar import form', () => {
    render(<TeamSettingsPresentation {...baseProps} />);

    expect(screen.getByText('Calendar Import')).toBeTruthy();
    expect(screen.getByLabelText('Calendar feed URL')).toBeTruthy();
    expect(screen.getByText('No calendar feeds connected yet')).toBeTruthy();
  });

  it('submits a trimmed ICS feed URL', () => {
    const onCreateCalendarSource = vi.fn();
    render(
      <TeamSettingsPresentation
        {...baseProps}
        onCreateCalendarSource={onCreateCalendarSource}
      />,
    );

    fireEvent.change(screen.getByLabelText('Calendar feed URL'), {
      target: {
        value:
          '  https://calendar.playmetrics.com/calendars/team/games-calendar.ics  ',
      },
    });
    fireEvent.click(screen.getByText('Connect Feed'));

    expect(onCreateCalendarSource).toHaveBeenCalledWith(
      'https://calendar.playmetrics.com/calendars/team/games-calendar.ics',
    );
  });

  it('renders connected feeds and syncs a selected source', () => {
    const onSyncCalendarSource = vi.fn();
    render(
      <TeamSettingsPresentation
        {...baseProps}
        calendarSources={[
          {
            id: 'source-1',
            teamId: 'team-1',
            provider: 'PLAYMETRICS',
            feedUrl:
              'https://calendar.playmetrics.com/calendars/team/games-calendar.ics',
            calendarName: 'Mountain Lions Games',
            enabled: true,
            lastSyncedAt: '2026-07-18T12:00:00.000Z',
            lastSyncStatus: 'SUCCESS',
          },
        ]}
        onSyncCalendarSource={onSyncCalendarSource}
      />,
    );

    expect(screen.getByText('Mountain Lions Games')).toBeTruthy();
    expect(screen.getByText('Enabled')).toBeTruthy();
    expect(screen.getByText('Success')).toBeTruthy();

    fireEvent.click(screen.getByText('Sync Now'));
    expect(onSyncCalendarSource).toHaveBeenCalledWith('source-1');
  });
});

describe('TeamSettingsPresentation player display', () => {
  it('shows the jersey number position toggle only when jersey numbers are shown', () => {
    const { rerender } = render(<TeamSettingsPresentation {...baseProps} />);

    expect(
      screen.getByRole('radiogroup', { name: 'Jersey number position' }),
    ).toBeTruthy();

    rerender(
      <TeamSettingsPresentation
        {...baseProps}
        playerNameDisplay={{
          ...baseProps.playerNameDisplay,
          showJerseyNumber: false,
        }}
      />,
    );

    expect(
      screen.queryByRole('radiogroup', { name: 'Jersey number position' }),
    ).toBeNull();
  });

  it('reports a name format change', () => {
    const onPlayerNameDisplayChange = vi.fn();
    render(
      <TeamSettingsPresentation
        {...baseProps}
        onPlayerNameDisplayChange={onPlayerNameDisplayChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Name format'), {
      target: { value: 'LAST_COMMA_FIRST' },
    });

    expect(onPlayerNameDisplayChange).toHaveBeenCalledWith({
      ...baseProps.playerNameDisplay,
      format: 'LAST_COMMA_FIRST',
    });
  });

  it('reports a jersey number position change', () => {
    const onPlayerNameDisplayChange = vi.fn();
    render(
      <TeamSettingsPresentation
        {...baseProps}
        onPlayerNameDisplayChange={onPlayerNameDisplayChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('After name'));

    expect(onPlayerNameDisplayChange).toHaveBeenCalledWith({
      ...baseProps.playerNameDisplay,
      jerseyNumberPosition: 'AFTER',
    });
  });

  it('includes player name display in the saved settings payload', () => {
    const onSaveSettings = vi.fn();
    render(
      <TeamSettingsPresentation
        {...baseProps}
        onSaveSettings={onSaveSettings}
      />,
    );

    fireEvent.click(screen.getByText('Save Team Settings'));

    expect(onSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        playerNameDisplay: baseProps.playerNameDisplay,
      }),
    );
  });
});

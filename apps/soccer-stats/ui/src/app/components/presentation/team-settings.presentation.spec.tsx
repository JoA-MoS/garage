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
  onPositionUpdate: vi.fn(),
  onAddPosition: vi.fn(),
  onRemovePosition: vi.fn(),
  loading: false,
};

describe('TeamSettingsPresentation calendar import', () => {
  it('renders an empty-state calendar import form', () => {
    render(<TeamSettingsPresentation {...baseProps} />);

    expect(screen.getByText('Calendar Import')).toBeTruthy();
    expect(screen.getByLabelText('PlayMetrics calendar URL')).toBeTruthy();
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

    fireEvent.change(screen.getByLabelText('PlayMetrics calendar URL'), {
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

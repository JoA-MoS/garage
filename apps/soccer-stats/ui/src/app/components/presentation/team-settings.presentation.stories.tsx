import { UITeam } from '../types/ui.types';

import { TeamSettingsPresentation } from './team-settings.presentation';

const meta = {
  title: 'Components/Presentation/TeamSettings',
  component: TeamSettingsPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

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

const baseArgs = {
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
  onCreateCalendarSource: () => undefined,
  onSyncCalendarSource: () => undefined,
  onSaveSettings: () => undefined,
  onGameFormatSelect: () => undefined,
  onFormationSelect: () => undefined,
  onStatsFeaturesChange: () => undefined,
  onPlayerNameDisplayChange: () => undefined,
  onPositionUpdate: () => undefined,
  onAddPosition: () => undefined,
  onRemovePosition: () => undefined,
  loading: false,
};

export const Default = {
  args: baseArgs,
};

export const LastCommaFirstNoJerseyNumber = {
  args: {
    ...baseArgs,
    playerNameDisplay: {
      format: 'LAST_COMMA_FIRST' as const,
      showJerseyNumber: false,
      jerseyNumberPosition: 'BEFORE' as const,
    },
  },
};

import { SubstitutionPanelPresentation } from './substitution-panel.presentation';
import { PanelState } from './types';

const meta = {
  title: 'Components/Smart/SubstitutionPanel',
  component: SubstitutionPanelPresentation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

const mockPlayer = (
  id: string,
  name: string,
  number: string,
  position = 'MID',
) => ({
  gameEventId: `event-${id}`,
  playerId: id,
  playerName: name,
  firstName: name.split(' ')[0],
  lastName: name.split(' ')[1] || '',
  externalPlayerName: null,
  externalPlayerNumber: number,
  position,
});

const benchPlayers = [
  mockPlayer('4', 'Jimmy Brown', '12'),
  mockPlayer('5', 'Taylor White', '9'),
];

const noop = () => {
  /* storybook display only */
};

/**
 * Static snapshot - the panel is bench-only; on-field player selection lives
 * in the Lineup tab's card grid instead. Bench players use the shared
 * PlayerCard component with static banked time (no live pulse).
 */
export const Static = {
  args: {
    panelState: 'bench-view' as PanelState,
    onPanelStateChange: noop,
    teamName: 'Thunder FC',
    teamColor: '#3B82F6',
    benchPlayers,
    playTimeByPlayer: new Map([
      ['4', { totalSeconds: 300, isOnField: false }],
      ['5', { totalSeconds: 0, isOnField: false }],
    ]),
    selection: { direction: null, fieldPlayer: null, benchPlayer: null },
    onBenchPlayerClick: noop,
    onClearSelection: noop,
    queue: [],
    onRemoveFromQueue: noop,
    onConfirmAll: noop,
    onRequestRemoval: noop,
    isExecuting: false,
    executionProgress: 0,
    error: null,
    period: '1',
    periodSecond: 915,
  },
};

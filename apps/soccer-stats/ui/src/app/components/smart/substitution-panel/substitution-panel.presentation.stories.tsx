import { useEffect, useState } from 'react';

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

const onFieldPlayers = [
  mockPlayer('1', 'Sarah Smith', '7', 'FWD'),
  mockPlayer('2', 'Alex Jones', '10', 'MID'),
  mockPlayer('3', 'Riley Chen', '4', 'DEF'),
];

const benchPlayers = [
  mockPlayer('4', 'Jimmy Brown', '12'),
  mockPlayer('5', 'Taylor White', '9'),
];

const noop = () => {
  /* storybook display only */
};

/**
 * Static snapshot - Bench and On Field tabs share one PlayerCard component.
 * On-field players show a live-style MM:SS + pulse dot; bench players show
 * static banked time.
 */
export const Static = {
  args: {
    panelState: 'bench-view' as PanelState,
    onPanelStateChange: noop,
    teamName: 'Thunder FC',
    teamColor: '#3B82F6',
    onFieldPlayers,
    benchPlayers,
    playTimeByPlayer: new Map([
      ['1', { totalSeconds: 915, isOnField: true }],
      ['2', { totalSeconds: 630, isOnField: true }],
      ['3', { totalSeconds: 1345, isOnField: true }],
      ['4', { totalSeconds: 300, isOnField: false }],
      ['5', { totalSeconds: 0, isOnField: false }],
    ]),
    selection: { direction: null, fieldPlayer: null, benchPlayer: null },
    onFieldPlayerClick: noop,
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

/**
 * Live ticking - a thin wrapper advances periodSecond every second, the same
 * way useSyncedGameTime does in the real app, so the on-field cards' MM:SS
 * and pulse dot can be watched updating in real time.
 */
function LiveTickingStory() {
  const [periodSecond, setPeriodSecond] = useState(900);

  useEffect(() => {
    const interval = setInterval(() => {
      setPeriodSecond((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const onFieldStart: Record<string, number> = {
    '1': 0, // on field since kickoff
    '2': 600, // subbed on at 10:00
  };

  const playTimeByPlayer = new Map([
    ...Object.entries(onFieldStart).map(([id, startSecond]) => {
      const totalSeconds = periodSecond - startSecond;
      return [id, { totalSeconds, isOnField: true }] as const;
    }),
    ['3', { totalSeconds: 300, isOnField: false }] as const,
    ['4', { totalSeconds: 0, isOnField: false }] as const,
  ]);

  return (
    <SubstitutionPanelPresentation
      panelState={'bench-view' as PanelState}
      onPanelStateChange={noop}
      teamName="Thunder FC"
      teamColor="#3B82F6"
      onFieldPlayers={onFieldPlayers.slice(0, 2)}
      benchPlayers={[...benchPlayers, onFieldPlayers[2]]}
      playTimeByPlayer={playTimeByPlayer}
      selection={{ direction: null, fieldPlayer: null, benchPlayer: null }}
      onFieldPlayerClick={noop}
      onBenchPlayerClick={noop}
      onClearSelection={noop}
      queue={[]}
      onRemoveFromQueue={noop}
      onConfirmAll={noop}
      onRequestRemoval={noop}
      isExecuting={false}
      executionProgress={0}
      error={null}
      period="1"
      periodSecond={periodSecond}
    />
  );
}

export const LiveTicking = {
  render: () => <LiveTickingStory />,
};

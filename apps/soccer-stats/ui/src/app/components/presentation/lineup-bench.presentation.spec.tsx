import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  JerseyNumberPosition,
  PlayerNameDisplayFormat,
  RosterPlayer as GqlRosterPlayer,
} from '@garage/soccer-stats/graphql-codegen';

import { PlayerNameDisplayProvider } from '../../context/player-name-display.context';
import { RosterPlayer } from '../../hooks/use-lineup';

import { LineupBench } from './lineup-bench.presentation';

const benchPlayer = (
  overrides: Partial<GqlRosterPlayer> = {},
): GqlRosterPlayer =>
  ({
    gameEventId: 'evt-1',
    firstName: 'Sarah',
    lastName: 'Smith',
    ...overrides,
  }) as GqlRosterPlayer;

const rosterPlayer = (overrides: Partial<RosterPlayer> = {}): RosterPlayer => ({
  id: 'player-1',
  oduserId: 'user-1',
  firstName: 'Sarah',
  lastName: 'Smith',
  ...overrides,
});

describe('LineupBench', () => {
  it('formats bench player names per the team display format', () => {
    render(
      <PlayerNameDisplayProvider
        config={{
          format: PlayerNameDisplayFormat.LastCommaFirst,
          showJerseyNumber: true,
          jerseyNumberPosition: JerseyNumberPosition.Before,
        }}
      >
        <LineupBench
          bench={[benchPlayer()]}
          availableRoster={[]}
          onBenchPlayerClick={vi.fn()}
        />
      </PlayerNameDisplayProvider>,
    );

    expect(screen.getByText('Smith, Sarah')).toBeTruthy();
  });

  it('formats available roster player names per the team display format', () => {
    render(
      <PlayerNameDisplayProvider
        config={{
          format: PlayerNameDisplayFormat.FirstinitialLast,
          showJerseyNumber: true,
          jerseyNumberPosition: JerseyNumberPosition.Before,
        }}
      >
        <LineupBench
          bench={[]}
          availableRoster={[rosterPlayer()]}
          onRosterPlayerClick={vi.fn()}
        />
      </PlayerNameDisplayProvider>,
    );

    expect(screen.getByText('S. Smith')).toBeTruthy();
  });

  it('defaults to First Last when rendered without a provider', () => {
    render(
      <LineupBench
        bench={[benchPlayer()]}
        availableRoster={[]}
        onBenchPlayerClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Sarah Smith')).toBeTruthy();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  JerseyNumberPosition,
  PlayerNameDisplayFormat,
  RosterPlayer as GqlRosterPlayer,
} from '@garage/soccer-stats/graphql-codegen';

import { PlayerNameDisplayProvider } from '../../context/player-name-display.context';
import type { Formation } from '../../constants/positions';

import { FieldLineup } from './field-lineup.presentation';

const oneStForward: Formation = {
  name: 'Test',
  code: 'TEST',
  playersPerTeam: 1,
  positions: [{ position: 'ST', x: 50, y: 80 }],
};

const player = (overrides: Partial<GqlRosterPlayer> = {}): GqlRosterPlayer =>
  ({
    gameEventId: 'evt-1',
    playerId: 'player-1',
    position: 'ST',
    firstName: 'Sarah',
    lastName: 'Smith',
    ...overrides,
  }) as GqlRosterPlayer;

describe('FieldLineup', () => {
  it('formats the assigned player label per the team display format', () => {
    render(
      <PlayerNameDisplayProvider
        config={{
          format: PlayerNameDisplayFormat.LastCommaFirst,
          showJerseyNumber: true,
          jerseyNumberPosition: JerseyNumberPosition.Before,
        }}
      >
        <FieldLineup formation={oneStForward} lineup={[player()]} />
      </PlayerNameDisplayProvider>,
    );

    expect(screen.getByText('Smith, Sarah')).toBeTruthy();
  });

  it('defaults to First Last when rendered without a provider', () => {
    render(<FieldLineup formation={oneStForward} lineup={[player()]} />);

    expect(screen.getByText('Sarah Smith')).toBeTruthy();
  });

  it('still shows initials in the marker regardless of name format', () => {
    render(
      <PlayerNameDisplayProvider
        config={{
          format: PlayerNameDisplayFormat.LastName,
          showJerseyNumber: true,
          jerseyNumberPosition: JerseyNumberPosition.Before,
        }}
      >
        <FieldLineup formation={oneStForward} lineup={[player()]} />
      </PlayerNameDisplayProvider>,
    );

    expect(screen.getByText('SS')).toBeTruthy();
    expect(screen.getByText('Smith')).toBeTruthy();
  });
});

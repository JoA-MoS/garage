import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { LineupPanel } from './lineup-panel.smart';
import { LineupPanelSmartProps } from './types';

// Mock the lineup hook - the smart component's only mutation surface
const hookMocks = vi.hoisted(() => ({
  addPlayerToGameRoster: vi.fn(),
  updatePosition: vi.fn(),
  removeFromLineup: vi.fn(),
  setSecondHalfLineup: vi.fn(),
  refetchRoster: vi.fn(),
  availableRoster: [] as unknown[],
}));
const mockAddPlayerToGameRoster = hookMocks.addPlayerToGameRoster;
const mockUpdatePosition = hookMocks.updatePosition;

vi.mock('../../../hooks/use-lineup', () => ({
  useLineup: () => ({
    addPlayerToGameRoster: hookMocks.addPlayerToGameRoster,
    updatePosition: hookMocks.updatePosition,
    removeFromLineup: hookMocks.removeFromLineup,
    setSecondHalfLineup: hookMocks.setSecondHalfLineup,
    refetchRoster: hookMocks.refetchRoster,
    availableRoster: hookMocks.availableRoster,
  }),
}));

const fieldPlayer = (
  id: string,
  name: string,
  position: string,
): GqlRosterPlayer =>
  ({
    gameEventId: `event-${id}`,
    playerId: id,
    playerName: name,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1] || '',
    externalPlayerName: null,
    externalPlayerNumber: null,
    position,
  }) as GqlRosterPlayer;

const benchPlayer = (id: string, name: string): GqlRosterPlayer =>
  ({
    gameEventId: `event-${id}`,
    playerId: id,
    playerName: name,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1] || '',
    externalPlayerName: null,
    externalPlayerNumber: null,
    position: null,
  }) as GqlRosterPlayer;

const createProps = (
  overrides?: Partial<LineupPanelSmartProps>,
): LineupPanelSmartProps => ({
  gameId: 'game-1',
  gameTeamId: 'game-team-1',
  gameStatus: 'SCHEDULED',
  teamName: 'Home Team',
  teamColor: '#3B82F6',
  playersPerTeam: 7,
  formation: '2-3-1',
  onField: [fieldPlayer('a', 'Sarah Smith', 'ST')],
  bench: [benchPlayer('b', 'Jimmy Brown')],
  ...overrides,
});

/**
 * Harness mirroring the real parent contract for field clicks: the field
 * player selection is state that onExternalFieldPlayerHandled clears —
 * without the clear the panel would re-handle the click on every render.
 */
function FieldClickHarness(props: LineupPanelSmartProps) {
  const [fieldSelection, setFieldSelection] = useState<GqlRosterPlayer | null>(
    null,
  );

  return (
    <>
      <LineupPanel
        {...props}
        externalFieldPlayerSelection={fieldSelection}
        onExternalFieldPlayerHandled={() => setFieldSelection(null)}
      />
      <button
        data-testid="tap-field-player"
        onClick={() => setFieldSelection(props.onField[0])}
        type="button"
      >
        tap field player
      </button>
    </>
  );
}

describe('LineupPanel pre-game replace flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddPlayerToGameRoster.mockResolvedValue({});
    mockUpdatePosition.mockResolvedValue({});
    hookMocks.removeFromLineup.mockResolvedValue({});
  });

  it('benches the replaced player before assigning a bench player to their position', async () => {
    const props = createProps();
    render(<FieldClickHarness {...props} />);

    // Expand the collapsed panel, then the bench section (collapsed pre-game)
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByText(/Bench \(1\)/));

    // Select the bench player (player-first flow)
    fireEvent.click(screen.getByText('Jimmy Brown'));

    // Tap the occupied field position (delegated via external field click)
    fireEvent.click(screen.getByTestId('tap-field-player'));

    await waitFor(() => {
      // Incoming bench player takes the position...
      expect(mockUpdatePosition).toHaveBeenCalledWith('event-b', 'ST');
      // ...and the outgoing player is demoted to the bench, not left in place
      expect(mockUpdatePosition).toHaveBeenCalledWith('event-a', null);
    });

    // Demotion must happen first so the position is free when the incoming
    // player is assigned (the API enforces slot capacity)
    const demoteOrder = mockUpdatePosition.mock.calls.findIndex(
      ([, position]) => position === null,
    );
    const assignOrder = mockUpdatePosition.mock.calls.findIndex(
      ([, position]) => position === 'ST',
    );
    expect(demoteOrder).toBeGreaterThanOrEqual(0);
    expect(demoteOrder).toBeLessThan(assignOrder);
  });

  it('benches the replaced player before adding a team-roster player at their position', async () => {
    hookMocks.availableRoster = [
      {
        id: 'tp-c',
        oduserId: 'c',
        firstName: 'Taylor',
        lastName: 'White',
        jerseyNumber: '9',
        primaryPosition: null,
        email: null,
      },
    ];
    const props = createProps();
    render(<FieldClickHarness {...props} />);

    fireEvent.click(screen.getAllByRole('button')[0]);

    // Select the team-roster player (player-first flow, source 'roster')
    fireEvent.click(screen.getByText(/Taylor White/));

    // Tap the occupied field position
    fireEvent.click(screen.getByTestId('tap-field-player'));

    await waitFor(() => {
      expect(mockAddPlayerToGameRoster).toHaveBeenCalledWith(
        expect.objectContaining({ playerId: 'c', position: 'ST' }),
      );
      expect(mockUpdatePosition).toHaveBeenCalledWith('event-a', null);
    });

    // Demotion must precede the roster addition
    expect(mockUpdatePosition.mock.invocationCallOrder[0]).toBeLessThan(
      mockAddPlayerToGameRoster.mock.invocationCallOrder[0],
    );

    hookMocks.availableRoster = [];
  });
});

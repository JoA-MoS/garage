import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { TeamGamesSmart } from './team-games.smart';
import { GameCardData } from './game-card.smart';
import { GameFormatSelectData } from './game-format-select.smart';

// Mock Apollo Client's useMutation, differentiating by operation name so
// create-game, delete-game, and update-game mutations can be asserted independently.
const mockCreateGame = vi.fn();
const mockRemoveGame = vi.fn();
const mockUpdateGame = vi.fn();
let removeGameOptions: {
  onCompleted?: () => void;
  onError?: (e: Error) => void;
};
let removeGameLoading = false;
let updateGameOptions: {
  onCompleted?: () => void;
  onError?: (e: Error) => void;
};
let updateGameLoading = false;

vi.mock('@apollo/client/react', () => ({
  useMutation: (doc: any, options?: any) => {
    const opName = doc?.definitions?.[0]?.name?.value;
    if (opName === 'RemoveGame') {
      removeGameOptions = options;
      return [mockRemoveGame, { loading: removeGameLoading }];
    }
    if (opName === 'UpdateGame') {
      updateGameOptions = options;
      return [mockUpdateGame, { loading: updateGameLoading }];
    }
    return [mockCreateGame, { loading: false }];
  },
}));

const gameTeams = [
  {
    id: 'gt-1',
    teamType: 'home',
    finalScore: null,
    game: {
      id: 'game-1',
      name: 'vs Riverside FC',
      status: 'SCHEDULED',
      scheduledStart: '2026-09-13T16:00:00.000Z',
      venue: 'Home Field',
      createdAt: '2026-09-01T00:00:00.000Z',
      format: {
        id: 'format-1',
        name: '7v7',
        playersPerTeam: 7,
        durationMinutes: 60,
      },
      teams: [
        {
          id: 'gt-1',
          teamType: 'home',
          finalScore: null,
          team: { id: 'team-1', name: 'Mountain Lions', shortName: 'Lions' },
        },
        {
          id: 'gt-2',
          teamType: 'away',
          finalScore: null,
          team: { id: 'team-2', name: 'Riverside FC', shortName: 'Riverside' },
        },
      ],
    },
  },
] as unknown as GameCardData[];

const gameFormats = [
  { id: 'format-1', name: '7v7', playersPerTeam: 7, durationMinutes: 60 },
  { id: 'format-2', name: '11v11', playersPerTeam: 11, durationMinutes: 90 },
] as unknown as GameFormatSelectData[];

const renderSmart = (overrides?: {
  onGameDeleted?: () => void;
  onGameUpdated?: () => void;
}) =>
  render(
    <MemoryRouter>
      <TeamGamesSmart
        teamId="team-1"
        gameTeams={gameTeams}
        opponents={[]}
        gameFormats={gameFormats}
        loading={false}
        modalLoading={false}
        onOpenModal={vi.fn()}
        onGameCreated={vi.fn()}
        onGameDeleted={overrides?.onGameDeleted ?? vi.fn()}
        onGameUpdated={overrides?.onGameUpdated ?? vi.fn()}
      />
    </MemoryRouter>,
  );

describe('TeamGamesSmart delete game', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    removeGameLoading = false;
  });

  it('opens the confirmation modal when delete is requested', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Delete game vs Riverside FC'));

    expect(screen.getByText('Delete this game?')).toBeTruthy();
    expect(mockRemoveGame).not.toHaveBeenCalled();
  });

  it('dismisses the modal on cancel without calling the mutation', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Delete game vs Riverside FC'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Delete this game?')).toBeNull();
    expect(mockRemoveGame).not.toHaveBeenCalled();
  });

  it('calls removeGame with the targeted game id on confirm', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Delete game vs Riverside FC'));
    fireEvent.click(screen.getByText('Delete game'));

    expect(mockRemoveGame).toHaveBeenCalledWith({
      variables: { id: 'game-1' },
    });
  });

  it('closes the modal and notifies the parent when the delete completes', () => {
    const onGameDeleted = vi.fn();
    renderSmart({ onGameDeleted });

    fireEvent.click(screen.getByLabelText('Delete game vs Riverside FC'));

    // Simulate Apollo invoking the onCompleted callback after the mutation resolves
    act(() => {
      removeGameOptions.onCompleted?.();
    });

    expect(onGameDeleted).toHaveBeenCalled();
  });

  it('shows an error message when the delete mutation fails', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Delete game vs Riverside FC'));
    act(() => {
      removeGameOptions.onError?.(new Error('Network error'));
    });

    expect(screen.getByText('Network error')).toBeTruthy();
  });
});

describe('TeamGamesSmart edit game format', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateGameLoading = false;
  });

  it('opens the edit modal prefilled with the game current format', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Edit game format vs Riverside FC'));

    const modal = screen.getByRole('dialog', { name: 'Edit Game Format' });
    const formatSelect = screen.getByLabelText(
      'Game Format',
    ) as HTMLSelectElement;
    expect(formatSelect.value).toBe('format-1');
    expect(modal).toBeTruthy();
    expect(mockUpdateGame).not.toHaveBeenCalled();
  });

  it('dismisses the edit modal on cancel without calling the mutation', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Edit game format vs Riverside FC'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Edit Game Format')).toBeNull();
    expect(mockUpdateGame).not.toHaveBeenCalled();
  });

  it('calls updateGame with the selected format and duration on save', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Edit game format vs Riverside FC'));
    fireEvent.change(screen.getByLabelText('Game Format'), {
      target: { value: 'format-2' },
    });
    fireEvent.click(screen.getByText('Save'));

    expect(mockUpdateGame).toHaveBeenCalledWith({
      variables: {
        id: 'game-1',
        updateGameInput: {
          gameFormatId: 'format-2',
          duration: 60,
        },
      },
    });
  });

  it('closes the modal and notifies the parent when the update completes', () => {
    const onGameUpdated = vi.fn();
    renderSmart({ onGameUpdated });

    fireEvent.click(screen.getByLabelText('Edit game format vs Riverside FC'));

    act(() => {
      updateGameOptions.onCompleted?.();
    });

    expect(screen.queryByText('Edit Game Format')).toBeNull();
    expect(onGameUpdated).toHaveBeenCalled();
  });

  it('shows an error message when the update mutation fails', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Edit game format vs Riverside FC'));
    act(() => {
      updateGameOptions.onError?.(new Error('Network error'));
    });

    expect(screen.getByText('Network error')).toBeTruthy();
  });
});

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TeamGamesPresentation } from './team-games.presentation';

const game = {
  id: 'game-1',
  name: 'vs Riverside FC',
  status: 'NOT_STARTED',
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
  currentTeamType: 'home',
  currentTeamScore: null,
};

const baseProps = {
  teamId: 'team-1',
  games: [game],
  availableOpponents: [],
  gameFormats: [],
  showCreateForm: false,
  gameForm: {
    opponentTeamId: '',
    gameFormatId: '',
    duration: 90,
    isHome: true,
  },
  loading: false,
  createLoading: false,
  error: null,
  deleteConfirmGameId: null,
  deleteLoading: false,
  deleteError: null,
  onCreateGame: vi.fn(),
  onCancelCreate: vi.fn(),
  onFormChange: vi.fn(),
  onSubmitGame: vi.fn(),
  onViewGame: vi.fn(),
  onRequestDeleteGame: vi.fn(),
  onCancelDeleteGame: vi.fn(),
  onConfirmDeleteGame: vi.fn(),
};

describe('TeamGamesPresentation delete game', () => {
  it('requests delete without navigating to the game', () => {
    const onRequestDeleteGame = vi.fn();
    const onViewGame = vi.fn();
    render(
      <TeamGamesPresentation
        {...baseProps}
        onRequestDeleteGame={onRequestDeleteGame}
        onViewGame={onViewGame}
      />,
    );

    fireEvent.click(screen.getByLabelText('Delete game vs Riverside FC'));

    expect(onRequestDeleteGame).toHaveBeenCalledWith('game-1');
    expect(onViewGame).not.toHaveBeenCalled();
  });

  it('shows a confirmation modal for the targeted game', () => {
    render(
      <TeamGamesPresentation {...baseProps} deleteConfirmGameId="game-1" />,
    );

    const heading = screen.getByText('Delete this game?');
    const modal = heading.closest('div');
    expect(modal).toBeTruthy();
    expect(
      within(modal as HTMLElement).getByText(/vs Riverside FC/),
    ).toBeTruthy();
  });

  it('cancels the confirmation without deleting', () => {
    const onCancelDeleteGame = vi.fn();
    const onConfirmDeleteGame = vi.fn();
    render(
      <TeamGamesPresentation
        {...baseProps}
        deleteConfirmGameId="game-1"
        onCancelDeleteGame={onCancelDeleteGame}
        onConfirmDeleteGame={onConfirmDeleteGame}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancelDeleteGame).toHaveBeenCalled();
    expect(onConfirmDeleteGame).not.toHaveBeenCalled();
  });

  it('confirms the delete', () => {
    const onConfirmDeleteGame = vi.fn();
    render(
      <TeamGamesPresentation
        {...baseProps}
        deleteConfirmGameId="game-1"
        onConfirmDeleteGame={onConfirmDeleteGame}
      />,
    );

    fireEvent.click(screen.getByText('Delete game'));

    expect(onConfirmDeleteGame).toHaveBeenCalled();
  });

  it('disables confirmation while deleting and shows an error', () => {
    render(
      <TeamGamesPresentation
        {...baseProps}
        deleteConfirmGameId="game-1"
        deleteLoading={true}
        deleteError="Failed to delete game. Please try again."
      />,
    );

    expect(
      screen.getByText('Failed to delete game. Please try again.'),
    ).toBeTruthy();
    const deleteButton = screen.getByText('Deleting...').closest('button');
    expect(deleteButton?.disabled).toBe(true);
  });
});

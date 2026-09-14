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
  editGameId: null,
  editForm: {
    gameFormatId: '',
    duration: 90,
  },
  editLoading: false,
  editError: null,
  onCreateGame: vi.fn(),
  onCancelCreate: vi.fn(),
  onFormChange: vi.fn(),
  onSubmitGame: vi.fn(),
  onViewGame: vi.fn(),
  onRequestDeleteGame: vi.fn(),
  onCancelDeleteGame: vi.fn(),
  onConfirmDeleteGame: vi.fn(),
  onRequestEditGame: vi.fn(),
  onCancelEditGame: vi.fn(),
  onEditFormChange: vi.fn(),
  onSubmitEditGame: vi.fn(),
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

    const modal = screen.getByRole('dialog', { name: 'Delete this game?' });
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(within(modal).getByText(/vs Riverside FC/)).toBeTruthy();
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

const scheduledGame = { ...game, status: 'SCHEDULED' };
const inProgressGame = { ...game, status: 'IN_PROGRESS' };

const gameFormats = [
  { id: 'format-1', name: '11v11', playersPerTeam: 11, durationMinutes: 90 },
  { id: 'format-2', name: '7v7', playersPerTeam: 7, durationMinutes: 60 },
];

describe('TeamGamesPresentation edit game format', () => {
  it('shows an edit control for a scheduled game and requests edit without navigating', () => {
    const onRequestEditGame = vi.fn();
    const onViewGame = vi.fn();
    render(
      <TeamGamesPresentation
        {...baseProps}
        games={[scheduledGame]}
        onRequestEditGame={onRequestEditGame}
        onViewGame={onViewGame}
      />,
    );

    fireEvent.click(screen.getByLabelText('Edit game format vs Riverside FC'));

    expect(onRequestEditGame).toHaveBeenCalledWith('game-1');
    expect(onViewGame).not.toHaveBeenCalled();
  });

  it('does not show an edit control for a game that has already started', () => {
    render(<TeamGamesPresentation {...baseProps} games={[inProgressGame]} />);

    expect(
      screen.queryByLabelText('Edit game format vs Riverside FC'),
    ).toBeNull();
  });

  it('shows the edit modal prefilled with the targeted game format and duration', () => {
    render(
      <TeamGamesPresentation
        {...baseProps}
        games={[scheduledGame]}
        gameFormats={gameFormats}
        editGameId="game-1"
        editForm={{ gameFormatId: 'format-1', duration: 90 }}
      />,
    );

    const modal = screen.getByRole('dialog', { name: 'Edit Game Format' });
    const formatSelect = within(modal).getByLabelText(
      'Game Format',
    ) as HTMLSelectElement;
    expect(formatSelect.value).toBe('format-1');
    const durationInput = within(modal).getByLabelText(
      'Duration',
    ) as HTMLInputElement;
    expect(durationInput.value).toBe('90');
  });

  it('submits the edit', () => {
    const onSubmitEditGame = vi.fn();
    render(
      <TeamGamesPresentation
        {...baseProps}
        games={[scheduledGame]}
        gameFormats={gameFormats}
        editGameId="game-1"
        editForm={{ gameFormatId: 'format-2', duration: 60 }}
        onSubmitEditGame={onSubmitEditGame}
      />,
    );

    fireEvent.click(screen.getByText('Save'));

    expect(onSubmitEditGame).toHaveBeenCalled();
  });

  it('cancels the edit without submitting', () => {
    const onCancelEditGame = vi.fn();
    const onSubmitEditGame = vi.fn();
    render(
      <TeamGamesPresentation
        {...baseProps}
        games={[scheduledGame]}
        gameFormats={gameFormats}
        editGameId="game-1"
        onCancelEditGame={onCancelEditGame}
        onSubmitEditGame={onSubmitEditGame}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancelEditGame).toHaveBeenCalled();
    expect(onSubmitEditGame).not.toHaveBeenCalled();
  });

  it('disables save while updating and shows an error', () => {
    render(
      <TeamGamesPresentation
        {...baseProps}
        games={[scheduledGame]}
        gameFormats={gameFormats}
        editGameId="game-1"
        editLoading={true}
        editError="Failed to update game. Please try again."
      />,
    );

    expect(
      screen.getByText('Failed to update game. Please try again.'),
    ).toBeTruthy();
    const saveButton = screen.getByText('Saving...').closest('button');
    expect(saveButton?.disabled).toBe(true);
  });
});

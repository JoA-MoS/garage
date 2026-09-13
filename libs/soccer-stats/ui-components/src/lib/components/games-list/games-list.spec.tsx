import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GamesList, GamePresentationData } from './games-list';

const game: GamePresentationData = {
  id: 'game-1',
  name: 'League Match Week 15',
  scheduledStart: '2026-09-13T16:00:00.000Z',
  venue: 'Camp Nou',
  status: 'SCHEDULED',
  homeTeam: { id: 'h1', name: 'Barcelona FC' },
  awayTeam: { id: 'a1', name: 'Atletico Madrid' },
  gameFormatName: '11v11 Full Game',
};

const baseProps = {
  games: [game],
  deleteConfirmGameId: null,
  deleteLoading: false,
  deleteError: null,
  onGameClick: vi.fn(),
  onRequestDeleteGame: vi.fn(),
  onCancelDeleteGame: vi.fn(),
  onConfirmDeleteGame: vi.fn(),
};

describe('GamesList delete game', () => {
  it('requests delete without navigating to the game', () => {
    const onRequestDeleteGame = vi.fn();
    const onGameClick = vi.fn();
    render(
      <GamesList
        {...baseProps}
        onRequestDeleteGame={onRequestDeleteGame}
        onGameClick={onGameClick}
      />,
    );

    fireEvent.click(screen.getByLabelText('Delete League Match Week 15'));

    expect(onRequestDeleteGame).toHaveBeenCalledWith('game-1');
    expect(onGameClick).not.toHaveBeenCalled();
  });

  it('shows a confirmation modal for the targeted game', () => {
    render(<GamesList {...baseProps} deleteConfirmGameId="game-1" />);

    const heading = screen.getByText('Delete this game?');
    const modal = heading.closest('div') as HTMLElement;
    expect(within(modal).getByText(/League Match Week 15/)).toBeTruthy();
  });

  it('cancels the confirmation without deleting', () => {
    const onCancelDeleteGame = vi.fn();
    const onConfirmDeleteGame = vi.fn();
    render(
      <GamesList
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
      <GamesList
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
      <GamesList
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

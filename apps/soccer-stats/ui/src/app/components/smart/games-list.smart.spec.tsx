import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { GamesListSmart } from './games-list.smart';

const mockRemoveGame = vi.fn();
let removeGameOptions: {
  onCompleted?: () => void;
  onError?: (e: Error) => void;
};

vi.mock('@apollo/client/react', () => ({
  useMutation: (_doc: unknown, options?: any) => {
    removeGameOptions = options;
    return [mockRemoveGame, { loading: false }];
  },
}));

const games = [
  {
    id: 'game-1',
    name: 'League Match Week 15',
    scheduledStart: '2026-09-13T16:00:00.000Z',
    venue: 'Camp Nou',
    status: 'SCHEDULED',
    teams: [
      {
        teamType: 'home',
        finalScore: null,
        team: { id: 'h1', name: 'Barcelona FC' },
      },
      {
        teamType: 'away',
        finalScore: null,
        team: { id: 'a1', name: 'Atletico Madrid' },
      },
    ],
    format: { name: '11v11 Full Game' },
  },
];

const renderSmart = (onGameDeleted = vi.fn()) =>
  render(
    <MemoryRouter>
      <GamesListSmart games={games} onGameDeleted={onGameDeleted} />
    </MemoryRouter>,
  );

describe('GamesListSmart delete game', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the confirmation modal when delete is requested', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Delete League Match Week 15'));

    expect(screen.getByText('Delete this game?')).toBeTruthy();
    expect(mockRemoveGame).not.toHaveBeenCalled();
  });

  it('calls removeGame with the targeted game id on confirm', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Delete League Match Week 15'));
    fireEvent.click(screen.getByText('Delete game'));

    expect(mockRemoveGame).toHaveBeenCalledWith({
      variables: { id: 'game-1' },
    });
  });

  it('closes the modal and notifies the parent when the delete completes', () => {
    const onGameDeleted = vi.fn();
    renderSmart(onGameDeleted);

    fireEvent.click(screen.getByLabelText('Delete League Match Week 15'));
    act(() => {
      removeGameOptions.onCompleted?.();
    });

    expect(onGameDeleted).toHaveBeenCalled();
    expect(screen.queryByText('Delete this game?')).toBeNull();
  });

  it('shows an error message when the delete mutation fails', () => {
    renderSmart();

    fireEvent.click(screen.getByLabelText('Delete League Match Week 15'));
    act(() => {
      removeGameOptions.onError?.(new Error('Network error'));
    });

    expect(screen.getByText('Network error')).toBeTruthy();
  });
});

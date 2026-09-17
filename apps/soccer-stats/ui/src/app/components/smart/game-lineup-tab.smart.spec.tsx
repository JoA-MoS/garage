import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { GameStatus } from '@garage/soccer-stats/graphql-codegen';

import { GameLineupTab } from './game-lineup-tab.smart';

// Mock Apollo Client hooks (GameLineupTab calls useMutation directly for
// create-player flows, unrelated to this suite's view-mode behavior).
vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('../../hooks/use-lineup', () => ({
  useLineup: () => ({
    onField: [],
    bench: [],
    availableRoster: [],
    teamRoster: [],
    loading: false,
    mutating: false,
    error: null,
    addPlayerToGameRoster: vi.fn(),
    removeFromLineup: vi.fn(),
    updatePosition: vi.fn(),
    substitutePlayer: vi.fn(),
    recordPositionChange: vi.fn(),
    bringPlayerOntoField: vi.fn(),
    refetchRoster: vi.fn(),
    formation: null,
  }),
}));

const baseProps = {
  gameTeamId: 'gt-1',
  gameId: 'game-1',
  teamId: 'team-1',
  teamName: 'Home',
  isManaged: true,
  playersPerTeam: 7,
  statsFeatures: { trackPositions: true, trackSubstitutions: true },
};

// Note: jest-dom is not wired up as a vitest matcher extension anywhere in
// this codebase, so aria-pressed is asserted via the raw DOM attribute
// rather than toHaveAttribute, matching the assertion style used elsewhere
// in this project's specs.
const ariaPressed = (button: HTMLElement) =>
  button.getAttribute('aria-pressed');

describe('GameLineupTab view mode', () => {
  it('defaults to the card view during first half', () => {
    render(<GameLineupTab {...baseProps} gameStatus={GameStatus.FirstHalf} />);
    expect(ariaPressed(screen.getByRole('button', { name: 'Card view' }))).toBe(
      'true',
    );
  });

  it('defaults to the field view before kickoff', () => {
    render(<GameLineupTab {...baseProps} gameStatus={GameStatus.Scheduled} />);
    expect(
      ariaPressed(screen.getByRole('button', { name: 'Field view' })),
    ).toBe('true');
  });

  it('defaults to the field view at halftime', () => {
    render(<GameLineupTab {...baseProps} gameStatus={GameStatus.Halftime} />);
    expect(
      ariaPressed(screen.getByRole('button', { name: 'Field view' })),
    ).toBe('true');
  });

  it('lets the coach manually switch views within a phase', () => {
    render(<GameLineupTab {...baseProps} gameStatus={GameStatus.FirstHalf} />);

    fireEvent.click(screen.getByRole('button', { name: 'Field view' }));

    expect(
      ariaPressed(screen.getByRole('button', { name: 'Field view' })),
    ).toBe('true');
  });

  it('resets a manual override back to the phase default on a phase transition', () => {
    const { rerender } = render(
      <GameLineupTab {...baseProps} gameStatus={GameStatus.FirstHalf} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Field view' }));
    expect(
      ariaPressed(screen.getByRole('button', { name: 'Field view' })),
    ).toBe('true');

    // Phase transition: first half -> halftime
    rerender(<GameLineupTab {...baseProps} gameStatus={GameStatus.Halftime} />);
    expect(
      ariaPressed(screen.getByRole('button', { name: 'Field view' })),
    ).toBe('true');

    // Phase transition: halftime -> second half — should reset to Card,
    // not remember the earlier manual override
    rerender(
      <GameLineupTab {...baseProps} gameStatus={GameStatus.SecondHalf} />,
    );
    expect(ariaPressed(screen.getByRole('button', { name: 'Card view' }))).toBe(
      'true',
    );
  });
});

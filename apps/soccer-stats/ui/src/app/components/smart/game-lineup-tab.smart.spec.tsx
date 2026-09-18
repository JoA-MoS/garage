import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  GameStatus,
  RosterPlayer as GqlRosterPlayer,
} from '@garage/soccer-stats/graphql-codegen';

import { GameLineupTab } from './game-lineup-tab.smart';

// Mock Apollo Client hooks (GameLineupTab calls useMutation directly for
// create-player flows, unrelated to this suite's view-mode behavior).
vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn(), { loading: false }],
}));

// Hoisted so the vi.mock factory below (which is itself hoisted above these
// imports/consts by Vitest) can close over it. Individual tests override
// the return value via useLineupMock.mockReturnValue(...) to exercise
// different onField/bench combinations.
const { useLineupMock } = vi.hoisted(() => ({ useLineupMock: vi.fn() }));

vi.mock('../../hooks/use-lineup', () => ({
  useLineup: useLineupMock,
  // LineupBench (rendered by GameLineupTab) imports this directly from the
  // hooks module, so it needs to survive the mock too.
  getPlayerDisplayName: (player: GqlRosterPlayer) =>
    player.externalPlayerName || player.playerName || 'Unknown Player',
}));

const mockPlayer = (id: string, name: string): GqlRosterPlayer =>
  ({
    gameEventId: `event-${id}`,
    playerId: id,
    playerName: name,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1] || '',
    externalPlayerName: null,
    externalPlayerNumber: null,
    position: 'MID',
  }) as GqlRosterPlayer;

const playerA = mockPlayer('a', 'Player Alpha');
const playerB = mockPlayer('b', 'Player Bravo');
const benchPlayer = mockPlayer('bench-1', 'Bench One');

const buildLineup = (overrides?: {
  onField?: GqlRosterPlayer[];
  bench?: GqlRosterPlayer[];
}) => ({
  onField: overrides?.onField ?? [playerA, playerB],
  bench: overrides?.bench ?? [benchPlayer],
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
});

beforeEach(() => {
  useLineupMock.mockReset();
  useLineupMock.mockReturnValue(buildLineup());
});

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

describe('GameLineupTab on-field card click routing', () => {
  it('starts a field-first selection when tapped with an empty bench (Finding 1 regression)', () => {
    useLineupMock.mockReturnValue(buildLineup({ bench: [] }));
    const onFieldPlayerClickForSub = vi.fn();
    const onFieldPlayerClickForSwap = vi.fn();

    render(
      <GameLineupTab
        {...baseProps}
        gameStatus={GameStatus.FirstHalf}
        onFieldPlayerClickForSub={onFieldPlayerClickForSub}
        onFieldPlayerClickForSwap={onFieldPlayerClickForSwap}
      />,
    );

    // Sanity check: card view is active by default during live play, and
    // this test's whole point is that the bench is empty.
    expect(ariaPressed(screen.getByRole('button', { name: 'Card view' }))).toBe(
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: /Player Alpha/ }));

    expect(onFieldPlayerClickForSub).toHaveBeenCalledWith(playerA);
    expect(onFieldPlayerClickForSwap).not.toHaveBeenCalled();
  });

  it('completes a swap when a different on-field card is tapped while a field-first selection is active', () => {
    const onFieldPlayerClickForSub = vi.fn();
    const onFieldPlayerClickForSwap = vi.fn();

    render(
      <GameLineupTab
        {...baseProps}
        gameStatus={GameStatus.FirstHalf}
        selectedFieldPlayerId={playerA.gameEventId}
        onFieldPlayerClickForSub={onFieldPlayerClickForSub}
        onFieldPlayerClickForSwap={onFieldPlayerClickForSwap}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Player Bravo/ }));

    expect(onFieldPlayerClickForSwap).toHaveBeenCalledWith(playerB);
    expect(onFieldPlayerClickForSub).not.toHaveBeenCalled();
  });

  it('does not complete a swap when the already-selected card is tapped again', () => {
    const onFieldPlayerClickForSub = vi.fn();
    const onFieldPlayerClickForSwap = vi.fn();

    render(
      <GameLineupTab
        {...baseProps}
        gameStatus={GameStatus.FirstHalf}
        selectedFieldPlayerId={playerA.gameEventId}
        onFieldPlayerClickForSub={onFieldPlayerClickForSub}
        onFieldPlayerClickForSwap={onFieldPlayerClickForSwap}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Player Alpha/ }));

    expect(onFieldPlayerClickForSwap).not.toHaveBeenCalled();
    // It falls through to the sub-click routing instead of being a no-op.
    expect(onFieldPlayerClickForSub).toHaveBeenCalledWith(playerA);
  });
});

describe('GameLineupTab with trackPositions: false', () => {
  const noPositionsProps = {
    ...baseProps,
    statsFeatures: { trackPositions: false, trackSubstitutions: true },
  };

  it('renders the on-field roster as cards with no Field/Card toggle or Formation selector', () => {
    render(
      <GameLineupTab {...noPositionsProps} gameStatus={GameStatus.FirstHalf} />,
    );

    expect(screen.getByText('Player Alpha')).toBeTruthy();
    expect(screen.getByText('Player Bravo')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Field view' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Card view' })).toBeNull();
    expect(screen.queryByLabelText('Formation:')).toBeNull();
  });

  it('resolves jersey numbers from the team roster for managed players', () => {
    useLineupMock.mockReturnValue({
      ...buildLineup(),
      teamRoster: [{ oduserId: 'a', jerseyNumber: '9' }],
    });

    render(
      <GameLineupTab {...noPositionsProps} gameStatus={GameStatus.FirstHalf} />,
    );

    expect(screen.getByText('#9')).toBeTruthy();
  });

  it('renders an Add to Field tile and calls the handler when provided', () => {
    const onAddToFieldClick = vi.fn();

    render(
      <GameLineupTab
        {...noPositionsProps}
        gameStatus={GameStatus.FirstHalf}
        onAddToFieldClick={onAddToFieldClick}
      />,
    );

    fireEvent.click(screen.getByText('Add to Field'));

    expect(onAddToFieldClick).toHaveBeenCalled();
  });

  it('routes on-field card clicks through the existing bench-gated substitution flow, not the swap flow', () => {
    const onFieldPlayerClickForSub = vi.fn();
    const onFieldPlayerClickForSwap = vi.fn();

    render(
      <GameLineupTab
        {...noPositionsProps}
        gameStatus={GameStatus.FirstHalf}
        onFieldPlayerClickForSub={onFieldPlayerClickForSub}
        onFieldPlayerClickForSwap={onFieldPlayerClickForSwap}
      />,
    );

    fireEvent.click(screen.getByText('Player Alpha'));

    expect(onFieldPlayerClickForSub).toHaveBeenCalledWith(playerA);
    expect(onFieldPlayerClickForSwap).not.toHaveBeenCalled();
  });
});

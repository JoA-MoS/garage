import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { PlayerCard } from './player-card.presentation';

const mockPlayer = (
  id: string,
  name: string,
  number?: string,
): GqlRosterPlayer =>
  ({
    gameEventId: `event-${id}`,
    playerId: id,
    playerName: name,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1] || '',
    externalPlayerName: null,
    externalPlayerNumber: number || null,
    position: 'MID',
  }) as GqlRosterPlayer;

describe('PlayerCard', () => {
  it('renders player name, jersey number, and formatted time', () => {
    render(
      <PlayerCard
        player={mockPlayer('1', 'Sarah Smith', '7')}
        variant="bench"
        timeSeconds={125}
        isLive={false}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Sarah Smith')).toBeTruthy();
    expect(screen.getByText('#7')).toBeTruthy();
    expect(screen.getByText(/02:05/)).toBeTruthy();
  });

  it('shows a live indicator only when isLive is true', () => {
    render(
      <PlayerCard
        player={mockPlayer('1', 'Sarah Smith')}
        variant="onField"
        timeSeconds={60}
        isLive={true}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('status', { name: 'Live' })).toBeTruthy();
  });

  it('applies a distinct highlight when an on-field card is selected', () => {
    render(
      <PlayerCard
        player={mockPlayer('1', 'Sarah Smith')}
        variant="onField"
        timeSeconds={60}
        isLive={true}
        isSelected={true}
        onClick={vi.fn()}
      />,
    );

    const card = screen.getByRole('button');
    expect(card.className).toContain('border-blue-400');
  });

  it('shows a queued badge when isQueued is true', () => {
    render(
      <PlayerCard
        player={mockPlayer('1', 'Sarah Smith')}
        variant="onField"
        timeSeconds={60}
        isLive={true}
        isSelected={false}
        isQueued={true}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Queued')).toBeTruthy();
  });

  it('disables the underlying button when disabled is true', () => {
    render(
      <PlayerCard
        player={mockPlayer('1', 'Sarah Smith')}
        variant="onField"
        timeSeconds={60}
        isLive={false}
        isSelected={false}
        disabled={true}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
  });

  it('does not disable the underlying button by default', () => {
    render(
      <PlayerCard
        player={mockPlayer('1', 'Sarah Smith')}
        variant="onField"
        timeSeconds={60}
        isLive={false}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button').hasAttribute('disabled')).toBe(false);
  });

  it('uses the jerseyNumber override instead of player.externalPlayerNumber when provided', () => {
    render(
      <PlayerCard
        player={mockPlayer('1', 'Sarah Smith', '7')}
        variant="bench"
        timeSeconds={0}
        isLive={false}
        isSelected={false}
        jerseyNumber="23"
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('#23')).toBeTruthy();
    expect(screen.queryByText('#7')).toBeNull();
  });

  it('falls back to player.externalPlayerNumber when no jerseyNumber override is given', () => {
    render(
      <PlayerCard
        player={mockPlayer('1', 'Sarah Smith', '7')}
        variant="bench"
        timeSeconds={0}
        isLive={false}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText('#7')).toBeTruthy();
  });
});

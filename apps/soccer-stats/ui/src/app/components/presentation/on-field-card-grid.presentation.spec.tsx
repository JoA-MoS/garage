import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { OnFieldCardGrid } from './on-field-card-grid.presentation';

const mockPlayer = (
  id: string,
  name: string,
  position = 'MID',
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

describe('OnFieldCardGrid', () => {
  it('renders one card per on-field player with their position label', () => {
    render(
      <OnFieldCardGrid
        onFieldPlayers={[
          mockPlayer('1', 'Sarah Smith', 'CB'),
          mockPlayer('2', 'Alex Jones', 'ST'),
        ]}
        playTimeByPlayer={new Map()}
      />,
    );

    expect(screen.getByText('Sarah Smith')).toBeTruthy();
    expect(screen.getByText(/CB/)).toBeTruthy();
    expect(screen.getByText('Alex Jones')).toBeTruthy();
    expect(screen.getByText(/ST/)).toBeTruthy();
  });

  it('never shows the FIELD sentinel as a position label', () => {
    render(
      <OnFieldCardGrid
        onFieldPlayers={[mockPlayer('1', 'Sarah Smith', 'FIELD')]}
        playTimeByPlayer={new Map()}
      />,
    );

    expect(screen.queryByText(/FIELD/)).toBeNull();
  });

  it('highlights the selected field player without removing it from the grid', () => {
    render(
      <OnFieldCardGrid
        onFieldPlayers={[mockPlayer('1', 'Sarah Smith')]}
        playTimeByPlayer={new Map()}
        selectedFieldPlayerId="event-1"
      />,
    );

    const card = screen.getByText('Sarah Smith').closest('button');
    expect(card?.className).toContain('border-blue-400');
  });

  it('shows a queued badge for players in queuedPlayerIds', () => {
    render(
      <OnFieldCardGrid
        onFieldPlayers={[mockPlayer('1', 'Sarah Smith')]}
        playTimeByPlayer={new Map()}
        queuedPlayerIds={new Set(['event-1'])}
      />,
    );

    expect(screen.getByLabelText('Queued')).toBeTruthy();
  });

  it('calls onFieldPlayerClick with the clicked player', () => {
    const onFieldPlayerClick = vi.fn();
    const player = mockPlayer('1', 'Sarah Smith');
    render(
      <OnFieldCardGrid
        onFieldPlayers={[player]}
        playTimeByPlayer={new Map()}
        onFieldPlayerClick={onFieldPlayerClick}
      />,
    );

    fireEvent.click(screen.getByText('Sarah Smith'));

    expect(onFieldPlayerClick).toHaveBeenCalledWith(player);
  });

  it('does not call onFieldPlayerClick when disabled', () => {
    const onFieldPlayerClick = vi.fn();
    render(
      <OnFieldCardGrid
        onFieldPlayers={[mockPlayer('1', 'Sarah Smith')]}
        playTimeByPlayer={new Map()}
        onFieldPlayerClick={onFieldPlayerClick}
        disabled={true}
      />,
    );

    fireEvent.click(screen.getByText('Sarah Smith'));

    expect(onFieldPlayerClick).not.toHaveBeenCalled();
  });

  it('sets the native disabled attribute on the card button when disabled', () => {
    render(
      <OnFieldCardGrid
        onFieldPlayers={[mockPlayer('1', 'Sarah Smith')]}
        playTimeByPlayer={new Map()}
        disabled={true}
      />,
    );

    const card = screen.getByText('Sarah Smith').closest('button');
    expect(card?.hasAttribute('disabled')).toBe(true);
  });

  it('resolves jersey numbers via getJerseyNumber when provided', () => {
    render(
      <OnFieldCardGrid
        onFieldPlayers={[mockPlayer('1', 'Sarah Smith')]}
        playTimeByPlayer={new Map()}
        getJerseyNumber={() => '9'}
      />,
    );

    expect(screen.getByText('#9')).toBeTruthy();
  });

  it('renders an Add to Field tile and calls the handler when clicked', () => {
    const onAddToFieldClick = vi.fn();
    render(
      <OnFieldCardGrid
        onFieldPlayers={[mockPlayer('1', 'Sarah Smith')]}
        playTimeByPlayer={new Map()}
        onAddToFieldClick={onAddToFieldClick}
      />,
    );

    fireEvent.click(screen.getByText('Add to Field'));

    expect(onAddToFieldClick).toHaveBeenCalled();
  });

  it('shows an empty-state message when there are no on-field players and no Add to Field handler', () => {
    render(
      <OnFieldCardGrid onFieldPlayers={[]} playTimeByPlayer={new Map()} />,
    );

    expect(screen.getByText('No players on field')).toBeTruthy();
  });

  it('shows the Add to Field tile instead of the empty-state message when there are no players but a handler is provided', () => {
    render(
      <OnFieldCardGrid
        onFieldPlayers={[]}
        playTimeByPlayer={new Map()}
        onAddToFieldClick={vi.fn()}
      />,
    );

    expect(screen.queryByText('No players on field')).toBeNull();
    expect(screen.getByText('Add to Field')).toBeTruthy();
  });
});

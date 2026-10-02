import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  GameOutboxContext,
  type GameOutboxValue,
} from '../../outbox/game-outbox-context';
import type { OutboxAction } from '../../outbox/outbox-types';

import { SyncStatus } from './sync-status.smart';

function action(overrides: Partial<OutboxAction> = {}): OutboxAction {
  return {
    actionId: 'a1',
    gameId: 'g1',
    kind: 'recordGoal',
    variables: {},
    pendingEvents: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    attempts: 0,
    nextAttemptAt: 0,
    status: 'queued',
    ...overrides,
  };
}

function renderWith(actions: OutboxAction[], overrides = {}) {
  const value: GameOutboxValue = {
    actions,
    recordAction: vi.fn(),
    retry: vi.fn().mockResolvedValue(undefined),
    discard: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const utils = render(
    <GameOutboxContext.Provider value={value}>
      <SyncStatus />
    </GameOutboxContext.Provider>,
  );
  return { ...utils, value };
}

describe('SyncStatus', () => {
  it('renders nothing when the queue is empty', () => {
    const { container } = renderWith([]);
    expect(container.innerHTML).toBe('');
  });

  it('shows how many changes are syncing', () => {
    renderWith([action(), action({ actionId: 'a2' })]);
    expect(screen.getByRole('status').textContent).toContain(
      'Syncing 2 changes',
    );
  });

  it('uses the singular for one change', () => {
    renderWith([action()]);
    expect(screen.getByRole('status').textContent).toContain(
      'Syncing 1 change…',
    );
  });

  it('shows a failed action with its error and Retry / Discard', () => {
    const { value } = renderWith([
      action({
        actionId: 'bad',
        kind: 'batchLineupChanges',
        status: 'failed',
        error: 'Player is not on the field',
      }),
    ]);

    expect(screen.getByRole('alert').textContent).toContain(
      'Substitutions not saved.',
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'Player is not on the field',
    );
    expect(screen.queryByRole('status')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(value.retry).toHaveBeenCalledWith('bad');
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(value.discard).toHaveBeenCalledWith('bad');
  });
});

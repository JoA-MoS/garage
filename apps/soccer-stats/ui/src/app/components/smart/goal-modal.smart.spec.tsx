import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import type { RosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { GoalModal } from './goal-modal.smart';

const mockRecordAction = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('../../outbox/game-outbox-context', () => ({
  useGameOutbox: () => ({ recordAction: mockRecordAction }),
}));

const player = (id: string, name: string, position: string | null) =>
  ({
    playerId: id,
    playerName: name,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1],
    gameEventId: `evt-${id}`,
    position,
  }) as RosterPlayer;

describe('GoalModal (record)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordAction.mockResolvedValue(undefined);
  });

  it('records a recordGoal action and closes without waiting on the network', async () => {
    const onClose = vi.fn();
    render(
      <GoalModal
        gameTeamId="gt1"
        gameId="g1"
        teamId="t1"
        teamName="Home"
        teamColor="#000"
        onField={[
          player('1', 'Sarah Smith', 'ST'),
          player('2', 'Alex Jones', 'CM'),
        ]}
        bench={[]}
        period="1"
        periodSecond={420}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getAllByDisplayValue('Select player...')[0], {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record Goal' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockRecordAction).toHaveBeenCalledTimes(1);

    const action = mockRecordAction.mock.calls[0][0];
    expect(action.kind).toBe('recordGoal');
    expect(action.variables.input).toMatchObject({
      actionId: action.actionId,
      gameTeamId: 'gt1',
      period: '1',
      periodSecond: 420,
      scorerId: '1',
    });
    expect(action.pendingEvents).toHaveLength(1);
    expect(action.pendingEvents[0]).toMatchObject({
      id: action.variables.input.goalEventId,
      gameTeamId: 'gt1',
      eventType: { name: 'GOAL' },
      playerId: '1',
      period: '1',
      periodSecond: 420,
    });
  });

  it('records a double-tapped goal only once', async () => {
    const onClose = vi.fn();
    render(
      <GoalModal
        gameTeamId="gt1"
        gameId="g1"
        teamId="t1"
        teamName="Home"
        teamColor="#000"
        onField={[player('1', 'Sarah Smith', 'ST')]}
        bench={[]}
        period="1"
        periodSecond={420}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getAllByDisplayValue('Select player...')[0], {
      target: { value: '1' },
    });

    const submit = screen.getByRole('button', { name: 'Record Goal' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockRecordAction).toHaveBeenCalledTimes(1);
  });
});

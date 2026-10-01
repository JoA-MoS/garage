import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { GoalModal } from './goal-modal.smart';
const network = vi.hoisted(() => vi.fn());
vi.mock('@apollo/client/react', () => ({
  useMutation: () => [network, { loading: false }],
}));
vi.mock('@garage/soccer-stats/ui-components', () => ({
  ModalPortal: ({ children }: any) => children,
}));
describe('local-first goal modal', () => {
  it('closes only after local commit without calling mutation', async () => {
    let commit!: () => void;
    const recordLocalGoal = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          commit = resolve;
        }),
    );
    const onClose = vi.fn();
    const view = render(
      <GoalModal
        gameId="game"
        gameTeamId="team"
        teamId="t"
        teamName="Home"
        teamColor="blue"
        onField={[]}
        bench={[]}
        period="1"
        periodSecond={12}
        onClose={onClose}
        recordLocalGoal={recordLocalGoal}
      />,
    );
    fireEvent.click(view.getByRole('button', { name: 'Record Goal' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(recordLocalGoal).toHaveBeenCalled();
    commit();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(network).not.toHaveBeenCalled();
  });
});

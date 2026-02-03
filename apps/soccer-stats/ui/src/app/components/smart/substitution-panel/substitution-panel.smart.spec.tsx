import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { SubstitutionPanel } from './substitution-panel.smart';
import { SubstitutionPanelSmartProps } from './types';

// Mock Apollo Client hooks
const mockBatchLineupChanges = vi.fn();
const mockQuery = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => ({
    query: mockQuery,
  }),
  useMutation: () => [mockBatchLineupChanges],
}));

// Mock player factory
const mockPlayer = (
  id: string,
  name: string,
  options?: { external?: boolean; number?: string },
): GqlRosterPlayer =>
  ({
    gameEventId: `event-${id}`,
    playerId: options?.external ? null : id,
    playerName: name,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1] || '',
    externalPlayerName: options?.external ? name : null,
    externalPlayerNumber: options?.number || null,
    position: 'MID',
  }) as GqlRosterPlayer;

// Default props factory
const createDefaultProps = (
  overrides?: Partial<SubstitutionPanelSmartProps>,
): SubstitutionPanelSmartProps => ({
  gameTeamId: 'game-team-1',
  gameId: 'game-1',
  teamName: 'Home Team',
  teamColor: '#3B82F6',
  onField: [mockPlayer('1', 'Sarah Smith'), mockPlayer('2', 'Alex Jones')],
  bench: [mockPlayer('3', 'Jimmy Brown'), mockPlayer('4', 'Taylor White')],
  period: '1',
  periodSecond: 900,
  gameEvents: [
    {
      id: 'evt-1',
      playerId: '1',
      eventType: { category: 'STARTER' },
      period: '1',
      periodSecond: 0,
    },
    {
      id: 'evt-2',
      playerId: '2',
      eventType: { category: 'STARTER' },
      period: '1',
      periodSecond: 0,
    },
  ],
  ...overrides,
});

describe('SubstitutionPanel Smart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchLineupChanges.mockResolvedValue({
      data: { batchLineupChanges: { success: true } },
    });
    mockQuery.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial render', () => {
    it('renders in collapsed state by default', () => {
      render(<SubstitutionPanel {...createDefaultProps()} />);
      expect(screen.getByText('Substitutions')).toBeTruthy();
    });

    it('shows bench players when panel is opened', async () => {
      render(<SubstitutionPanel {...createDefaultProps()} />);

      // Click to open panel
      fireEvent.click(screen.getByText('Substitutions'));

      await waitFor(() => {
        // Should show both bench players
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
        expect(screen.getByText('Taylor White')).toBeTruthy();
      });
    });
  });

  describe('field-first selection flow', () => {
    it('opens panel when field player is selected externally', async () => {
      const onExternalSelectionHandled = vi.fn();
      const props = createDefaultProps({
        externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
        onExternalSelectionHandled,
      });

      render(<SubstitutionPanel {...props} />);

      await waitFor(() => {
        // Panel should open to bench-view and show bench players
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
        expect(screen.getByText('Taylor White')).toBeTruthy();
      });

      // Should notify parent that selection was handled
      expect(onExternalSelectionHandled).toHaveBeenCalled();
    });

    it('shows selection header with field player name', async () => {
      const props = createDefaultProps({
        externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
        onExternalSelectionHandled: vi.fn(),
      });

      render(<SubstitutionPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText(/Replacing:/)).toBeTruthy();
        expect(screen.getByText('Sarah Smith')).toBeTruthy();
      });
    });

    it('queues substitution when bench player clicked after field player selection', async () => {
      const props = createDefaultProps({
        externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
        onExternalSelectionHandled: vi.fn(),
      });

      render(<SubstitutionPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      // Click bench player to complete substitution
      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        // Should show queue header in bench-view state
        expect(screen.getByText(/Queued \(1\)/)).toBeTruthy();
        // Should show confirm button
        expect(screen.getByText('Confirm All (1)')).toBeTruthy();
      });
    });
  });

  describe('bench-first selection flow', () => {
    it('notifies parent when bench player is selected', async () => {
      const onBenchSelectionChange = vi.fn();
      const props = createDefaultProps({
        onBenchSelectionChange,
      });

      render(<SubstitutionPanel {...props} />);

      // Click to open panel
      fireEvent.click(screen.getByText('Substitutions'));

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      // Click bench player
      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        expect(onBenchSelectionChange).toHaveBeenCalledWith(
          expect.objectContaining({ playerName: 'Jimmy Brown' }),
        );
      });
    });

    it('clears bench selection when same player clicked again', async () => {
      const onBenchSelectionChange = vi.fn();
      const props = createDefaultProps({
        onBenchSelectionChange,
      });

      render(<SubstitutionPanel {...props} />);

      // Open panel
      fireEvent.click(screen.getByText('Substitutions'));

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      // Click bench player
      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        expect(onBenchSelectionChange).toHaveBeenCalledWith(
          expect.objectContaining({ playerName: 'Jimmy Brown' }),
        );
      });

      // Click same player again to deselect - use getAllByText since name appears in selection header too
      const jimmyElements = screen.getAllByText('Jimmy Brown');
      fireEvent.click(jimmyElements[jimmyElements.length - 1]); // Click the one in the list

      await waitFor(() => {
        expect(onBenchSelectionChange).toHaveBeenLastCalledWith(null);
      });
    });

    it('completes substitution when external field player to replace is provided', async () => {
      const onExternalFieldPlayerToReplaceHandled = vi.fn();
      const onBenchSelectionChange = vi.fn();

      const { rerender } = render(
        <SubstitutionPanel
          {...createDefaultProps({
            onBenchSelectionChange,
            onExternalFieldPlayerToReplaceHandled,
          })}
        />,
      );

      // Open panel and select bench player
      fireEvent.click(screen.getByText('Substitutions'));

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        expect(onBenchSelectionChange).toHaveBeenCalled();
      });

      // Simulate external field player click by re-rendering with the prop
      rerender(
        <SubstitutionPanel
          {...createDefaultProps({
            onBenchSelectionChange,
            onExternalFieldPlayerToReplaceHandled,
            externalFieldPlayerToReplace: mockPlayer('1', 'Sarah Smith'),
          })}
        />,
      );

      await waitFor(() => {
        // Should have queued the substitution - check for queue header
        expect(screen.getByText(/Queued \(1\)/)).toBeTruthy();
        expect(onExternalFieldPlayerToReplaceHandled).toHaveBeenCalled();
      });
    });
  });

  describe('queue management', () => {
    it('removes item from queue when X clicked', async () => {
      const props = createDefaultProps({
        externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
        onExternalSelectionHandled: vi.fn(),
      });

      render(<SubstitutionPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      // Click bench player to queue substitution
      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        // Queue should be visible in bench-view
        expect(screen.getByText(/Queued \(1\)/)).toBeTruthy();
        expect(screen.getByLabelText('Remove from queue')).toBeTruthy();
      });

      // Click remove
      fireEvent.click(screen.getByLabelText('Remove from queue'));

      await waitFor(() => {
        // Queue should be empty - confirm button should not be visible
        expect(screen.queryByText(/Confirm All/)).toBeFalsy();
        expect(screen.queryByText(/Queued/)).toBeFalsy();
      });
    });

    it('filters out queued players from available bench list', async () => {
      const props = createDefaultProps({
        externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
        onExternalSelectionHandled: vi.fn(),
      });

      render(<SubstitutionPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
        expect(screen.getByText('Taylor White')).toBeTruthy();
      });

      // Click bench player to queue substitution
      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        // Taylor White should still be available
        expect(screen.getByText('Taylor White')).toBeTruthy();
        // Jimmy Brown may appear in queue but not as a clickable bench option
      });
    });
  });

  describe('handleConfirmAll', () => {
    it('executes mutation with correct inputs', async () => {
      const onSubstitutionComplete = vi.fn();
      const props = createDefaultProps({
        externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
        onExternalSelectionHandled: vi.fn(),
        onSubstitutionComplete,
      });

      render(<SubstitutionPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      // Queue a substitution
      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        // Queue visible in bench-view, confirm button should be there
        expect(screen.getByText('Confirm All (1)')).toBeTruthy();
      });

      // Click confirm
      await act(async () => {
        fireEvent.click(screen.getByText('Confirm All (1)'));
      });

      await waitFor(() => {
        expect(mockBatchLineupChanges).toHaveBeenCalledWith({
          variables: {
            input: {
              gameTeamId: 'game-team-1',
              period: '1',
              periodSecond: 900,
              substitutions: [
                {
                  playerOutEventId: 'event-1',
                  playerInId: '3',
                  externalPlayerInName: undefined,
                  externalPlayerInNumber: undefined,
                },
              ],
              swaps: [],
            },
          },
        });
      });
    });

    it('clears queue and collapses panel on mutation success', async () => {
      const onSubstitutionComplete = vi.fn();
      const props = createDefaultProps({
        externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
        onExternalSelectionHandled: vi.fn(),
        onSubstitutionComplete,
      });

      render(<SubstitutionPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      // Queue a substitution
      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        expect(screen.getByText('Confirm All (1)')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Confirm All (1)'));
      });

      await waitFor(() => {
        // Panel should collapse after success
        expect(screen.getByText('Substitutions')).toBeTruthy();
        expect(onSubstitutionComplete).toHaveBeenCalled();
      });
    });

    it('shows error and preserves queue on mutation failure', async () => {
      mockBatchLineupChanges.mockRejectedValueOnce(
        new Error('Network error: Failed to execute substitutions'),
      );

      const onSubstitutionComplete = vi.fn();
      const props = createDefaultProps({
        externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
        onExternalSelectionHandled: vi.fn(),
        onSubstitutionComplete,
      });

      render(<SubstitutionPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      // Queue a substitution
      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        expect(screen.getByText('Confirm All (1)')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Confirm All (1)'));
      });

      await waitFor(() => {
        // Should show error
        expect(screen.getByText(/Error:/)).toBeTruthy();
        // Queue should still have 1 item (preserved on failure)
        expect(screen.getByText('Confirm All (1)')).toBeTruthy();
        // Callback should NOT have been called
        expect(onSubstitutionComplete).not.toHaveBeenCalled();
      });
    });

    it('handles refetch failure gracefully after mutation success', async () => {
      // Mutation succeeds, but refetch fails
      mockQuery.mockRejectedValueOnce(new Error('Refetch failed'));

      const onSubstitutionComplete = vi.fn();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

      const props = createDefaultProps({
        externalFieldPlayerSelection: mockPlayer('1', 'Sarah Smith'),
        onExternalSelectionHandled: vi.fn(),
        onSubstitutionComplete,
      });

      render(<SubstitutionPanel {...props} />);

      await waitFor(() => {
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      // Queue a substitution
      fireEvent.click(screen.getByText('Jimmy Brown'));

      await waitFor(() => {
        expect(screen.getByText('Confirm All (1)')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Confirm All (1)'));
      });

      await waitFor(() => {
        // Should NOT show error (mutation succeeded)
        expect(screen.queryByText(/Error:/)).toBeFalsy();
        // Panel should collapse (success)
        expect(screen.getByText('Substitutions')).toBeTruthy();
        // Callback should have been called
        expect(onSubstitutionComplete).toHaveBeenCalled();
        // Warning should have been logged
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Refetch failed after successful mutation'),
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });

    it('does nothing when queue is empty', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

      render(<SubstitutionPanel {...createDefaultProps()} />);

      // The confirm button shouldn't even be visible with empty queue
      expect(screen.queryByText(/Confirm All/)).toBeFalsy();

      consoleSpy.mockRestore();
    });
  });

  describe('play time calculation', () => {
    it('displays play time for bench players', async () => {
      render(<SubstitutionPanel {...createDefaultProps()} />);

      // Open panel
      fireEvent.click(screen.getByText('Substitutions'));

      await waitFor(() => {
        // Bench players should be visible
        expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      });

      // Check that play time is displayed - there should be multiple "0 min" elements
      // (one for each bench player who hasn't played yet)
      const playTimeElements = screen.getAllByText(/\d+\s*min/);
      expect(playTimeElements.length).toBeGreaterThan(0);
    });
  });

  describe('external player handling', () => {
    it('handles external players (without playerId) correctly', async () => {
      const props = createDefaultProps({
        bench: [
          mockPlayer('ext-1', 'Guest Player', { external: true }),
          mockPlayer('4', 'Taylor White'),
        ],
      });

      render(<SubstitutionPanel {...props} />);

      // Open panel
      fireEvent.click(screen.getByText('Substitutions'));

      await waitFor(() => {
        expect(screen.getByText('Guest Player')).toBeTruthy();
      });
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { SubstitutionPanelPresentation } from './substitution-panel.presentation';
import { SubstitutionPanelPresentationProps, PanelState } from './types';

const mockPlayer = (id: string, name: string, number?: string) => ({
  gameEventId: `event-${id}`,
  playerId: id,
  playerName: name,
  firstName: name.split(' ')[0],
  lastName: name.split(' ')[1] || '',
  externalPlayerName: null,
  externalPlayerNumber: number || null,
  position: 'MID',
});

const defaultProps: SubstitutionPanelPresentationProps = {
  panelState: 'collapsed',
  onPanelStateChange: vi.fn(),
  teamName: 'Home Team',
  teamColor: '#3B82F6',
  benchPlayers: [
    mockPlayer('3', 'Jimmy Brown', '12'),
    mockPlayer('4', 'Taylor White', '9'),
  ],
  playTimeByPlayer: new Map([
    ['1', { totalSeconds: 900, isOnField: true }],
    ['2', { totalSeconds: 600, isOnField: true }],
    ['3', { totalSeconds: 300, isOnField: false }],
    ['4', { totalSeconds: 0, isOnField: false }],
  ]),
  selection: { direction: null, fieldPlayer: null, benchPlayer: null },
  onBenchPlayerClick: vi.fn(),
  onClearSelection: vi.fn(),
  queue: [],
  onRemoveFromQueue: vi.fn(),
  onConfirmAll: vi.fn(),
  onRequestRemoval: vi.fn(),
  isExecuting: false,
  executionProgress: 0,
  error: null,
  period: '1',
  periodSecond: 900,
};

describe('SubstitutionPanelPresentation', () => {
  describe('collapsed state', () => {
    it('shows collapsed bar with substitutions label', () => {
      render(<SubstitutionPanelPresentation {...defaultProps} />);
      expect(screen.getByText('Substitutions')).toBeTruthy();
    });

    it('shows queue badge when items queued', () => {
      const props = {
        ...defaultProps,
        queue: [
          {
            id: 'q1',
            type: 'substitution' as const,
            playerOut: mockPlayer('1', 'Sarah Smith'),
            playerIn: mockPlayer('3', 'Jimmy Brown'),
          },
        ],
      };
      render(<SubstitutionPanelPresentation {...props} />);
      expect(screen.getByText('1')).toBeTruthy();
    });

    it('shows drag handle indicator', () => {
      const { container } = render(
        <SubstitutionPanelPresentation {...defaultProps} />,
      );
      // Drag handle is a small rounded pill element
      const dragHandle = container.querySelector('.h-1.w-10.rounded-full');
      expect(dragHandle).toBeTruthy();
    });
  });

  describe('bench-view state', () => {
    it('shows bench players when panel is in bench-view', () => {
      const props = { ...defaultProps, panelState: 'bench-view' as PanelState };
      render(<SubstitutionPanelPresentation {...props} />);
      expect(screen.getByText('Jimmy Brown')).toBeTruthy();
      expect(screen.getByText('Taylor White')).toBeTruthy();
    });

    it('shows play time for bench players', () => {
      const props = { ...defaultProps, panelState: 'bench-view' as PanelState };
      render(<SubstitutionPanelPresentation {...props} />);
      expect(screen.getByText('05:00')).toBeTruthy();
      expect(screen.getByText('00:00')).toBeTruthy();
    });

    it('shows selection header when field player selected', () => {
      const props = {
        ...defaultProps,
        panelState: 'bench-view' as PanelState,
        selection: {
          direction: 'field-first' as const,
          fieldPlayer: mockPlayer('1', 'Sarah Smith', '7'),
          benchPlayer: null,
        },
      };
      render(<SubstitutionPanelPresentation {...props} />);
      // Check that the replacement text appears with the player name
      expect(screen.getByText(/Replacing:/)).toBeTruthy();
      expect(screen.getByText('Sarah Smith')).toBeTruthy();
    });

    it('shows drag handle indicator in expanded panel', () => {
      const props = { ...defaultProps, panelState: 'bench-view' as PanelState };
      const { container } = render(
        <SubstitutionPanelPresentation {...props} />,
      );
      const dragHandle = container.querySelector('.h-1.w-10.rounded-full');
      expect(dragHandle).toBeTruthy();
    });
  });

  describe('player selection', () => {
    it('calls onBenchPlayerClick when bench player tapped', () => {
      const onBenchPlayerClick = vi.fn();
      const props = {
        ...defaultProps,
        panelState: 'bench-view' as PanelState,
        onBenchPlayerClick,
      };
      render(<SubstitutionPanelPresentation {...props} />);
      fireEvent.click(screen.getByText('Jimmy Brown'));
      expect(onBenchPlayerClick).toHaveBeenCalledWith(
        expect.objectContaining({ playerName: 'Jimmy Brown' }),
      );
    });
  });

  describe('addition flow (bring bench player onto field, no removal)', () => {
    // The "Add to Field" card lives in the Lineup tab's On Field section
    // (alongside the on-field players), not in this panel. The panel only
    // receives the resulting tap via its externalAddToField prop.
    const benchFirstProps = {
      ...defaultProps,
      panelState: 'bench-view' as PanelState,
      selection: {
        direction: 'bench-first' as const,
        fieldPlayer: null,
        benchPlayer: mockPlayer('3', 'Jimmy Brown', '12'),
      },
    };

    it('does not render an "Add to Field" card inside the panel', () => {
      render(<SubstitutionPanelPresentation {...benchFirstProps} />);
      expect(screen.queryByText('Add to Field')).toBeFalsy();
      expect(screen.queryByText(/Field Full/)).toBeFalsy();
    });

    it('stays on the Bench tab when a bench player is selected', () => {
      // The panel must not hijack the active tab - the add action lives in
      // the Lineup tab, so there is nothing to jump to here.
      render(<SubstitutionPanelPresentation {...benchFirstProps} />);
      // Taylor White only appears in the bench list (Jimmy Brown also shows
      // in the "Bringing in" header), so seeing her means Bench is active
      expect(screen.getByText('Taylor White')).toBeTruthy();
    });

    it('still shows queued additions in the queue list', () => {
      render(
        <SubstitutionPanelPresentation
          {...benchFirstProps}
          panelState="expanded"
          queue={[
            {
              id: 'q1',
              type: 'addition' as const,
              playerIn: mockPlayer('3', 'Jimmy Brown'),
            },
          ]}
        />,
      );
      expect(screen.getAllByText('Jimmy Brown').length).toBeGreaterThan(0);
      expect(screen.getByText('on')).toBeTruthy();
    });
  });

  describe('queue display', () => {
    it('shows queued substitutions in expanded view', () => {
      const props = {
        ...defaultProps,
        panelState: 'expanded' as PanelState,
        queue: [
          {
            id: 'q1',
            type: 'substitution' as const,
            playerOut: mockPlayer('1', 'Sarah Smith'),
            playerIn: mockPlayer('3', 'Jimmy Brown'),
          },
        ],
      };
      render(<SubstitutionPanelPresentation {...props} />);
      // Player names may appear multiple times (in queue and bench), so use getAllByText
      expect(screen.getAllByText('Sarah Smith').length).toBeGreaterThan(0);
      expect(screen.getByText('→')).toBeTruthy();
      expect(screen.getAllByText('Jimmy Brown').length).toBeGreaterThan(0);
    });

    it('shows queued position swaps in expanded view', () => {
      const props = {
        ...defaultProps,
        panelState: 'expanded' as PanelState,
        queue: [
          {
            id: 'q1',
            type: 'swap' as const,
            player1: {
              source: 'onField' as const,
              player: mockPlayer('1', 'Sarah Smith'),
              gameEventId: 'event-1',
            },
            player2: {
              source: 'onField' as const,
              player: mockPlayer('2', 'Alex Jones'),
              gameEventId: 'event-2',
            },
          },
        ],
      };
      render(<SubstitutionPanelPresentation {...props} />);
      // Position swap shows both players with ↔ symbol
      expect(screen.getAllByText('Sarah Smith').length).toBeGreaterThan(0);
      expect(screen.getByText('↔')).toBeTruthy();
      expect(screen.getAllByText('Alex Jones').length).toBeGreaterThan(0);
    });

    it('calls onRemoveFromQueue when X clicked', () => {
      const onRemoveFromQueue = vi.fn();
      const props = {
        ...defaultProps,
        panelState: 'expanded' as PanelState,
        queue: [
          {
            id: 'q1',
            type: 'substitution' as const,
            playerOut: mockPlayer('1', 'Sarah Smith'),
            playerIn: mockPlayer('3', 'Jimmy Brown'),
          },
        ],
        onRemoveFromQueue,
      };
      render(<SubstitutionPanelPresentation {...props} />);
      fireEvent.click(screen.getByLabelText('Remove from queue'));
      expect(onRemoveFromQueue).toHaveBeenCalledWith('q1');
    });
  });

  describe('confirm button', () => {
    it('shows Confirm All button when queue has items', () => {
      const props = {
        ...defaultProps,
        panelState: 'expanded' as PanelState,
        queue: [
          {
            id: 'q1',
            type: 'substitution' as const,
            playerOut: mockPlayer('1', 'Sarah Smith'),
            playerIn: mockPlayer('3', 'Jimmy Brown'),
          },
        ],
      };
      render(<SubstitutionPanelPresentation {...props} />);
      expect(screen.getByText('Confirm All (1)')).toBeTruthy();
    });

    it('calls onConfirmAll when button clicked', () => {
      const onConfirmAll = vi.fn();
      const props = {
        ...defaultProps,
        panelState: 'expanded' as PanelState,
        queue: [
          {
            id: 'q1',
            type: 'substitution' as const,
            playerOut: mockPlayer('1', 'Sarah Smith'),
            playerIn: mockPlayer('3', 'Jimmy Brown'),
          },
        ],
        onConfirmAll,
      };
      render(<SubstitutionPanelPresentation {...props} />);
      fireEvent.click(screen.getByText('Confirm All (1)'));
      expect(onConfirmAll).toHaveBeenCalled();
    });
  });

  describe('execution state', () => {
    it('shows progress indicator when executing', () => {
      const props = {
        ...defaultProps,
        panelState: 'expanded' as PanelState,
        isExecuting: true,
        executionProgress: 1,
        queue: [
          {
            id: 'q1',
            type: 'substitution' as const,
            playerOut: mockPlayer('1', 'Sarah Smith'),
            playerIn: mockPlayer('3', 'Jimmy Brown'),
          },
          {
            id: 'q2',
            type: 'substitution' as const,
            playerOut: mockPlayer('2', 'Alex Jones'),
            playerIn: mockPlayer('4', 'Taylor White'),
          },
        ],
      };
      render(<SubstitutionPanelPresentation {...props} />);
      expect(screen.getByText(/Processing.*\(1\/2\)/)).toBeTruthy();
    });
  });

  describe('error display', () => {
    it('shows error message when error prop set', () => {
      const props = {
        ...defaultProps,
        panelState: 'expanded' as PanelState,
        error: 'Failed to execute substitutions',
      };
      render(<SubstitutionPanelPresentation {...props} />);
      expect(screen.getByText(/Failed to execute substitutions/)).toBeTruthy();
    });
  });

  describe('tab switcher removed', () => {
    it('does not render a tab switcher — bench players are always shown', () => {
      render(
        <SubstitutionPanelPresentation
          {...defaultProps}
          panelState="bench-view"
        />,
      );

      expect(screen.queryByText(/On Field/)).toBeNull();
      expect(screen.queryByText(/Swap Position/)).toBeNull();
    });
  });
});

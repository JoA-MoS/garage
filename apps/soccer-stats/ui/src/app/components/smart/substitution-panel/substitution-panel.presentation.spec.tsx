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
  onFieldPlayers: [
    mockPlayer('1', 'Sarah Smith', '7'),
    mockPlayer('2', 'Alex Jones', '10'),
  ],
  benchPlayers: [
    mockPlayer('3', 'Jimmy Brown', '12'),
    mockPlayer('4', 'Taylor White', '9'),
  ],
  playTimeByPlayer: new Map([
    ['1', { minutes: 15, isOnField: true }],
    ['2', { minutes: 10, isOnField: true }],
    ['3', { minutes: 5, isOnField: false }],
    ['4', { minutes: 0, isOnField: false }],
  ]),
  selection: { direction: null, fieldPlayer: null, benchPlayer: null },
  onFieldPlayerClick: vi.fn(),
  onBenchPlayerClick: vi.fn(),
  onClearSelection: vi.fn(),
  queue: [],
  onRemoveFromQueue: vi.fn(),
  onConfirmAll: vi.fn(),
  onRequestRemoval: vi.fn(),
  onRequestAddition: vi.fn(),
  currentOnFieldCount: 2,
  maxOnField: null,
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
      expect(screen.getByText('5 min')).toBeTruthy();
      expect(screen.getByText('0 min')).toBeTruthy();
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
    // The addition action lives as a placeholder card inside the "On Field"
    // tab grid (same shape/placement as the lineup-panel's "Add to Field"
    // card), not a standalone footer button - so tests switch to that tab.
    const benchFirstProps = {
      ...defaultProps,
      panelState: 'bench-view' as PanelState,
      selection: {
        direction: 'bench-first' as const,
        fieldPlayer: null,
        benchPlayer: mockPlayer('3', 'Jimmy Brown', '12'),
      },
    };

    it('shows an enabled "Add to Field" placeholder card in the On Field tab when below capacity', () => {
      render(
        <SubstitutionPanelPresentation {...benchFirstProps} maxOnField={3} />,
      );
      fireEvent.click(screen.getByText(/On Field/));
      const button = screen.getByText('Add to Field').closest('button');
      expect(button).toBeTruthy();
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });

    it('renders the placeholder alongside the real on-field player chips, not in place of them', () => {
      render(
        <SubstitutionPanelPresentation {...benchFirstProps} maxOnField={3} />,
      );
      fireEvent.click(screen.getByText(/On Field/));
      expect(screen.getByText('Sarah Smith')).toBeTruthy();
      expect(screen.getByText('Alex Jones')).toBeTruthy();
      expect(screen.getByText('Add to Field')).toBeTruthy();
    });

    it('calls onRequestAddition with the selected bench player when clicked', () => {
      const onRequestAddition = vi.fn();
      render(
        <SubstitutionPanelPresentation
          {...benchFirstProps}
          maxOnField={3}
          onRequestAddition={onRequestAddition}
        />,
      );
      fireEvent.click(screen.getByText(/On Field/));
      fireEvent.click(screen.getByText('Add to Field'));
      expect(onRequestAddition).toHaveBeenCalledWith(
        expect.objectContaining({ playerName: 'Jimmy Brown' }),
      );
    });

    it('disables the placeholder and shows the field-full count at capacity', () => {
      // defaultProps has 2 onFieldPlayers; cap it at 2
      render(
        <SubstitutionPanelPresentation {...benchFirstProps} maxOnField={2} />,
      );
      fireEvent.click(screen.getByText(/On Field/));
      const button = screen.getByText('Field Full (2/2)').closest('button');
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });

    it('does not show the addition placeholder when no bench player is selected', () => {
      render(
        <SubstitutionPanelPresentation
          {...defaultProps}
          panelState="bench-view"
          maxOnField={3}
        />,
      );
      fireEvent.click(screen.getByText(/On Field/));
      expect(screen.queryByText('Add to Field')).toBeFalsy();
      expect(screen.queryByText(/Field Full/)).toBeFalsy();
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

  describe('tab switching', () => {
    it('shows tabs when field player is selected (field-first)', () => {
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
      // Should show both tabs
      expect(screen.getByText(/Bench \(\d+\)/)).toBeTruthy();
      expect(screen.getByText(/Swap Position \(\d+\)/)).toBeTruthy();
    });

    it('shows an "On Field" tab (not "Swap Position") when no selection is active', () => {
      const props = {
        ...defaultProps,
        panelState: 'bench-view' as PanelState,
        selection: { direction: null, fieldPlayer: null, benchPlayer: null },
      };
      render(<SubstitutionPanelPresentation {...props} />);
      // Both tabs are always available so play time can be compared across
      // the full roster before deciding who to sub - see PlayerSelectionTabs.
      expect(screen.getByText(/Bench \(\d+\)/)).toBeTruthy();
      expect(screen.getByText(/On Field \(\d+\)/)).toBeTruthy();
      expect(screen.queryByText(/Swap Position/)).toBeFalsy();
    });

    it('shows play time for on-field players, not just the bench', () => {
      const props = {
        ...defaultProps,
        panelState: 'bench-view' as PanelState,
        selection: { direction: null, fieldPlayer: null, benchPlayer: null },
      };
      render(<SubstitutionPanelPresentation {...props} />);

      fireEvent.click(screen.getByText(/On Field/));

      // Sarah Smith (15 min) and Alex Jones (10 min) per defaultProps.playTimeByPlayer
      expect(screen.getByText(/15 min/)).toBeTruthy();
      expect(screen.getByText(/10 min/)).toBeTruthy();
    });

    it('switches to swap position tab when clicked', () => {
      const onFieldPlayerClick = vi.fn();
      const props = {
        ...defaultProps,
        panelState: 'bench-view' as PanelState,
        selection: {
          direction: 'field-first' as const,
          fieldPlayer: mockPlayer('1', 'Sarah Smith', '7'),
          benchPlayer: null,
        },
        onFieldPlayerClick,
      };
      render(<SubstitutionPanelPresentation {...props} />);

      // Click swap position tab
      fireEvent.click(screen.getByText(/Swap Position/));

      // Should show on-field players (Alex Jones, but not Sarah Smith who is selected)
      expect(screen.getByText('Alex Jones')).toBeTruthy();
    });

    it('calls onFieldPlayerClick when swap player clicked', () => {
      const onFieldPlayerClick = vi.fn();
      const props = {
        ...defaultProps,
        panelState: 'bench-view' as PanelState,
        selection: {
          direction: 'field-first' as const,
          fieldPlayer: mockPlayer('1', 'Sarah Smith', '7'),
          benchPlayer: null,
        },
        onFieldPlayerClick,
      };
      render(<SubstitutionPanelPresentation {...props} />);

      // Click swap position tab
      fireEvent.click(screen.getByText(/Swap Position/));

      // Click on Alex Jones to swap
      fireEvent.click(screen.getByText('Alex Jones'));
      expect(onFieldPlayerClick).toHaveBeenCalledWith(
        expect.objectContaining({ playerName: 'Alex Jones' }),
      );
    });
  });
});

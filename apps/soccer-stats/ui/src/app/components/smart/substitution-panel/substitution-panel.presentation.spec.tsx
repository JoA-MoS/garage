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
});

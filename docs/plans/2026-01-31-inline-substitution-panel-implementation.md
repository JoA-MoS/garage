# Inline Substitution Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the blocking substitution modal with a non-blocking collapsible bottom panel that supports two-tap substitutions and position swaps.

**Architecture:** Create a new `SubstitutionPanel` component (smart + presentation pattern) that renders inline on the game page. The panel uses the same queue-based batch mutation logic as the existing modal but with a streamlined tap-tap selection flow. A new `usePlayTime` hook calculates player minutes from game events.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Apollo Client, Vitest

---

## Task 1: Create usePlayTime Hook

**Files:**
- Create: `apps/soccer-stats/ui/src/app/hooks/use-play-time.ts`
- Create: `apps/soccer-stats/ui/src/app/hooks/use-play-time.spec.ts`

**Step 1: Write the failing test**

```typescript
// apps/soccer-stats/ui/src/app/hooks/use-play-time.spec.ts
import { describe, it, expect } from 'vitest';
import { calculatePlayTime, PlayTimeResult } from './use-play-time';

describe('calculatePlayTime', () => {
  it('returns 0 for player with no events', () => {
    const result = calculatePlayTime('player-1', [], { period: '1', periodSecond: 0 });
    expect(result).toEqual({ playerId: 'player-1', minutes: 0, isOnField: false });
  });

  it('calculates time for player currently on field', () => {
    const events = [
      {
        id: 'evt-1',
        playerId: 'player-1',
        eventType: { category: 'STARTER' },
        period: '1',
        periodSecond: 0,
      },
    ];
    const result = calculatePlayTime('player-1', events, { period: '1', periodSecond: 300 });
    expect(result).toEqual({ playerId: 'player-1', minutes: 5, isOnField: true });
  });

  it('calculates time for player who was substituted out', () => {
    const events = [
      {
        id: 'evt-1',
        playerId: 'player-1',
        eventType: { category: 'STARTER' },
        period: '1',
        periodSecond: 0,
      },
      {
        id: 'evt-2',
        playerId: 'player-2',
        eventType: { category: 'SUBSTITUTION' },
        period: '1',
        periodSecond: 600,
        childEvents: [{ playerId: 'player-1', eventType: { name: 'SUBSTITUTION_OUT' } }],
      },
    ];
    const result = calculatePlayTime('player-1', events, { period: '1', periodSecond: 900 });
    expect(result).toEqual({ playerId: 'player-1', minutes: 10, isOnField: false });
  });

  it('handles multiple stints (sub out then back in)', () => {
    const events = [
      {
        id: 'evt-1',
        playerId: 'player-1',
        eventType: { category: 'STARTER' },
        period: '1',
        periodSecond: 0,
      },
      {
        id: 'evt-2',
        playerId: 'player-2',
        eventType: { category: 'SUBSTITUTION' },
        period: '1',
        periodSecond: 300,
        childEvents: [{ playerId: 'player-1', eventType: { name: 'SUBSTITUTION_OUT' } }],
      },
      {
        id: 'evt-3',
        playerId: 'player-1',
        eventType: { category: 'SUBSTITUTION' },
        period: '1',
        periodSecond: 600,
        childEvents: [{ playerId: 'player-2', eventType: { name: 'SUBSTITUTION_OUT' } }],
      },
    ];
    const result = calculatePlayTime('player-1', events, { period: '1', periodSecond: 900 });
    // 5 min (0-300) + 5 min (600-900) = 10 min
    expect(result).toEqual({ playerId: 'player-1', minutes: 10, isOnField: true });
  });

  it('handles period transitions correctly', () => {
    const events = [
      {
        id: 'evt-1',
        playerId: 'player-1',
        eventType: { category: 'STARTER' },
        period: '1',
        periodSecond: 0,
      },
    ];
    // Player started period 1 at 0, now in period 2 at 5:00
    // Assuming period 1 is 25 min (1500 sec), total = 1500 + 300 = 1800 sec = 30 min
    const result = calculatePlayTime('player-1', events, { period: '2', periodSecond: 300 }, 1500);
    expect(result).toEqual({ playerId: 'player-1', minutes: 30, isOnField: true });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test soccer-stats-ui --testFile=use-play-time.spec.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// apps/soccer-stats/ui/src/app/hooks/use-play-time.ts
import { useMemo } from 'react';

export interface PlayTimeResult {
  playerId: string;
  minutes: number;
  isOnField: boolean;
}

interface GameEvent {
  id: string;
  playerId?: string | null;
  externalPlayerName?: string | null;
  eventType: { category: string; name?: string };
  period: string;
  periodSecond: number;
  childEvents?: Array<{
    playerId?: string | null;
    externalPlayerName?: string | null;
    eventType: { name: string };
  }>;
}

interface GameTime {
  period: string;
  periodSecond: number;
}

/**
 * Convert period + periodSecond to absolute seconds from game start
 * @param period - Period number as string ("1", "2", etc.)
 * @param periodSecond - Seconds into the period
 * @param periodLengthSeconds - Length of each period in seconds (default 1500 = 25 min)
 */
function toAbsoluteSeconds(
  period: string,
  periodSecond: number,
  periodLengthSeconds = 1500
): number {
  const periodNum = parseInt(period, 10) || 1;
  return (periodNum - 1) * periodLengthSeconds + periodSecond;
}

/**
 * Calculate play time for a single player from game events
 */
export function calculatePlayTime(
  playerId: string,
  events: GameEvent[],
  currentTime: GameTime,
  periodLengthSeconds = 1500
): PlayTimeResult {
  // Track stints: when player went on and off field
  const stints: Array<{ onTime: number; offTime: number | null }> = [];

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => {
    const aTime = toAbsoluteSeconds(a.period, a.periodSecond, periodLengthSeconds);
    const bTime = toAbsoluteSeconds(b.period, b.periodSecond, periodLengthSeconds);
    return aTime - bTime;
  });

  let isCurrentlyOnField = false;

  for (const event of sortedEvents) {
    const eventTime = toAbsoluteSeconds(event.period, event.periodSecond, periodLengthSeconds);

    // Check if this player started
    if (
      event.eventType.category === 'STARTER' &&
      (event.playerId === playerId || event.externalPlayerName === playerId)
    ) {
      stints.push({ onTime: eventTime, offTime: null });
      isCurrentlyOnField = true;
      continue;
    }

    // Check if this player came on as a substitute
    if (
      event.eventType.category === 'SUBSTITUTION' &&
      (event.playerId === playerId || event.externalPlayerName === playerId)
    ) {
      stints.push({ onTime: eventTime, offTime: null });
      isCurrentlyOnField = true;
      continue;
    }

    // Check if this player was substituted out (in childEvents)
    if (event.eventType.category === 'SUBSTITUTION' && event.childEvents) {
      const subOut = event.childEvents.find(
        (ce) =>
          ce.eventType.name === 'SUBSTITUTION_OUT' &&
          (ce.playerId === playerId || ce.externalPlayerName === playerId)
      );
      if (subOut) {
        // Close the last open stint
        const lastStint = stints[stints.length - 1];
        if (lastStint && lastStint.offTime === null) {
          lastStint.offTime = eventTime;
        }
        isCurrentlyOnField = false;
      }
    }
  }

  // Calculate total time
  const currentAbsoluteTime = toAbsoluteSeconds(
    currentTime.period,
    currentTime.periodSecond,
    periodLengthSeconds
  );

  let totalSeconds = 0;
  for (const stint of stints) {
    const endTime = stint.offTime ?? currentAbsoluteTime;
    totalSeconds += endTime - stint.onTime;
  }

  return {
    playerId,
    minutes: Math.floor(totalSeconds / 60),
    isOnField: isCurrentlyOnField,
  };
}

/**
 * Hook to calculate play time for all players in a roster
 */
export function usePlayTime(
  playerIds: string[],
  events: GameEvent[],
  currentTime: GameTime,
  periodLengthSeconds = 1500
): Map<string, PlayTimeResult> {
  return useMemo(() => {
    const results = new Map<string, PlayTimeResult>();
    for (const playerId of playerIds) {
      results.set(playerId, calculatePlayTime(playerId, events, currentTime, periodLengthSeconds));
    }
    return results;
  }, [playerIds, events, currentTime, periodLengthSeconds]);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm nx test soccer-stats-ui --testFile=use-play-time.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/soccer-stats/ui/src/app/hooks/use-play-time.ts apps/soccer-stats/ui/src/app/hooks/use-play-time.spec.ts
git commit -m "feat(soccer-stats-ui): add usePlayTime hook for calculating player minutes"
```

---

## Task 2: Create Substitution Panel Types

**Files:**
- Create: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/types.ts`

**Step 1: Create shared types**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/substitution-panel/types.ts
import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

/**
 * Panel visual state
 */
export type PanelState = 'collapsed' | 'bench-view' | 'expanded';

/**
 * Selection direction - which type of player was selected first
 */
export type SelectionDirection = 'field-first' | 'bench-first' | null;

/**
 * Currently selected player for substitution
 */
export interface PlayerSelection {
  direction: SelectionDirection;
  fieldPlayer: GqlRosterPlayer | null;  // Player on field (going out)
  benchPlayer: GqlRosterPlayer | null;  // Player on bench (coming in)
}

/**
 * A player involved in a swap (can be on-field or incoming from queued sub)
 */
export type SwapPlayer =
  | {
      source: 'onField';
      player: GqlRosterPlayer;
      gameEventId: string;
    }
  | {
      source: 'queuedSub';
      player: GqlRosterPlayer;
      queuedSubId: string;
    };

/**
 * Queued item - either a substitution or a position swap
 */
export type QueuedItem =
  | {
      id: string;
      type: 'substitution';
      playerOut: GqlRosterPlayer;
      playerIn: GqlRosterPlayer;
    }
  | {
      id: string;
      type: 'swap';
      player1: SwapPlayer;
      player2: SwapPlayer;
    };

/**
 * Props for the presentation component
 */
export interface SubstitutionPanelPresentationProps {
  // Panel state
  panelState: PanelState;
  onPanelStateChange: (state: PanelState) => void;

  // Team info
  teamName: string;
  teamColor: string;

  // Player data
  onFieldPlayers: GqlRosterPlayer[];
  benchPlayers: GqlRosterPlayer[];
  playTimeByPlayer: Map<string, { minutes: number; isOnField: boolean }>;

  // Selection state
  selection: PlayerSelection;
  onFieldPlayerClick: (player: GqlRosterPlayer) => void;
  onBenchPlayerClick: (player: GqlRosterPlayer) => void;
  onClearSelection: () => void;

  // Queue
  queue: QueuedItem[];
  onRemoveFromQueue: (queueId: string) => void;
  onConfirmAll: () => void;

  // Execution state
  isExecuting: boolean;
  executionProgress: number;
  error: string | null;

  // Game time display
  period: string;
  periodSecond: number;
}

/**
 * Props for the smart component
 */
export interface SubstitutionPanelSmartProps {
  gameTeamId: string;
  gameId: string;
  teamName: string;
  teamColor: string;
  onField: GqlRosterPlayer[];
  bench: GqlRosterPlayer[];
  period: string;
  periodSecond: number;
  gameEvents: Array<{
    id: string;
    playerId?: string | null;
    externalPlayerName?: string | null;
    eventType: { category: string; name?: string };
    period: string;
    periodSecond: number;
    childEvents?: Array<{
      playerId?: string | null;
      externalPlayerName?: string | null;
      eventType: { name: string };
    }>;
  }>;
  onSubstitutionComplete?: () => void;
}
```

**Step 2: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/substitution-panel/types.ts
git commit -m "feat(soccer-stats-ui): add substitution panel types"
```

---

## Task 3: Create Substitution Panel Presentation Component

**Files:**
- Create: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.tsx`
- Create: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.spec.tsx`

**Step 1: Write failing tests for key behaviors**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.spec.tsx
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
  onFieldPlayers: [mockPlayer('1', 'Sarah Smith', '7'), mockPlayer('2', 'Alex Jones', '10')],
  benchPlayers: [mockPlayer('3', 'Jimmy Brown', '12'), mockPlayer('4', 'Taylor White', '9')],
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
    it('shows collapsed bar with queue count', () => {
      render(<SubstitutionPanelPresentation {...defaultProps} />);
      expect(screen.getByText('Substitutions')).toBeInTheDocument();
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
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('bench-view state', () => {
    it('shows bench players when panel is in bench-view', () => {
      const props = { ...defaultProps, panelState: 'bench-view' as PanelState };
      render(<SubstitutionPanelPresentation {...props} />);
      expect(screen.getByText('Jimmy Brown')).toBeInTheDocument();
      expect(screen.getByText('Taylor White')).toBeInTheDocument();
    });

    it('shows play time for bench players', () => {
      const props = { ...defaultProps, panelState: 'bench-view' as PanelState };
      render(<SubstitutionPanelPresentation {...props} />);
      expect(screen.getByText('5 min')).toBeInTheDocument();
      expect(screen.getByText('0 min')).toBeInTheDocument();
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
      expect(screen.getByText(/Replacing.*Sarah Smith/)).toBeInTheDocument();
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
        expect.objectContaining({ playerName: 'Jimmy Brown' })
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
      expect(screen.getByText('Sarah Smith')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
      expect(screen.getByText('Jimmy Brown')).toBeInTheDocument();
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
      expect(screen.getByText('Confirm All (1)')).toBeInTheDocument();
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
      expect(screen.getByText(/Processing.*1\/2/)).toBeInTheDocument();
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
      expect(screen.getByText(/Failed to execute substitutions/)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test soccer-stats-ui --testFile=substitution-panel.presentation.spec.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Write the presentation component**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.presentation.tsx
import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';
import { fromPeriodSecond } from '@garage/soccer-stats/utils';
import { SubstitutionPanelPresentationProps, QueuedItem } from './types';

/**
 * Get display name for a player
 */
function getPlayerDisplayName(player: GqlRosterPlayer): string {
  if (player.playerName) return player.playerName;
  if (player.firstName || player.lastName) {
    return `${player.firstName || ''} ${player.lastName || ''}`.trim();
  }
  if (player.externalPlayerName) return player.externalPlayerName;
  return 'Unknown';
}

/**
 * Get jersey number display
 */
function getJerseyNumber(player: GqlRosterPlayer): string | null {
  return player.externalPlayerNumber || null;
}

/**
 * Presentation component for the inline substitution panel
 */
export const SubstitutionPanelPresentation = ({
  panelState,
  onPanelStateChange,
  teamName,
  teamColor,
  onFieldPlayers,
  benchPlayers,
  playTimeByPlayer,
  selection,
  onFieldPlayerClick,
  onBenchPlayerClick,
  onClearSelection,
  queue,
  onRemoveFromQueue,
  onConfirmAll,
  isExecuting,
  executionProgress,
  error,
  period,
  periodSecond,
}: SubstitutionPanelPresentationProps) => {
  const { minute, second } = fromPeriodSecond(periodSecond);
  const timeDisplay = `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

  const getPlayerId = (player: GqlRosterPlayer) =>
    player.playerId || player.externalPlayerName || '';

  // Render collapsed bar
  if (panelState === 'collapsed') {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg border-t border-gray-200"
        onClick={() => onPanelStateChange('bench-view')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onPanelStateChange('bench-view')}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: teamColor }}
            />
            <span className="font-medium text-gray-900">Substitutions</span>
          </div>
          {queue.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {queue.length}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render bench view or expanded
  const isExpanded = panelState === 'expanded';
  const panelHeight = isExpanded ? 'max-h-[60vh]' : 'max-h-[40vh]';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg border-t border-gray-200 ${panelHeight} overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer"
        onClick={() => onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          e.key === 'Enter' &&
          onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')
        }
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <span className="font-medium text-gray-900">{teamName}</span>
          <span className="text-sm text-gray-500">
            P{period} {timeDisplay}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPanelStateChange('collapsed');
          }}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label="Collapse panel"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Selection header */}
      {selection.direction && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          {selection.direction === 'field-first' && selection.fieldPlayer && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Replacing: <span className="font-medium text-red-600">{getPlayerDisplayName(selection.fieldPlayer)}</span>
              </span>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
          {selection.direction === 'bench-first' && selection.benchPlayer && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Bringing in: <span className="font-medium text-green-600">{getPlayerDisplayName(selection.benchPlayer)}</span>
                <span className="text-gray-500"> — tap player to replace</span>
              </span>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Queued items (shown in expanded view or when has items) */}
        {(isExpanded || queue.length > 0) && queue.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-xs font-medium uppercase text-gray-500 mb-2">
              Queued ({queue.length})
            </div>
            <div className="space-y-2">
              {queue.map((item) => (
                <QueuedItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => onRemoveFromQueue(item.id)}
                  disabled={isExecuting}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bench players */}
        {!isExecuting && (
          <div className="px-4 py-3">
            <div className="text-xs font-medium uppercase text-gray-500 mb-2">
              Bench
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {benchPlayers.map((player) => {
                const id = getPlayerId(player);
                const playTime = playTimeByPlayer.get(id);
                const isSelected =
                  selection.direction === 'bench-first' &&
                  selection.benchPlayer?.playerId === player.playerId;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onBenchPlayerClick(player)}
                    className={`flex flex-col items-start p-2 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getJerseyNumber(player) && (
                        <span className="text-xs font-bold text-gray-600">
                          #{getJerseyNumber(player)}
                        </span>
                      )}
                      <span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                        {getPlayerDisplayName(player)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {playTime?.minutes ?? 0} min
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* On-field players for swaps (only in expanded view with field-first selection) */}
        {isExpanded && selection.direction === 'field-first' && selection.fieldPlayer && (
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="text-xs font-medium uppercase text-gray-500 mb-2">
              Swap Position With
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {onFieldPlayers
                .filter((p) => p.gameEventId !== selection.fieldPlayer?.gameEventId)
                .map((player) => {
                  const id = getPlayerId(player);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onFieldPlayerClick(player)}
                      className="flex flex-col items-start p-2 rounded-lg border border-purple-200 bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {getJerseyNumber(player) && (
                          <span className="text-xs font-bold text-purple-600">
                            #{getJerseyNumber(player)}
                          </span>
                        )}
                        <span className="text-sm font-medium text-purple-900">
                          {getPlayerDisplayName(player)}
                        </span>
                      </div>
                      <span className="text-xs text-purple-600">
                        {player.position || 'No position'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Execution progress */}
        {isExecuting && (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-gray-600">
              Processing... ({executionProgress}/{queue.length})
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mx-4 my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}
      </div>

      {/* Footer with confirm button */}
      {queue.length > 0 && !isExecuting && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onConfirmAll}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Confirm All ({queue.length})
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Row component for a queued item
 */
function QueuedItemRow({
  item,
  onRemove,
  disabled,
}: {
  item: QueuedItem;
  onRemove: () => void;
  disabled: boolean;
}) {
  if (item.type === 'substitution') {
    return (
      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-600">
            S
          </span>
          <span className="text-red-600">{getPlayerDisplayName(item.playerOut)}</span>
          <span className="text-gray-400">→</span>
          <span className="text-green-600">{getPlayerDisplayName(item.playerIn)}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          aria-label="Remove from queue"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  // Position swap
  return (
    <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-white p-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-xs font-medium text-purple-600">
          P
        </span>
        <span className="text-gray-900">{getPlayerDisplayName(item.player1.player)}</span>
        <span className="text-purple-500">↔</span>
        <span className="text-gray-900">{getPlayerDisplayName(item.player2.player)}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
        aria-label="Remove from queue"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
```

**Step 4: Run tests**

Run: `pnpm nx test soccer-stats-ui --testFile=substitution-panel.presentation.spec.tsx`
Expected: PASS (may need to adjust some test expectations based on actual rendering)

**Step 5: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/substitution-panel/
git commit -m "feat(soccer-stats-ui): add SubstitutionPanelPresentation component"
```

---

## Task 4: Create Substitution Panel Smart Component

**Files:**
- Create: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.smart.tsx`
- Create: `apps/soccer-stats/ui/src/app/components/smart/substitution-panel/index.ts`

**Step 1: Write the smart component**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/substitution-panel/substitution-panel.smart.tsx
import { useState, useCallback, useMemo } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import {
  RosterPlayer as GqlRosterPlayer,
  BatchSubstitutionInput,
  BatchSwapInput,
} from '@garage/soccer-stats/graphql-codegen';

import {
  BATCH_LINEUP_CHANGES,
  GET_GAME_BY_ID,
  GET_GAME_ROSTER,
} from '../../../services/games-graphql.service';
import { calculatePlayTime } from '../../../hooks/use-play-time';
import { SubstitutionPanelPresentation } from './substitution-panel.presentation';
import {
  SubstitutionPanelSmartProps,
  PanelState,
  PlayerSelection,
  QueuedItem,
  SwapPlayer,
} from './types';

/**
 * Get player ID for matching
 */
const getPlayerId = (player: GqlRosterPlayer) =>
  player.playerId || player.externalPlayerName || '';

/**
 * Smart component for substitution panel - manages state and mutations
 */
export const SubstitutionPanel = ({
  gameTeamId,
  gameId,
  teamName,
  teamColor,
  onField,
  bench,
  period,
  periodSecond,
  gameEvents,
  onSubstitutionComplete,
}: SubstitutionPanelSmartProps) => {
  // Panel state
  const [panelState, setPanelState] = useState<PanelState>('collapsed');

  // Selection state
  const [selection, setSelection] = useState<PlayerSelection>({
    direction: null,
    fieldPlayer: null,
    benchPlayer: null,
  });

  // Queue state
  const [queue, setQueue] = useState<QueuedItem[]>([]);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Apollo
  const client = useApolloClient();
  const [batchLineupChanges] = useMutation(BATCH_LINEUP_CHANGES);

  // Calculate play time for all players
  const playTimeByPlayer = useMemo(() => {
    const allPlayerIds = [
      ...onField.map(getPlayerId),
      ...bench.map(getPlayerId),
    ];
    const results = new Map<string, { minutes: number; isOnField: boolean }>();

    for (const playerId of allPlayerIds) {
      const result = calculatePlayTime(playerId, gameEvents, { period, periodSecond });
      results.set(playerId, { minutes: result.minutes, isOnField: result.isOnField });
    }

    return results;
  }, [onField, bench, gameEvents, period, periodSecond]);

  // Get queued player IDs
  const getQueuedPlayerIds = useCallback(() => {
    const outIds = new Set<string>();
    const inIds = new Set<string>();
    const swapPlayerIds = new Set<string>();

    queue.forEach((item) => {
      if (item.type === 'substitution') {
        outIds.add(item.playerOut.gameEventId);
        inIds.add(getPlayerId(item.playerIn));
      } else {
        swapPlayerIds.add(getPlayerId(item.player1.player));
        swapPlayerIds.add(getPlayerId(item.player2.player));
      }
    });

    return { outIds, inIds, swapPlayerIds };
  }, [queue]);

  // Filter available players
  const { outIds, inIds, swapPlayerIds } = getQueuedPlayerIds();
  const onFieldPlayerIds = new Set(onField.map(getPlayerId));

  const availableOnField = useMemo(
    () =>
      onField.filter(
        (p) => !outIds.has(p.gameEventId) && !swapPlayerIds.has(getPlayerId(p))
      ),
    [onField, outIds, swapPlayerIds]
  );

  const availableBench = useMemo(
    () =>
      bench.filter((b) => {
        const id = getPlayerId(b);
        return !inIds.has(id) && !onFieldPlayerIds.has(id);
      }),
    [bench, inIds, onFieldPlayerIds]
  );

  // Handle field player click
  const handleFieldPlayerClick = useCallback(
    (player: GqlRosterPlayer) => {
      // If no selection, start field-first selection
      if (!selection.direction) {
        setSelection({
          direction: 'field-first',
          fieldPlayer: player,
          benchPlayer: null,
        });
        setPanelState('bench-view');
        return;
      }

      // If field-first and clicking another field player = position swap
      if (selection.direction === 'field-first' && selection.fieldPlayer) {
        // Don't swap with self
        if (player.gameEventId === selection.fieldPlayer.gameEventId) {
          // Deselect
          setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });
          return;
        }

        // Queue position swap
        const swapItem: QueuedItem = {
          id: `swap-${Date.now()}-${Math.random()}`,
          type: 'swap',
          player1: {
            source: 'onField',
            player: selection.fieldPlayer,
            gameEventId: selection.fieldPlayer.gameEventId,
          },
          player2: {
            source: 'onField',
            player,
            gameEventId: player.gameEventId,
          },
        };
        setQueue((prev) => [...prev, swapItem]);
        setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });
        return;
      }

      // If bench-first, complete the substitution
      if (selection.direction === 'bench-first' && selection.benchPlayer) {
        const subItem: QueuedItem = {
          id: `sub-${Date.now()}-${Math.random()}`,
          type: 'substitution',
          playerOut: player,
          playerIn: selection.benchPlayer,
        };
        setQueue((prev) => [...prev, subItem]);
        setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });
      }
    },
    [selection]
  );

  // Handle bench player click
  const handleBenchPlayerClick = useCallback(
    (player: GqlRosterPlayer) => {
      // If no selection, start bench-first selection
      if (!selection.direction) {
        setSelection({
          direction: 'bench-first',
          fieldPlayer: null,
          benchPlayer: player,
        });
        return;
      }

      // If bench-first and clicking same player, deselect
      if (
        selection.direction === 'bench-first' &&
        getPlayerId(player) === getPlayerId(selection.benchPlayer!)
      ) {
        setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });
        return;
      }

      // If bench-first and clicking different bench player, switch selection
      if (selection.direction === 'bench-first') {
        setSelection({
          direction: 'bench-first',
          fieldPlayer: null,
          benchPlayer: player,
        });
        return;
      }

      // If field-first, complete the substitution
      if (selection.direction === 'field-first' && selection.fieldPlayer) {
        const subItem: QueuedItem = {
          id: `sub-${Date.now()}-${Math.random()}`,
          type: 'substitution',
          playerOut: selection.fieldPlayer,
          playerIn: player,
        };
        setQueue((prev) => [...prev, subItem]);
        setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });
      }
    },
    [selection]
  );

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });
  }, []);

  // Remove from queue
  const handleRemoveFromQueue = useCallback((queueId: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== queueId));
  }, []);

  // Confirm all queued changes
  const handleConfirmAll = useCallback(async () => {
    if (queue.length === 0) return;

    setIsExecuting(true);
    setExecutionProgress(0);
    setError(null);

    const subs = queue.filter(
      (q): q is Extract<QueuedItem, { type: 'substitution' }> => q.type === 'substitution'
    );
    const swaps = queue.filter(
      (q): q is Extract<QueuedItem, { type: 'swap' }> => q.type === 'swap'
    );

    const subIdToIndex = new Map<string, number>();
    subs.forEach((sub, index) => {
      subIdToIndex.set(sub.id, index);
    });

    try {
      const substitutionInputs: BatchSubstitutionInput[] = subs.map((sub) => ({
        playerOutEventId: sub.playerOut.gameEventId,
        playerInId: sub.playerIn.playerId || undefined,
        externalPlayerInName: sub.playerIn.externalPlayerName || undefined,
        externalPlayerInNumber: sub.playerIn.externalPlayerNumber || undefined,
      }));

      const swapInputs: BatchSwapInput[] = swaps.map((swap) => {
        const player1 =
          swap.player1.source === 'onField'
            ? { eventId: swap.player1.gameEventId }
            : { substitutionIndex: subIdToIndex.get(swap.player1.queuedSubId) };

        const player2 =
          swap.player2.source === 'onField'
            ? { eventId: swap.player2.gameEventId }
            : { substitutionIndex: subIdToIndex.get(swap.player2.queuedSubId) };

        return { player1, player2 };
      });

      await batchLineupChanges({
        variables: {
          input: {
            gameTeamId,
            period,
            periodSecond,
            substitutions: substitutionInputs,
            swaps: swapInputs,
          },
        },
      });

      setExecutionProgress(queue.length);

      // Refetch queries
      await Promise.all([
        client.query({
          query: GET_GAME_BY_ID,
          variables: { id: gameId },
          fetchPolicy: 'network-only',
        }),
        client.query({
          query: GET_GAME_ROSTER,
          variables: { gameTeamId },
          fetchPolicy: 'network-only',
        }),
      ]);

      // Clear queue and reset
      setQueue([]);
      setPanelState('collapsed');
      onSubstitutionComplete?.();
    } catch (err) {
      console.error('Failed to execute batch changes:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsExecuting(false);
    }
  }, [queue, gameTeamId, gameId, period, periodSecond, batchLineupChanges, client, onSubstitutionComplete]);

  return (
    <SubstitutionPanelPresentation
      panelState={panelState}
      onPanelStateChange={setPanelState}
      teamName={teamName}
      teamColor={teamColor}
      onFieldPlayers={availableOnField}
      benchPlayers={availableBench}
      playTimeByPlayer={playTimeByPlayer}
      selection={selection}
      onFieldPlayerClick={handleFieldPlayerClick}
      onBenchPlayerClick={handleBenchPlayerClick}
      onClearSelection={handleClearSelection}
      queue={queue}
      onRemoveFromQueue={handleRemoveFromQueue}
      onConfirmAll={handleConfirmAll}
      isExecuting={isExecuting}
      executionProgress={executionProgress}
      error={error}
      period={period}
      periodSecond={periodSecond}
    />
  );
};
```

**Step 2: Create barrel export**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/substitution-panel/index.ts
export { SubstitutionPanel } from './substitution-panel.smart';
export { SubstitutionPanelPresentation } from './substitution-panel.presentation';
export type {
  SubstitutionPanelSmartProps,
  SubstitutionPanelPresentationProps,
  PanelState,
  PlayerSelection,
  QueuedItem,
} from './types';
```

**Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/substitution-panel/
git commit -m "feat(soccer-stats-ui): add SubstitutionPanel smart component with queue logic"
```

---

## Task 5: Integrate Panel into Game Page

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx`

**Step 1: Add imports and state**

At the top of the file, add the import:

```typescript
import { SubstitutionPanel } from '../components/smart/substitution-panel';
```

**Step 2: Add panel state and props**

Find the existing state declarations (around line 125-143) and add:

```typescript
const [activeSubPanelTeam, setActiveSubPanelTeam] = useState<'home' | 'away' | null>(null);
```

**Step 3: Add handler for field player clicks**

Add a handler that will be called when field players are tapped:

```typescript
const handleFieldPlayerClickForSub = useCallback(
  (team: 'home' | 'away', player: GqlRosterPlayer) => {
    setActiveSubPanelTeam(team);
    // The panel will handle the selection internally
  },
  []
);
```

**Step 4: Render the SubstitutionPanel**

Find where the SubstitutionModal is rendered (around line 2246-2264) and add the new panel alongside or replace it:

```typescript
{/* Inline Substitution Panel */}
{activeSubPanelTeam && (
  <SubstitutionPanel
    gameTeamId={activeSubPanelTeam === 'home' ? homeTeam.id : awayTeam.id}
    gameId={gameId!}
    teamName={activeSubPanelTeam === 'home' ? homeTeamName : awayTeamName}
    teamColor={activeSubPanelTeam === 'home' ? homeColor : awayColor}
    onField={activeSubPanelTeam === 'home' ? homeOnField : awayOnField}
    bench={activeSubPanelTeam === 'home' ? homeBench : awayBench}
    period={currentPeriod}
    periodSecond={currentPeriodSeconds}
    gameEvents={game?.events || []}
    onSubstitutionComplete={() => setActiveSubPanelTeam(null)}
  />
)}
```

**Step 5: Update sticky bar to trigger panel**

Find where the sticky bar triggers the modal and update to use the panel:

```typescript
onSubClick={(team) => setActiveSubPanelTeam(team)}
```

**Step 6: Run lint and tests**

Run: `pnpm nx lint soccer-stats-ui && pnpm nx test soccer-stats-ui`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/soccer-stats/ui/src/app/pages/game.page.tsx
git commit -m "feat(soccer-stats-ui): integrate SubstitutionPanel into game page"
```

---

## Task 6: Add Field Player Click Handlers

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx` (field view components)

**Step 1: Identify where field players are rendered**

Look for the lineup/field view components in game.page.tsx or game-lineup-tab.smart.tsx.

**Step 2: Add click handlers to field player elements**

Update the field player rendering to include tap handlers:

```typescript
onClick={() => handleFieldPlayerClickForSub(activeTeam, player)}
```

**Step 3: Pass click handler down to lineup component if needed**

If field players are rendered in a child component, add the prop and pass it through.

**Step 4: Test the tap interaction**

Run: `pnpm nx serve soccer-stats-ui`
Manually test: Tap a field player → panel should open with that player selected

**Step 5: Commit**

```bash
git add apps/soccer-stats/ui/src/app/
git commit -m "feat(soccer-stats-ui): add field player click handlers for substitution panel"
```

---

## Task 7: Handle Background Click to Deselect

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx`

**Step 1: Add click handler to game page container**

Wrap the main content area with a click handler that deselects:

```typescript
const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
  // Only deselect if clicking directly on background, not on players
  if (e.target === e.currentTarget) {
    // Signal to panel to clear selection (if panel exposed this)
  }
}, []);
```

**Step 2: Alternative: Handle in panel presentation**

The panel already handles deselection via `onClearSelection`. The "tap background" behavior can be achieved by:
- Adding an overlay behind the panel when a selection is active
- Clicking the overlay clears the selection

Add to presentation component:

```typescript
{selection.direction && (
  <div
    className="fixed inset-0 z-30"
    onClick={onClearSelection}
    aria-hidden="true"
  />
)}
```

**Step 3: Test deselection**

Run: `pnpm nx serve soccer-stats-ui`
Test: Select a player → tap background → selection should clear

**Step 4: Commit**

```bash
git add apps/soccer-stats/ui/src/app/
git commit -m "feat(soccer-stats-ui): add background click to deselect player"
```

---

## Task 8: Final Integration Testing

**Step 1: Run all tests**

Run: `pnpm nx test soccer-stats-ui`
Expected: All tests pass

**Step 2: Run lint**

Run: `pnpm nx lint soccer-stats-ui`
Expected: No errors

**Step 3: Manual testing checklist**

- [ ] Panel shows collapsed bar at bottom
- [ ] Tapping collapsed bar opens bench view
- [ ] Tapping field player opens panel with selection
- [ ] Tapping bench player queues substitution
- [ ] Tapping another field player queues position swap
- [ ] Queue displays correctly with remove buttons
- [ ] Confirm All executes batch mutation
- [ ] Panel collapses after successful execution
- [ ] Can record goals while panel is open
- [ ] Background tap clears selection

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(soccer-stats-ui): complete inline substitution panel implementation"
```

---

## Summary

| Task | Component | Files |
|------|-----------|-------|
| 1 | usePlayTime Hook | hooks/use-play-time.ts |
| 2 | Types | components/smart/substitution-panel/types.ts |
| 3 | Presentation | components/smart/substitution-panel/substitution-panel.presentation.tsx |
| 4 | Smart Component | components/smart/substitution-panel/substitution-panel.smart.tsx |
| 5 | Game Page Integration | pages/game.page.tsx |
| 6 | Field Player Handlers | pages/game.page.tsx |
| 7 | Background Deselect | pages/game.page.tsx |
| 8 | Final Testing | - |

**Total estimated commits:** 8
**No backend changes required**

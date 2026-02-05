# Lineup Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an inline bottom panel for game lineup setup that mirrors the substitution panel UX for pre-game and halftime lineup configuration.

**Architecture:** The LineupPanel follows the same smart/presentation split as SubstitutionPanel. It uses queue-based state management where users stage changes, then execute them in batch. The panel integrates with the existing `useLineup` hook mutations and coordinates with the game page via props for field position clicks.

**Tech Stack:** React 18, TypeScript, Apollo Client, Tailwind CSS, existing useLineup hook

**Worktree:** `/home/joamos/code/github/garage/.worktrees/lineup-panel`

---

## Task 1: Create Types File

**Files:**
- Create: `apps/soccer-stats/ui/src/app/components/smart/lineup-panel/types.ts`

**Step 1: Create the types file**

```typescript
import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';
import { RosterPlayer as TeamRosterPlayer } from '../../../hooks/use-lineup';

/**
 * Panel visual state - matches substitution panel pattern
 */
export type PanelState = 'collapsed' | 'bench-view' | 'expanded';

/**
 * Selection direction - which type of selection was made first
 */
export type SelectionDirection = 'position-first' | 'player-first' | null;

/**
 * Currently selected state for lineup assignment
 */
export interface LineupSelection {
  direction: SelectionDirection;
  position: string | null;
  player: GqlRosterPlayer | TeamRosterPlayer | null;
  /** For player-first with roster player, tracks if it's from team roster vs game roster */
  playerSource: 'onField' | 'bench' | 'roster' | null;
}

/**
 * A queued lineup change
 */
export type QueuedLineupItem =
  | {
      id: string;
      type: 'assignment';
      position: string;
      player: GqlRosterPlayer | TeamRosterPlayer;
      playerSource: 'bench' | 'roster';
      /** If replacing someone already at this position */
      replacingPlayer?: GqlRosterPlayer;
    }
  | {
      id: string;
      type: 'position-change';
      player: GqlRosterPlayer;
      fromPosition: string;
      toPosition: string;
    }
  | {
      id: string;
      type: 'removal';
      player: GqlRosterPlayer;
      position: string;
    };

/**
 * Props for the presentation component
 */
export interface LineupPanelPresentationProps {
  // Panel state
  panelState: PanelState;
  onPanelStateChange: (state: PanelState) => void;

  // Context
  gameStatus: 'SCHEDULED' | 'HALFTIME';
  teamName: string;
  teamColor: string;
  formation: string | null;
  playersPerTeam: number;

  // Player data
  onFieldPlayers: GqlRosterPlayer[];
  benchPlayers: GqlRosterPlayer[];
  availableRoster: TeamRosterPlayer[];
  playTimeByPlayer?: Map<string, { minutes: number; isOnField: boolean }>;

  // Formation
  availableFormations: string[];
  onFormationChange: (formation: string) => void;

  // Selection state
  selection: LineupSelection;
  onPositionClick: (position: string) => void;
  onPlayerClick: (
    player: GqlRosterPlayer | TeamRosterPlayer,
    source: 'onField' | 'bench' | 'roster'
  ) => void;
  onClearSelection: () => void;

  // Queue
  queue: QueuedLineupItem[];
  onRemoveFromQueue: (queueId: string) => void;
  onConfirmAll: () => void;
  onClearQueue: () => void;

  // Quick actions (halftime only)
  onKeepSameLineup?: () => void;

  // Execution state
  isExecuting: boolean;
  executionProgress: number;
  error: string | null;

  // Positions info
  filledPositions: Set<string>;
  requiredPositions: string[];
}

/**
 * Props for the smart component
 */
export interface LineupPanelSmartProps {
  gameId: string;
  gameTeamId: string;
  gameStatus: 'SCHEDULED' | 'HALFTIME';
  teamName: string;
  teamColor: string;
  playersPerTeam: number;

  // Current lineup data (from useLineup hook)
  formation: string | null;
  onField: GqlRosterPlayer[];
  bench: GqlRosterPlayer[];
  availableRoster: TeamRosterPlayer[];

  // First half lineup for halftime comparison
  firstHalfLineup?: GqlRosterPlayer[];

  // Game events for play time calculation (halftime only)
  gameEvents?: Array<{
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

  // Callbacks
  onLineupComplete?: () => void;
  onFormationChange: (formation: string) => void;

  // External coordination (from field visualization clicks)
  externalPositionSelection?: string | null;
  onExternalPositionHandled?: () => void;

  // Notify parent of state changes
  onQueuedPositionsChange?: (positions: Set<string>) => void;
  onSelectedPositionChange?: (position: string | null) => void;
}
```

**Step 2: Create barrel export**

Create: `apps/soccer-stats/ui/src/app/components/smart/lineup-panel/index.ts`

```typescript
export * from './types';
export { LineupPanel } from './lineup-panel.smart';
```

**Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/lineup-panel/
git commit -m "feat(soccer-stats-ui): add lineup panel types"
```

---

## Task 2: Create Presentation Component Shell

**Files:**
- Create: `apps/soccer-stats/ui/src/app/components/smart/lineup-panel/lineup-panel.presentation.tsx`

**Step 1: Create presentation component with collapsed state**

```typescript
import { LineupPanelPresentationProps } from './types';

/**
 * Presentation component for the inline lineup panel
 */
export const LineupPanelPresentation = ({
  panelState,
  onPanelStateChange,
  gameStatus,
  teamName,
  teamColor,
  formation,
  playersPerTeam,
  onFieldPlayers,
  queue,
  filledPositions,
  requiredPositions,
}: LineupPanelPresentationProps) => {
  const filledCount = filledPositions.size;
  const totalPositions = playersPerTeam;
  const statusLabel = gameStatus === 'SCHEDULED' ? 'Starting Lineup' : 'Second Half Lineup';

  // Render collapsed bar
  if (panelState === 'collapsed') {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg"
        onClick={() => onPanelStateChange('bench-view')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onPanelStateChange('bench-view')}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="flex min-h-[44px] items-center justify-between px-4 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: teamColor }}
            />
            <span className="font-medium text-gray-900">{statusLabel}</span>
            <span className="text-sm text-gray-500">
              {filledCount}/{totalPositions}
            </span>
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

  // Render expanded states (bench-view or expanded)
  const isExpanded = panelState === 'expanded';
  const panelHeight = isExpanded ? 'max-h-[60vh]' : 'max-h-[40vh]';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col overflow-hidden border-t border-gray-200 bg-white shadow-lg ${panelHeight}`}
    >
      {/* Drag handle indicator - clickable to collapse */}
      <button
        type="button"
        onClick={() => onPanelStateChange('collapsed')}
        className="flex w-full cursor-pointer justify-center py-2"
        aria-label="Collapse panel"
      >
        <div className="h-1 w-10 rounded-full bg-gray-300" />
      </button>

      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-4 pb-3 pt-1"
        onClick={() => onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          e.key === 'Enter' && onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')
        }
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <span className="font-medium text-gray-900">{teamName}</span>
          <span className="text-sm text-gray-500">
            {formation || 'No formation'} • {filledCount}/{totalPositions}
          </span>
        </div>
      </div>

      {/* Content area - placeholder for now */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-sm text-gray-500">Panel content coming in next tasks...</p>
      </div>
    </div>
  );
};
```

**Step 2: Run lint to verify**

```bash
cd /home/joamos/code/github/garage/.worktrees/lineup-panel && pnpm nx lint soccer-stats-ui
```

Expected: PASS (warnings OK)

**Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/lineup-panel/
git commit -m "feat(soccer-stats-ui): add lineup panel presentation shell"
```

---

## Task 3: Create Smart Component Shell

**Files:**
- Create: `apps/soccer-stats/ui/src/app/components/smart/lineup-panel/lineup-panel.smart.tsx`

**Step 1: Create smart component with basic state management**

```typescript
import { useState, useCallback, useMemo, useEffect } from 'react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { getFormationsForTeamSize } from '../../../utils/formations';
import { LineupPanelPresentation } from './lineup-panel.presentation';
import {
  LineupPanelSmartProps,
  PanelState,
  LineupSelection,
  QueuedLineupItem,
} from './types';

/**
 * Smart component for lineup panel - manages state and mutations
 */
export const LineupPanel = ({
  gameId,
  gameTeamId,
  gameStatus,
  teamName,
  teamColor,
  playersPerTeam,
  formation,
  onField,
  bench,
  availableRoster,
  firstHalfLineup,
  gameEvents,
  onLineupComplete,
  onFormationChange,
  externalPositionSelection,
  onExternalPositionHandled,
  onQueuedPositionsChange,
  onSelectedPositionChange,
}: LineupPanelSmartProps) => {
  // Panel state - auto-expand if lineup incomplete (pre-game) or at halftime
  const shouldAutoExpand = gameStatus === 'HALFTIME' || onField.length === 0;
  const [panelState, setPanelState] = useState<PanelState>(
    shouldAutoExpand ? 'bench-view' : 'collapsed'
  );

  // Selection state
  const [selection, setSelection] = useState<LineupSelection>({
    direction: null,
    position: null,
    player: null,
    playerSource: null,
  });

  // Queue state
  const [queue, setQueue] = useState<QueuedLineupItem[]>([]);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Get available formations for team size
  const availableFormations = useMemo(
    () => getFormationsForTeamSize(playersPerTeam),
    [playersPerTeam]
  );

  // Calculate filled positions (current + queued assignments - queued removals)
  const filledPositions = useMemo(() => {
    const positions = new Set<string>();

    // Add current on-field positions
    onField.forEach((p) => {
      if (p.position) positions.add(p.position);
    });

    // Add queued assignments
    queue.forEach((item) => {
      if (item.type === 'assignment') {
        positions.add(item.position);
      } else if (item.type === 'position-change') {
        positions.delete(item.fromPosition);
        positions.add(item.toPosition);
      } else if (item.type === 'removal') {
        positions.delete(item.position);
      }
    });

    return positions;
  }, [onField, queue]);

  // Get required positions from formation (placeholder - will derive from formation)
  const requiredPositions = useMemo(() => {
    // TODO: Derive from formation string in a later task
    return [] as string[];
  }, [formation]);

  // Notify parent when queued positions change
  useEffect(() => {
    const queuedPositions = new Set<string>();
    queue.forEach((item) => {
      if (item.type === 'assignment' || item.type === 'position-change') {
        queuedPositions.add(item.type === 'assignment' ? item.position : item.toPosition);
      }
    });
    onQueuedPositionsChange?.(queuedPositions);
  }, [queue, onQueuedPositionsChange]);

  // Notify parent when selected position changes
  useEffect(() => {
    onSelectedPositionChange?.(selection.position);
  }, [selection.position, onSelectedPositionChange]);

  // Handle external position selection (from field visualization click)
  useEffect(() => {
    if (externalPositionSelection) {
      setPanelState('bench-view');
      setSelection({
        direction: 'position-first',
        position: externalPositionSelection,
        player: null,
        playerSource: null,
      });
      onExternalPositionHandled?.();
    }
  }, [externalPositionSelection, onExternalPositionHandled]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelection({ direction: null, position: null, player: null, playerSource: null });
  }, []);

  // Handle position click (placeholder - full implementation in later task)
  const handlePositionClick = useCallback((position: string) => {
    setError(null);
    // TODO: Implement in Task 5
    console.log('Position clicked:', position);
  }, []);

  // Handle player click (placeholder - full implementation in later task)
  const handlePlayerClick = useCallback(
    (player: GqlRosterPlayer | { id: string; oduserId: string }, source: 'onField' | 'bench' | 'roster') => {
      setError(null);
      // TODO: Implement in Task 5
      console.log('Player clicked:', player, source);
    },
    []
  );

  // Remove from queue
  const handleRemoveFromQueue = useCallback((queueId: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== queueId));
  }, []);

  // Clear queue
  const handleClearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Confirm all (placeholder - full implementation in later task)
  const handleConfirmAll = useCallback(async () => {
    // TODO: Implement in Task 7
    console.log('Confirm all:', queue);
  }, [queue]);

  // Keep same lineup (halftime shortcut)
  const handleKeepSameLineup = useCallback(async () => {
    if (gameStatus !== 'HALFTIME') return;
    // TODO: Implement in Task 8
    console.log('Keep same lineup');
  }, [gameStatus]);

  return (
    <LineupPanelPresentation
      panelState={panelState}
      onPanelStateChange={setPanelState}
      gameStatus={gameStatus}
      teamName={teamName}
      teamColor={teamColor}
      formation={formation}
      playersPerTeam={playersPerTeam}
      onFieldPlayers={onField}
      benchPlayers={bench}
      availableRoster={availableRoster}
      availableFormations={availableFormations}
      onFormationChange={onFormationChange}
      selection={selection}
      onPositionClick={handlePositionClick}
      onPlayerClick={handlePlayerClick}
      onClearSelection={handleClearSelection}
      queue={queue}
      onRemoveFromQueue={handleRemoveFromQueue}
      onConfirmAll={handleConfirmAll}
      onClearQueue={handleClearQueue}
      onKeepSameLineup={gameStatus === 'HALFTIME' ? handleKeepSameLineup : undefined}
      isExecuting={isExecuting}
      executionProgress={executionProgress}
      error={error}
      filledPositions={filledPositions}
      requiredPositions={requiredPositions}
    />
  );
};
```

**Step 2: Create formations utility if missing**

Check if `getFormationsForTeamSize` exists. If not, create a simple version:

Create: `apps/soccer-stats/ui/src/app/utils/formations.ts` (if not exists)

```typescript
/**
 * Get available formations for a given team size
 */
export function getFormationsForTeamSize(playersPerTeam: number): string[] {
  const formations: Record<number, string[]> = {
    3: ['1-1-1', '2-1', '1-2'],
    4: ['1-2-1', '2-1-1', '1-1-2', '2-2'],
    5: ['1-2-2', '2-1-2', '2-2-1', '1-3-1', '3-1-1'],
    6: ['2-2-2', '2-3-1', '3-2-1', '1-3-2'],
    7: ['2-3-2', '3-2-2', '2-2-3', '3-3-1'],
    9: ['3-3-3', '3-2-4', '4-3-2', '3-4-2'],
    11: ['4-4-2', '4-3-3', '3-5-2', '4-5-1', '3-4-3'],
  };
  return formations[playersPerTeam] || [];
}
```

**Step 3: Update barrel export**

```typescript
// apps/soccer-stats/ui/src/app/components/smart/lineup-panel/index.ts
export * from './types';
export { LineupPanel } from './lineup-panel.smart';
export { LineupPanelPresentation } from './lineup-panel.presentation';
```

**Step 4: Run lint to verify**

```bash
cd /home/joamos/code/github/garage/.worktrees/lineup-panel && pnpm nx lint soccer-stats-ui
```

Expected: PASS (warnings OK)

**Step 5: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/lineup-panel/ apps/soccer-stats/ui/src/app/utils/
git commit -m "feat(soccer-stats-ui): add lineup panel smart component shell"
```

---

## Task 4: Add Player List Sections to Presentation

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/components/smart/lineup-panel/lineup-panel.presentation.tsx`

**Step 1: Add helper functions for player display**

Add at top of file after imports:

```typescript
import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';
import { RosterPlayer as TeamRosterPlayer } from '../../../hooks/use-lineup';
import { LineupPanelPresentationProps, QueuedLineupItem, LineupSelection } from './types';

/**
 * Get player ID for matching
 */
const getPlayerId = (player: GqlRosterPlayer | TeamRosterPlayer) => {
  if ('playerId' in player) return player.playerId || player.externalPlayerName || '';
  return player.oduserId;
};

/**
 * Get display name for a player
 */
function getPlayerDisplayName(player: GqlRosterPlayer | TeamRosterPlayer): string {
  if ('playerName' in player && player.playerName) return player.playerName;
  if ('firstName' in player || 'lastName' in player) {
    const first = 'firstName' in player ? player.firstName : '';
    const last = 'lastName' in player ? player.lastName : '';
    return `${first || ''} ${last || ''}`.trim() || 'Unknown';
  }
  if ('externalPlayerName' in player && player.externalPlayerName) {
    return player.externalPlayerName;
  }
  return 'Unknown';
}

/**
 * Get jersey number
 */
function getJerseyNumber(player: GqlRosterPlayer | TeamRosterPlayer): string | null {
  if ('externalPlayerNumber' in player) return player.externalPlayerNumber || null;
  if ('jerseyNumber' in player) return player.jerseyNumber || null;
  return null;
}
```

**Step 2: Add PlayerSection component**

Add before the main component:

```typescript
/**
 * Section component for a group of players
 */
function PlayerSection({
  title,
  players,
  source,
  selection,
  onPlayerClick,
  playTimeByPlayer,
  isExecuting,
  emptyMessage,
}: {
  title: string;
  players: (GqlRosterPlayer | TeamRosterPlayer)[];
  source: 'onField' | 'bench' | 'roster';
  selection: LineupSelection;
  onPlayerClick: (player: GqlRosterPlayer | TeamRosterPlayer, source: 'onField' | 'bench' | 'roster') => void;
  playTimeByPlayer?: Map<string, { minutes: number; isOnField: boolean }>;
  isExecuting: boolean;
  emptyMessage?: string;
}) {
  if (players.length === 0 && !emptyMessage) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-medium uppercase text-gray-500">
        {title} ({players.length})
      </div>
      {players.length === 0 ? (
        <p className="text-sm text-gray-400 italic">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {players.map((player) => {
            const id = getPlayerId(player);
            const playTime = playTimeByPlayer?.get(id);
            const isSelected =
              selection.player && getPlayerId(selection.player) === id;
            const jerseyNumber = getJerseyNumber(player);
            const position = 'position' in player ? player.position : null;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onPlayerClick(player, source)}
                disabled={isExecuting}
                className={`flex flex-col items-start rounded-lg border p-2 text-left transition-colors disabled:opacity-50 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : source === 'onField'
                      ? 'border-green-200 bg-green-50 hover:border-green-300'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {jerseyNumber && (
                    <span className="text-xs font-bold text-gray-600">
                      #{jerseyNumber}
                    </span>
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? 'text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    {getPlayerDisplayName(player)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {position && <span className="font-medium">{position}</span>}
                  {playTime !== undefined && (
                    <span>{playTime.minutes} min</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Update the content area in the main component**

Replace the placeholder content area with:

```typescript
{/* Content area */}
<div className="flex-1 overflow-y-auto">
  {/* Selection header */}
  {selection.direction && (
    <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
      {selection.direction === 'position-first' && selection.position && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Assign player to:{' '}
            <span className="font-medium text-blue-600">{selection.position}</span>
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
      {selection.direction === 'player-first' && selection.player && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Place{' '}
            <span className="font-medium text-blue-600">
              {getPlayerDisplayName(selection.player)}
            </span>
            <span className="text-gray-500"> — tap position on field</span>
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

  {/* Queued items */}
  {queue.length > 0 && (
    <div className="border-b border-gray-100 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-gray-500">
          Queued ({queue.length})
        </span>
        <button
          type="button"
          onClick={onClearQueue}
          disabled={isExecuting}
          className="text-xs text-gray-500 hover:text-red-500 disabled:opacity-50"
        >
          Clear all
        </button>
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

  {/* Player sections */}
  <div className="px-4 py-3">
    {/* On Field - only show if there are players and we're in position-first mode or no selection */}
    {onFieldPlayers.length > 0 && (
      <PlayerSection
        title="On Field"
        players={onFieldPlayers}
        source="onField"
        selection={selection}
        onPlayerClick={onPlayerClick}
        playTimeByPlayer={playTimeByPlayer}
        isExecuting={isExecuting}
      />
    )}

    {/* Bench */}
    <PlayerSection
      title="Bench"
      players={benchPlayers}
      source="bench"
      selection={selection}
      onPlayerClick={onPlayerClick}
      playTimeByPlayer={playTimeByPlayer}
      isExecuting={isExecuting}
      emptyMessage="No players on bench"
    />

    {/* Available from Roster */}
    <PlayerSection
      title="Available from Roster"
      players={availableRoster}
      source="roster"
      selection={selection}
      onPlayerClick={onPlayerClick}
      isExecuting={isExecuting}
      emptyMessage="All roster players assigned"
    />
  </div>

  {/* Error display */}
  {error && (
    <div className="mx-4 my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <span className="font-medium">Error:</span> {error}
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
</div>
```

**Step 4: Add QueuedItemRow component**

Add before PlayerSection:

```typescript
/**
 * Row component for a queued lineup item
 */
function QueuedItemRow({
  item,
  onRemove,
  disabled,
}: {
  item: QueuedLineupItem;
  onRemove: () => void;
  disabled: boolean;
}) {
  const getBadge = () => {
    switch (item.type) {
      case 'assignment':
        return (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-600">
            A
          </span>
        );
      case 'position-change':
        return (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-xs font-medium text-purple-600">
            P
          </span>
        );
      case 'removal':
        return (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-xs font-medium text-red-600">
            R
          </span>
        );
    }
  };

  const getDescription = () => {
    switch (item.type) {
      case 'assignment':
        return (
          <>
            <span className="font-medium text-blue-600">{item.position}</span>
            <span className="text-gray-400"> ← </span>
            <span className="text-gray-900">{getPlayerDisplayName(item.player)}</span>
          </>
        );
      case 'position-change':
        return (
          <>
            <span className="text-gray-900">{getPlayerDisplayName(item.player)}</span>
            <span className="text-gray-400">: </span>
            <span className="text-gray-500">{item.fromPosition}</span>
            <span className="text-purple-500"> → </span>
            <span className="font-medium text-purple-600">{item.toPosition}</span>
          </>
        );
      case 'removal':
        return (
          <>
            <span className="text-red-600 line-through">{getPlayerDisplayName(item.player)}</span>
            <span className="text-gray-400"> from </span>
            <span className="text-gray-500">{item.position}</span>
          </>
        );
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2">
      <div className="flex items-center gap-2 text-sm">
        {getBadge()}
        {getDescription()}
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

**Step 5: Add footer with confirm button**

Add after content area, before closing `</div>`:

```typescript
{/* Footer with actions */}
{!isExecuting && (
  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
    {/* Halftime quick action */}
    {gameStatus === 'HALFTIME' && onKeepSameLineup && queue.length === 0 && (
      <button
        type="button"
        onClick={onKeepSameLineup}
        className="mb-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        Keep Same Lineup
      </button>
    )}

    {/* Confirm button */}
    {queue.length > 0 && (
      <button
        type="button"
        onClick={onConfirmAll}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
      >
        Confirm Lineup ({queue.length} changes)
      </button>
    )}

    {/* Status indicator when no queue */}
    {queue.length === 0 && !(gameStatus === 'HALFTIME' && onKeepSameLineup) && (
      <div className="text-center text-sm text-gray-500">
        {filledPositions.size < playersPerTeam
          ? `${playersPerTeam - filledPositions.size} positions remaining`
          : 'Lineup complete'}
      </div>
    )}
  </div>
)}
```

**Step 6: Run lint to verify**

```bash
cd /home/joamos/code/github/garage/.worktrees/lineup-panel && pnpm nx lint soccer-stats-ui
```

Expected: PASS (warnings OK)

**Step 7: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/lineup-panel/
git commit -m "feat(soccer-stats-ui): add player list sections to lineup panel"
```

---

## Task 5: Implement Selection & Queue Logic

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/components/smart/lineup-panel/lineup-panel.smart.tsx`

**Step 1: Implement handlePositionClick**

Replace the placeholder implementation:

```typescript
// Handle position click (position-first flow)
const handlePositionClick = useCallback(
  (position: string) => {
    setError(null);

    // If no selection, start position-first selection
    if (!selection.direction) {
      setSelection({
        direction: 'position-first',
        position,
        player: null,
        playerSource: null,
      });
      setPanelState('bench-view');
      return;
    }

    // If player-first, complete the assignment
    if (selection.direction === 'player-first' && selection.player && selection.playerSource) {
      // Check if position is already filled by someone on field (not in queue)
      const existingPlayer = onField.find((p) => p.position === position);

      const assignmentItem: QueuedLineupItem = {
        id: `assign-${Date.now()}-${Math.random()}`,
        type: 'assignment',
        position,
        player: selection.player,
        playerSource: selection.playerSource as 'bench' | 'roster',
        replacingPlayer: existingPlayer,
      };

      setQueue((prev) => [...prev, assignmentItem]);
      setSelection({ direction: null, position: null, player: null, playerSource: null });
      return;
    }

    // If position-first and clicking same position, deselect
    if (selection.direction === 'position-first' && selection.position === position) {
      setSelection({ direction: null, position: null, player: null, playerSource: null });
      return;
    }

    // If position-first and clicking different position, switch
    if (selection.direction === 'position-first') {
      setSelection({
        direction: 'position-first',
        position,
        player: null,
        playerSource: null,
      });
    }
  },
  [selection, onField]
);
```

**Step 2: Implement handlePlayerClick**

Replace the placeholder implementation:

```typescript
// Handle player click
const handlePlayerClick = useCallback(
  (
    player: GqlRosterPlayer | TeamRosterPlayer,
    source: 'onField' | 'bench' | 'roster'
  ) => {
    setError(null);
    const playerId = getPlayerId(player);

    // Check if player is already queued
    const isQueued = queue.some((item) => {
      if (item.type === 'assignment') {
        return getPlayerId(item.player) === playerId;
      }
      if (item.type === 'position-change') {
        return getPlayerId(item.player) === playerId;
      }
      if (item.type === 'removal') {
        return getPlayerId(item.player) === playerId;
      }
      return false;
    });

    if (isQueued) {
      return; // Don't allow selecting already-queued players
    }

    // If no selection, start player-first selection
    if (!selection.direction) {
      // If clicking on-field player, could be for position change or removal
      if (source === 'onField') {
        // For now, treat as position change start (can select new position)
        setSelection({
          direction: 'player-first',
          position: null,
          player: player as GqlRosterPlayer,
          playerSource: source,
        });
        return;
      }

      // Bench or roster player - start player-first flow
      setSelection({
        direction: 'player-first',
        position: null,
        player,
        playerSource: source,
      });
      return;
    }

    // If player-first and clicking same player, deselect
    if (
      selection.direction === 'player-first' &&
      selection.player &&
      getPlayerId(selection.player) === playerId
    ) {
      setSelection({ direction: null, position: null, player: null, playerSource: null });
      return;
    }

    // If player-first and clicking different player, switch selection
    if (selection.direction === 'player-first') {
      setSelection({
        direction: 'player-first',
        position: null,
        player,
        playerSource: source,
      });
      return;
    }

    // If position-first, complete the assignment
    if (selection.direction === 'position-first' && selection.position) {
      // Can't assign on-field players via position-first (they already have positions)
      if (source === 'onField') {
        return;
      }

      // Check if position is already filled
      const existingPlayer = onField.find((p) => p.position === selection.position);

      const assignmentItem: QueuedLineupItem = {
        id: `assign-${Date.now()}-${Math.random()}`,
        type: 'assignment',
        position: selection.position,
        player,
        playerSource: source as 'bench' | 'roster',
        replacingPlayer: existingPlayer,
      };

      setQueue((prev) => [...prev, assignmentItem]);
      setSelection({ direction: null, position: null, player: null, playerSource: null });
    }
  },
  [selection, queue, onField]
);
```

**Step 3: Add getPlayerId helper at top of file**

```typescript
/**
 * Get player ID for matching
 */
const getPlayerId = (player: GqlRosterPlayer | TeamRosterPlayer): string => {
  if ('playerId' in player) return player.playerId || player.externalPlayerName || '';
  return player.oduserId;
};
```

**Step 4: Add TeamRosterPlayer import**

```typescript
import { RosterPlayer as TeamRosterPlayer } from '../../../hooks/use-lineup';
```

**Step 5: Run lint to verify**

```bash
cd /home/joamos/code/github/garage/.worktrees/lineup-panel && pnpm nx lint soccer-stats-ui
```

Expected: PASS (warnings OK)

**Step 6: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/lineup-panel/
git commit -m "feat(soccer-stats-ui): implement lineup panel selection and queue logic"
```

---

## Task 6: Add Formation Selector

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/components/smart/lineup-panel/lineup-panel.presentation.tsx`

**Step 1: Add formation selector to header**

Update the header section to include formation dropdown:

```typescript
{/* Header */}
<div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-1">
  <div
    className="flex cursor-pointer items-center gap-2"
    onClick={() => onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')}
    role="button"
    tabIndex={0}
    onKeyDown={(e) =>
      e.key === 'Enter' && onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')
    }
  >
    <div
      className="h-3 w-3 rounded-full"
      style={{ backgroundColor: teamColor }}
    />
    <span className="font-medium text-gray-900">{teamName}</span>
  </div>

  {/* Formation selector */}
  <div className="flex items-center gap-2">
    <select
      value={formation || ''}
      onChange={(e) => onFormationChange(e.target.value)}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      disabled={isExecuting}
    >
      <option value="">No formation</option>
      {availableFormations.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
    <span className="text-sm text-gray-500">
      {filledPositions.size}/{playersPerTeam}
    </span>
  </div>
</div>
```

**Step 2: Run lint to verify**

```bash
cd /home/joamos/code/github/garage/.worktrees/lineup-panel && pnpm nx lint soccer-stats-ui
```

Expected: PASS (warnings OK)

**Step 3: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/lineup-panel/
git commit -m "feat(soccer-stats-ui): add formation selector to lineup panel"
```

---

## Task 7: Implement Batch Execution (Pre-Game)

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/components/smart/lineup-panel/lineup-panel.smart.tsx`

**Step 1: Add useLineup hook integration**

Add imports and hook usage:

```typescript
import { useLineup, RosterPlayer as TeamRosterPlayer } from '../../../hooks/use-lineup';
```

Inside the component, add:

```typescript
// Use lineup hook for mutations
const {
  addPlayerToGameRoster,
  updatePosition,
  removeFromLineup,
  refetchRoster,
} = useLineup({ gameTeamId, gameId });
```

**Step 2: Implement handleConfirmAll for pre-game**

Replace the placeholder:

```typescript
// Confirm all queued changes
const handleConfirmAll = useCallback(async () => {
  if (queue.length === 0) {
    console.warn('[LineupPanel] handleConfirmAll called with empty queue');
    return;
  }

  setIsExecuting(true);
  setExecutionProgress(0);
  setError(null);

  try {
    // Process queue items sequentially to avoid race conditions
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setExecutionProgress(i);

      if (item.type === 'assignment') {
        // For roster players, we need to use their oduserId as playerId
        const playerId = 'oduserId' in item.player ? item.player.oduserId : item.player.playerId;
        const externalPlayerName = 'externalPlayerName' in item.player ? item.player.externalPlayerName : undefined;
        const externalPlayerNumber = 'externalPlayerNumber' in item.player ? item.player.externalPlayerNumber : undefined;

        await addPlayerToGameRoster({
          playerId: playerId || undefined,
          externalPlayerName: externalPlayerName || undefined,
          externalPlayerNumber: externalPlayerNumber || undefined,
          position: item.position,
        });
      } else if (item.type === 'position-change') {
        await updatePosition(item.player.gameEventId, item.toPosition);
      } else if (item.type === 'removal') {
        await removeFromLineup(item.player.gameEventId);
      }
    }

    setExecutionProgress(queue.length);
    setQueue([]);

    // Refetch roster to get updated state
    await refetchRoster();

    // Close panel
    setPanelState('collapsed');

    // Notify parent
    onLineupComplete?.();
  } catch (err) {
    console.error('[LineupPanel] Failed to execute lineup changes:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    setError(message);
  } finally {
    setIsExecuting(false);
  }
}, [
  queue,
  addPlayerToGameRoster,
  updatePosition,
  removeFromLineup,
  refetchRoster,
  onLineupComplete,
]);
```

**Step 3: Run lint to verify**

```bash
cd /home/joamos/code/github/garage/.worktrees/lineup-panel && pnpm nx lint soccer-stats-ui
```

Expected: PASS (warnings OK)

**Step 4: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/lineup-panel/
git commit -m "feat(soccer-stats-ui): implement pre-game lineup batch execution"
```

---

## Task 8: Implement Halftime Logic

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/components/smart/lineup-panel/lineup-panel.smart.tsx`

**Step 1: Add play time calculation for halftime**

Add import and useMemo:

```typescript
import { calculatePlayTime } from '../../../hooks/use-play-time';
```

Inside component:

```typescript
// Calculate play time for all players (halftime only)
const playTimeByPlayer = useMemo(() => {
  if (gameStatus !== 'HALFTIME' || !gameEvents) return undefined;

  const allPlayerIds = [
    ...onField.map(getPlayerId),
    ...bench.map(getPlayerId),
  ];
  const results = new Map<string, { minutes: number; isOnField: boolean }>();

  for (const playerId of allPlayerIds) {
    // Use period 1 for first half stats
    const result = calculatePlayTime(playerId, gameEvents, {
      period: '1',
      periodSecond: 0,
    });
    results.set(playerId, {
      minutes: result.minutes,
      isOnField: result.isOnField,
    });
  }

  return results;
}, [gameStatus, gameEvents, onField, bench]);
```

**Step 2: Implement handleKeepSameLineup**

Replace the placeholder:

```typescript
// Keep same lineup (halftime shortcut)
const handleKeepSameLineup = useCallback(async () => {
  if (gameStatus !== 'HALFTIME') return;

  setIsExecuting(true);
  setError(null);

  try {
    // Build lineup array from current on-field players
    const lineup = onField.map((player) => ({
      playerId: player.playerId || undefined,
      externalPlayerName: player.externalPlayerName || undefined,
      externalPlayerNumber: player.externalPlayerNumber || undefined,
      position: player.position!,
    }));

    await setSecondHalfLineup(lineup);
    await refetchRoster();

    setPanelState('collapsed');
    onLineupComplete?.();
  } catch (err) {
    console.error('[LineupPanel] Failed to keep same lineup:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    setError(message);
  } finally {
    setIsExecuting(false);
  }
}, [gameStatus, onField, setSecondHalfLineup, refetchRoster, onLineupComplete]);
```

**Step 3: Update handleConfirmAll for halftime**

Modify to use setSecondHalfLineup mutation when at halftime:

```typescript
// Confirm all queued changes
const handleConfirmAll = useCallback(async () => {
  if (queue.length === 0 && gameStatus !== 'HALFTIME') {
    console.warn('[LineupPanel] handleConfirmAll called with empty queue');
    return;
  }

  setIsExecuting(true);
  setExecutionProgress(0);
  setError(null);

  try {
    if (gameStatus === 'HALFTIME') {
      // At halftime, build complete lineup and use setSecondHalfLineup
      // Start with current on-field players
      const lineupMap = new Map<string, {
        playerId?: string;
        externalPlayerName?: string;
        externalPlayerNumber?: string;
        position: string;
      }>();

      // Add current on-field players
      onField.forEach((player) => {
        if (player.position) {
          lineupMap.set(player.position, {
            playerId: player.playerId || undefined,
            externalPlayerName: player.externalPlayerName || undefined,
            externalPlayerNumber: player.externalPlayerNumber || undefined,
            position: player.position,
          });
        }
      });

      // Apply queued changes
      queue.forEach((item) => {
        if (item.type === 'assignment') {
          const playerId = 'oduserId' in item.player ? item.player.oduserId : item.player.playerId;
          const externalPlayerName = 'externalPlayerName' in item.player ? item.player.externalPlayerName : undefined;
          const externalPlayerNumber = 'externalPlayerNumber' in item.player ? item.player.externalPlayerNumber : undefined;

          lineupMap.set(item.position, {
            playerId: playerId || undefined,
            externalPlayerName: externalPlayerName || undefined,
            externalPlayerNumber: externalPlayerNumber || undefined,
            position: item.position,
          });
        } else if (item.type === 'position-change') {
          // Remove from old position
          lineupMap.delete(item.fromPosition);
          // Add to new position
          lineupMap.set(item.toPosition, {
            playerId: item.player.playerId || undefined,
            externalPlayerName: item.player.externalPlayerName || undefined,
            externalPlayerNumber: item.player.externalPlayerNumber || undefined,
            position: item.toPosition,
          });
        } else if (item.type === 'removal') {
          lineupMap.delete(item.position);
        }
      });

      const lineup = Array.from(lineupMap.values());
      await setSecondHalfLineup(lineup);
    } else {
      // Pre-game: process queue items sequentially
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        setExecutionProgress(i);

        if (item.type === 'assignment') {
          const playerId = 'oduserId' in item.player ? item.player.oduserId : item.player.playerId;
          const externalPlayerName = 'externalPlayerName' in item.player ? item.player.externalPlayerName : undefined;
          const externalPlayerNumber = 'externalPlayerNumber' in item.player ? item.player.externalPlayerNumber : undefined;

          await addPlayerToGameRoster({
            playerId: playerId || undefined,
            externalPlayerName: externalPlayerName || undefined,
            externalPlayerNumber: externalPlayerNumber || undefined,
            position: item.position,
          });
        } else if (item.type === 'position-change') {
          await updatePosition(item.player.gameEventId, item.toPosition);
        } else if (item.type === 'removal') {
          await removeFromLineup(item.player.gameEventId);
        }
      }
    }

    setExecutionProgress(queue.length);
    setQueue([]);
    await refetchRoster();
    setPanelState('collapsed');
    onLineupComplete?.();
  } catch (err) {
    console.error('[LineupPanel] Failed to execute lineup changes:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    setError(message);
  } finally {
    setIsExecuting(false);
  }
}, [
  queue,
  gameStatus,
  onField,
  addPlayerToGameRoster,
  updatePosition,
  removeFromLineup,
  setSecondHalfLineup,
  refetchRoster,
  onLineupComplete,
]);
```

**Step 4: Add setSecondHalfLineup to useLineup destructuring**

```typescript
const {
  addPlayerToGameRoster,
  updatePosition,
  removeFromLineup,
  setSecondHalfLineup,
  refetchRoster,
} = useLineup({ gameTeamId, gameId });
```

**Step 5: Pass playTimeByPlayer to presentation**

Update the return statement to include:

```typescript
playTimeByPlayer={playTimeByPlayer}
```

**Step 6: Run lint to verify**

```bash
cd /home/joamos/code/github/garage/.worktrees/lineup-panel && pnpm nx lint soccer-stats-ui
```

Expected: PASS (warnings OK)

**Step 7: Commit**

```bash
git add apps/soccer-stats/ui/src/app/components/smart/lineup-panel/
git commit -m "feat(soccer-stats-ui): implement halftime lineup logic"
```

---

## Task 9: Integrate with Game Page

**Files:**
- Modify: `apps/soccer-stats/ui/src/app/pages/game.page.tsx`

**Step 1: Import LineupPanel**

Add import:

```typescript
import { LineupPanel } from '../components/smart/lineup-panel';
```

**Step 2: Add state for lineup panel coordination**

Add near other state declarations:

```typescript
// Lineup panel state
const [selectedPositionForLineup, setSelectedPositionForLineup] = useState<string | null>(null);
const [lineupQueuedPositions, setLineupQueuedPositions] = useState<Set<string>>(new Set());
const [lineupSelectedPosition, setLineupSelectedPosition] = useState<string | null>(null);
```

**Step 3: Add helper to determine if in lineup setup phase**

```typescript
const isLineupSetupPhase = useMemo(() => {
  return gameStatus === GameStatus.Scheduled || gameStatus === GameStatus.Halftime;
}, [gameStatus]);
```

**Step 4: Add LineupPanel rendering**

Find where SubstitutionPanel is rendered and add LineupPanel nearby with conditional:

```typescript
{/* Lineup Panel - shown during SCHEDULED and HALFTIME */}
{isLineupSetupPhase && homeTeam && managedTeamId === homeTeam.id && (
  <LineupPanel
    gameId={gameId}
    gameTeamId={homeTeam.id}
    gameStatus={gameStatus === GameStatus.Scheduled ? 'SCHEDULED' : 'HALFTIME'}
    teamName={homeTeam.team?.name || 'Home Team'}
    teamColor={homeTeam.team?.color || '#3B82F6'}
    playersPerTeam={game?.format?.playersPerTeam || 5}
    formation={homeTeamFormation}
    onField={homeOnField}
    bench={homeBench}
    availableRoster={homeAvailableRoster}
    firstHalfLineup={gameStatus === GameStatus.Halftime ? homeOnField : undefined}
    gameEvents={game?.events}
    onLineupComplete={() => {
      // Could trigger refetch or status update
    }}
    onFormationChange={(formation) => {
      // Call existing formation change handler
      handleFormationChange(homeTeam.id, formation);
    }}
    externalPositionSelection={selectedPositionForLineup}
    onExternalPositionHandled={() => setSelectedPositionForLineup(null)}
    onQueuedPositionsChange={setLineupQueuedPositions}
    onSelectedPositionChange={setLineupSelectedPosition}
  />
)}

{/* Away team panel if also managed */}
{isLineupSetupPhase && awayTeam && managedTeamId === awayTeam.id && (
  <LineupPanel
    gameId={gameId}
    gameTeamId={awayTeam.id}
    gameStatus={gameStatus === GameStatus.Scheduled ? 'SCHEDULED' : 'HALFTIME'}
    teamName={awayTeam.team?.name || 'Away Team'}
    teamColor={awayTeam.team?.color || '#EF4444'}
    playersPerTeam={game?.format?.playersPerTeam || 5}
    formation={awayTeamFormation}
    onField={awayOnField}
    bench={awayBench}
    availableRoster={awayAvailableRoster}
    firstHalfLineup={gameStatus === GameStatus.Halftime ? awayOnField : undefined}
    gameEvents={game?.events}
    onLineupComplete={() => {}}
    onFormationChange={(formation) => {
      handleFormationChange(awayTeam.id, formation);
    }}
    externalPositionSelection={selectedPositionForLineup}
    onExternalPositionHandled={() => setSelectedPositionForLineup(null)}
    onQueuedPositionsChange={setLineupQueuedPositions}
    onSelectedPositionChange={setLineupSelectedPosition}
  />
)}
```

**Note:** The exact variable names (homeTeam, awayTeam, homeOnField, etc.) will depend on the existing game page structure. Adjust as needed based on actual code.

**Step 5: Run lint to verify**

```bash
cd /home/joamos/code/github/garage/.worktrees/lineup-panel && pnpm nx lint soccer-stats-ui
```

Expected: PASS (warnings OK)

**Step 6: Commit**

```bash
git add apps/soccer-stats/ui/src/app/pages/game.page.tsx
git commit -m "feat(soccer-stats-ui): integrate lineup panel with game page"
```

---

## Task 10: Manual Testing & Polish

**This task is for manual verification and any final polish needed.**

**Step 1: Start the development servers**

```bash
cd /home/joamos/code/github/garage/.worktrees/lineup-panel
pnpm nx serve soccer-stats-ui
```

**Step 2: Test pre-game flow**

1. Create a new game
2. Navigate to the game page
3. Verify lineup panel appears (should auto-expand since no players)
4. Test position-first flow: tap position → select player → verify queued
5. Test player-first flow: tap bench/roster player → tap position → verify queued
6. Confirm lineup and verify players appear on field

**Step 3: Test halftime flow**

1. Start a game and advance to halftime
2. Verify panel auto-expands
3. Verify play time is displayed for players
4. Test "Keep Same Lineup" shortcut
5. Test making changes and confirming

**Step 4: Fix any issues discovered**

Address any bugs or UX issues found during testing.

**Step 5: Final commit**

```bash
git add .
git commit -m "fix(soccer-stats-ui): polish lineup panel based on testing"
```

---

## Summary

This plan creates the LineupPanel feature in 10 tasks:

1. **Types** - Define TypeScript interfaces
2. **Presentation Shell** - Collapsed bar and basic expanded layout
3. **Smart Component Shell** - State management foundation
4. **Player List Sections** - On Field / Bench / Roster / Add sections
5. **Selection & Queue Logic** - Position-first and player-first flows
6. **Formation Selector** - Dropdown in header
7. **Batch Execution (Pre-game)** - Execute queued changes
8. **Halftime Logic** - Play time, setSecondHalfLineup
9. **Game Page Integration** - Wire up to game.page.tsx
10. **Manual Testing & Polish** - Verify everything works

Each task builds on the previous, with commits at each step for easy rollback if needed.

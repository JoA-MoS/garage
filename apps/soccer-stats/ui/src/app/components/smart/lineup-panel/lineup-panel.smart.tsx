import { useState, useCallback, useMemo, useEffect } from 'react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { RosterPlayer as TeamRosterPlayer } from '../../../hooks/use-lineup';
import { getFormationsForTeamSize } from '../../../utils/formations';
import { LineupPanelPresentation } from './lineup-panel.presentation';
import {
  LineupPanelSmartProps,
  PanelState,
  LineupSelection,
  QueuedLineupItem,
} from './types';

/**
 * Get player ID for matching
 */
const getPlayerId = (player: GqlRosterPlayer | TeamRosterPlayer): string => {
  if ('playerId' in player) return player.playerId || player.externalPlayerName || '';
  return player.oduserId;
};

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
        queuedPositions.add(
          item.type === 'assignment' ? item.position : item.toPosition
        );
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
    setSelection({
      direction: null,
      position: null,
      player: null,
      playerSource: null,
    });
  }, []);

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

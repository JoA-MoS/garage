import { useState, useCallback, useMemo, useEffect } from 'react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { useLineup, RosterPlayer as TeamRosterPlayer } from '../../../hooks/use-lineup';
import { calculatePlayTime } from '../../../hooks/use-play-time';
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

  // Use lineup hook for mutations
  const {
    addPlayerToGameRoster,
    updatePosition,
    removeFromLineup,
    setSecondHalfLineup,
    refetchRoster,
  } = useLineup({ gameTeamId, gameId });

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
      playTimeByPlayer={playTimeByPlayer}
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

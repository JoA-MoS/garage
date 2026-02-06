import { useState, useCallback, useMemo, useEffect } from 'react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import {
  useLineup,
  RosterPlayer as TeamRosterPlayer,
} from '../../../hooks/use-lineup';
import { calculatePlayTime } from '../../../hooks/use-play-time';

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
  if ('playerId' in player)
    return player.playerId || player.externalPlayerName || '';
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
  firstHalfLineup,
  gameEvents,
  onLineupComplete,
  externalPositionSelection,
  onExternalPositionHandled,
  externalFieldPlayerSelection,
  onExternalFieldPlayerHandled,
  onQueuedPositionsChange,
  onSelectedPositionChange,
  onPlayerSelectionChange,
  onSelectedFieldPlayerIdChange,
  onQueuedPlayerIdsChange,
}: LineupPanelSmartProps) => {
  // Panel state - auto-expand if lineup incomplete (pre-game) or at halftime
  const shouldAutoExpand = gameStatus === 'HALFTIME' || onField.length === 0;
  const [panelState, setPanelState] = useState<PanelState>(
    shouldAutoExpand ? 'bench-view' : 'collapsed',
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

  // Use lineup hook for mutations and available roster
  const {
    addPlayerToGameRoster,
    updatePosition,
    removeFromLineup,
    setSecondHalfLineup,
    refetchRoster,
    availableRoster,
  } = useLineup({ gameTeamId, gameId });

  // Calculate filled positions (Set for highlighting) and filled count (for counter)
  // These are separate because a Set deduplicates positions (e.g., two CMs count as one),
  // but the counter needs the actual number of players with positions assigned.
  const { filledPositions, filledCount } = useMemo(() => {
    const positions = new Set<string>();
    let count = onField.filter((p) => p.position).length;

    // Add current on-field positions to Set
    onField.forEach((p) => {
      if (p.position) positions.add(p.position);
    });

    // Apply queued changes to both Set and count
    queue.forEach((item) => {
      if (item.type === 'assignment') {
        positions.add(item.position);
        count++;
      } else if (item.type === 'position-change') {
        positions.delete(item.fromPosition);
        positions.add(item.toPosition);
        // count stays the same — player just moved positions
      } else if (item.type === 'removal') {
        positions.delete(item.position);
        count--;
      }
      // swap: count and positions stay the same
    });

    return { filledPositions: positions, filledCount: count };
  }, [onField, queue]);

  // Get required positions from formation (placeholder - will derive from formation)
  const requiredPositions = useMemo(() => {
    // TODO: Derive from formation string in a later task
    return [] as string[];
  }, [formation]);

  // Calculate play time for all players (halftime only)
  const playTimeByPlayer = useMemo(() => {
    if (gameStatus !== 'HALFTIME' || !gameEvents) return undefined;

    // Find the PERIOD_END event to get the actual first half duration
    const periodEndEvent = gameEvents.find(
      (e) => e.eventType.name === 'PERIOD_END' && e.period === '1',
    );
    // Use the PERIOD_END time, or fall back to a reasonable default
    const firstHalfEndSecond = periodEndEvent?.periodSecond ?? 1500;

    const allPlayerIds = [
      ...onField.map(getPlayerId),
      ...bench.map(getPlayerId),
    ];
    const results = new Map<string, { minutes: number; isOnField: boolean }>();

    for (const playerId of allPlayerIds) {
      const result = calculatePlayTime(playerId, gameEvents, {
        period: '1',
        periodSecond: firstHalfEndSecond,
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
          item.type === 'assignment' ? item.position : item.toPosition,
        );
      }
    });
    onQueuedPositionsChange?.(queuedPositions);
  }, [queue, onQueuedPositionsChange]);

  // Notify parent when selected position changes
  useEffect(() => {
    onSelectedPositionChange?.(selection.position);
  }, [selection.position, onSelectedPositionChange]);

  // Notify parent when player selection changes (for player-first flow coordination)
  useEffect(() => {
    const hasPlayerSelected =
      selection.direction === 'player-first' && selection.player !== null;
    onPlayerSelectionChange?.(hasPlayerSelected);
  }, [selection.direction, selection.player, onPlayerSelectionChange]);

  // Notify parent of selected on-field player (for field highlighting - blue ring)
  useEffect(() => {
    const selectedId =
      selection.direction === 'player-first' &&
      selection.playerSource === 'onField' &&
      selection.player &&
      'gameEventId' in selection.player
        ? selection.player.gameEventId
        : null;
    onSelectedFieldPlayerIdChange?.(selectedId);
  }, [
    selection.direction,
    selection.playerSource,
    selection.player,
    onSelectedFieldPlayerIdChange,
  ]);

  // Notify parent of queued player IDs (for field highlighting - orange indicators)
  useEffect(() => {
    const queuedIds = new Set<string>();
    queue.forEach((item) => {
      if (item.type === 'swap') {
        queuedIds.add(item.player1.gameEventId);
        queuedIds.add(item.player2.gameEventId);
      } else if (item.type === 'position-change') {
        queuedIds.add(item.player.gameEventId);
      } else if (item.type === 'removal') {
        queuedIds.add(item.player.gameEventId);
      } else if (item.type === 'assignment' && item.replacingPlayer) {
        queuedIds.add(item.replacingPlayer.gameEventId);
      }
    });
    onQueuedPlayerIdsChange?.(queuedIds);
  }, [queue, onQueuedPlayerIdsChange]);

  // Handle external position selection (from field visualization click)
  useEffect(() => {
    if (!externalPositionSelection) return;

    const position = externalPositionSelection;
    onExternalPositionHandled?.();

    // If we have a player selected (player-first mode), complete the assignment
    if (
      selection.direction === 'player-first' &&
      selection.player &&
      selection.playerSource
    ) {
      const player = selection.player;
      const source = selection.playerSource;

      // Clear selection immediately
      setSelection({
        direction: null,
        position: null,
        player: null,
        playerSource: null,
      });

      // Execute the assignment
      const executeAssignment = async () => {
        // If player is from bench or on-field, they're already in game roster
        if (
          (source === 'bench' || source === 'onField') &&
          'gameEventId' in player &&
          player.gameEventId
        ) {
          await updatePosition(player.gameEventId, position);
        } else {
          // Player is from team roster - add them to game roster
          const playerId =
            'oduserId' in player ? player.oduserId : player.playerId;
          const externalPlayerName =
            'externalPlayerName' in player
              ? player.externalPlayerName
              : undefined;
          const externalPlayerNumber =
            'externalPlayerNumber' in player
              ? player.externalPlayerNumber
              : undefined;

          await addPlayerToGameRoster({
            playerId: playerId || undefined,
            externalPlayerName: externalPlayerName || undefined,
            externalPlayerNumber: externalPlayerNumber || undefined,
            position,
          });
        }
      };

      executeAssignment().catch((err) => {
        console.error('[LineupPanel] Failed to assign player:', err);
        const message =
          err instanceof Error ? err.message : 'Failed to assign player';
        setError(message);
      });
      return;
    }

    // Otherwise, start position-first flow
    setPanelState('bench-view');
    setSelection({
      direction: 'position-first',
      position,
      player: null,
      playerSource: null,
    });
  }, [
    externalPositionSelection,
    onExternalPositionHandled,
    selection,
    addPlayerToGameRoster,
    updatePosition,
  ]);

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
    async (position: string) => {
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

      // If player-first, complete the assignment immediately
      if (
        selection.direction === 'player-first' &&
        selection.player &&
        selection.playerSource
      ) {
        const player = selection.player;
        const source = selection.playerSource;

        // Clear selection immediately for responsive UI
        setSelection({
          direction: null,
          position: null,
          player: null,
          playerSource: null,
        });

        try {
          // If player is from bench or on-field, they're already in game roster
          // Use updatePosition to change their position
          if (
            (source === 'bench' || source === 'onField') &&
            'gameEventId' in player &&
            player.gameEventId
          ) {
            await updatePosition(player.gameEventId, position);
          } else {
            // Player is from team roster - add them to game roster
            const playerId =
              'oduserId' in player ? player.oduserId : player.playerId;
            const externalPlayerName =
              'externalPlayerName' in player
                ? player.externalPlayerName
                : undefined;
            const externalPlayerNumber =
              'externalPlayerNumber' in player
                ? player.externalPlayerNumber
                : undefined;

            await addPlayerToGameRoster({
              playerId: playerId || undefined,
              externalPlayerName: externalPlayerName || undefined,
              externalPlayerNumber: externalPlayerNumber || undefined,
              position,
            });
          }
        } catch (err) {
          console.error('[LineupPanel] Failed to assign player:', err);
          const message =
            err instanceof Error ? err.message : 'Failed to assign player';
          setError(message);
        }
        return;
      }

      // If position-first and clicking same position, deselect
      if (
        selection.direction === 'position-first' &&
        selection.position === position
      ) {
        setSelection({
          direction: null,
          position: null,
          player: null,
          playerSource: null,
        });
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
    [selection, addPlayerToGameRoster],
  );

  // Handle player click
  const handlePlayerClick = useCallback(
    async (
      player: GqlRosterPlayer | TeamRosterPlayer,
      source: 'onField' | 'bench' | 'roster',
    ) => {
      setError(null);
      const playerId = getPlayerId(player);

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
        setSelection({
          direction: null,
          position: null,
          player: null,
          playerSource: null,
        });
        return;
      }

      // If player-first from on-field and clicking another on-field player, swap positions
      if (
        selection.direction === 'player-first' &&
        selection.playerSource === 'onField' &&
        source === 'onField' &&
        selection.player
      ) {
        const player1 = selection.player as GqlRosterPlayer;
        const player2 = player as GqlRosterPlayer;

        // Clear selection immediately
        setSelection({
          direction: null,
          position: null,
          player: null,
          playerSource: null,
        });

        if (gameStatus === 'SCHEDULED') {
          // Pre-game: execute immediately - swap position fields on both events
          try {
            const pos1 = player1.position;
            const pos2 = player2.position;
            if (pos1 && pos2) {
              await updatePosition(player1.gameEventId, pos2);
              await updatePosition(player2.gameEventId, pos1);
            }
          } catch (err) {
            console.error('[LineupPanel] Failed to swap positions:', err);
            const message =
              err instanceof Error ? err.message : 'Failed to swap positions';
            setError(message);
          }
        } else {
          // Halftime: queue the swap for batch execution
          setQueue((prev) => [
            ...prev,
            {
              id: `swap-${Date.now()}-${Math.random()}`,
              type: 'swap' as const,
              player1,
              player1Position: player1.position!,
              player2,
              player2Position: player2.position!,
            },
          ]);
        }
        return;
      }

      // If player-first from bench/roster and clicking on-field player, replace them
      if (
        selection.direction === 'player-first' &&
        (selection.playerSource === 'bench' ||
          selection.playerSource === 'roster') &&
        source === 'onField' &&
        selection.player
      ) {
        const selectedPlayer = selection.player;
        const onFieldPlayer = player as GqlRosterPlayer;
        const position = onFieldPlayer.position;

        // Clear selection immediately
        setSelection({
          direction: null,
          position: null,
          player: null,
          playerSource: null,
        });

        if (!position) return;

        if (gameStatus === 'SCHEDULED') {
          // Pre-game: execute immediately
          try {
            if (
              selection.playerSource === 'bench' &&
              'gameEventId' in selectedPlayer &&
              selectedPlayer.gameEventId
            ) {
              await updatePosition(selectedPlayer.gameEventId, position);
            } else {
              const pid =
                'oduserId' in selectedPlayer
                  ? selectedPlayer.oduserId
                  : selectedPlayer.playerId;
              const extName =
                'externalPlayerName' in selectedPlayer
                  ? selectedPlayer.externalPlayerName
                  : undefined;
              const extNum =
                'externalPlayerNumber' in selectedPlayer
                  ? selectedPlayer.externalPlayerNumber
                  : undefined;

              await addPlayerToGameRoster({
                playerId: pid || undefined,
                externalPlayerName: extName || undefined,
                externalPlayerNumber: extNum || undefined,
                position,
              });
            }
          } catch (err) {
            console.error('[LineupPanel] Failed to replace player:', err);
            const message =
              err instanceof Error ? err.message : 'Failed to replace player';
            setError(message);
          }
        } else {
          // Halftime: queue the assignment with replacement
          setQueue((prev) => [
            ...prev,
            {
              id: `assignment-${Date.now()}-${Math.random()}`,
              type: 'assignment' as const,
              position,
              player: selectedPlayer,
              playerSource: selection.playerSource as 'bench' | 'roster',
              replacingPlayer: onFieldPlayer,
            },
          ]);
        }
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

      // If position-first, complete the assignment immediately
      if (selection.direction === 'position-first' && selection.position) {
        // Can't assign on-field players via position-first (they already have positions)
        if (source === 'onField') {
          return;
        }

        const position = selection.position;

        // Clear selection immediately for responsive UI
        setSelection({
          direction: null,
          position: null,
          player: null,
          playerSource: null,
        });

        try {
          // If player is from bench, they're already in game roster
          // Use updatePosition to change their position
          if (
            source === 'bench' &&
            'gameEventId' in player &&
            player.gameEventId
          ) {
            await updatePosition(player.gameEventId, position);
          } else {
            // Player is from team roster - add them to game roster
            const playerIdToAssign =
              'oduserId' in player ? player.oduserId : player.playerId;
            const externalPlayerName =
              'externalPlayerName' in player
                ? player.externalPlayerName
                : undefined;
            const externalPlayerNumber =
              'externalPlayerNumber' in player
                ? player.externalPlayerNumber
                : undefined;

            await addPlayerToGameRoster({
              playerId: playerIdToAssign || undefined,
              externalPlayerName: externalPlayerName || undefined,
              externalPlayerNumber: externalPlayerNumber || undefined,
              position,
            });
          }
        } catch (err) {
          console.error('[LineupPanel] Failed to assign player:', err);
          const message =
            err instanceof Error ? err.message : 'Failed to assign player';
          setError(message);
        }
      }
    },
    [selection, gameStatus, addPlayerToGameRoster, updatePosition],
  );

  // Handle external field player selection (from field visualization click at halftime)
  // Placed after handlePlayerClick so we can delegate to it for swap/deselect logic
  useEffect(() => {
    if (!externalFieldPlayerSelection) return;

    const player = externalFieldPlayerSelection;
    onExternalFieldPlayerHandled?.();

    // Ensure panel is visible
    if (panelState === 'collapsed') {
      setPanelState('bench-view');
    }

    // Delegate to handlePlayerClick which handles swaps, deselection, etc.
    handlePlayerClick(player, 'onField');
  }, [
    externalFieldPlayerSelection,
    onExternalFieldPlayerHandled,
    handlePlayerClick,
    panelState,
  ]);

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
        const lineupMap = new Map<
          string,
          {
            playerId?: string;
            externalPlayerName?: string;
            externalPlayerNumber?: string;
            position: string;
          }
        >();

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
            const playerId =
              'oduserId' in item.player
                ? item.player.oduserId
                : item.player.playerId;
            const externalPlayerName =
              'externalPlayerName' in item.player
                ? item.player.externalPlayerName
                : undefined;
            const externalPlayerNumber =
              'externalPlayerNumber' in item.player
                ? item.player.externalPlayerNumber
                : undefined;

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
              externalPlayerNumber:
                item.player.externalPlayerNumber || undefined,
              position: item.toPosition,
            });
          } else if (item.type === 'swap') {
            // Swap: get both entries, exchange their positions
            const entry1 = lineupMap.get(item.player1Position);
            const entry2 = lineupMap.get(item.player2Position);
            if (entry1 && entry2) {
              lineupMap.set(item.player1Position, {
                ...entry2,
                position: item.player1Position,
              });
              lineupMap.set(item.player2Position, {
                ...entry1,
                position: item.player2Position,
              });
            }
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
            const playerId =
              'oduserId' in item.player
                ? item.player.oduserId
                : item.player.playerId;
            const externalPlayerName =
              'externalPlayerName' in item.player
                ? item.player.externalPlayerName
                : undefined;
            const externalPlayerNumber =
              'externalPlayerNumber' in item.player
                ? item.player.externalPlayerNumber
                : undefined;

            await addPlayerToGameRoster({
              playerId: playerId || undefined,
              externalPlayerName: externalPlayerName || undefined,
              externalPlayerNumber: externalPlayerNumber || undefined,
              position: item.position,
            });
          } else if (item.type === 'position-change') {
            await updatePosition(item.player.gameEventId, item.toPosition);
          } else if (item.type === 'swap') {
            await updatePosition(
              item.player1.gameEventId,
              item.player2Position,
            );
            await updatePosition(
              item.player2.gameEventId,
              item.player1Position,
            );
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
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
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

  // Add player to bench (no position) or move on-field player to bench
  const handleAddToBench = useCallback(async () => {
    if (
      selection.direction !== 'player-first' ||
      !selection.player ||
      !selection.playerSource
    ) {
      return;
    }

    setError(null);
    const player = selection.player;
    const source = selection.playerSource;

    // Clear selection immediately for responsive UI
    setSelection({
      direction: null,
      position: null,
      player: null,
      playerSource: null,
    });

    // On-field player → move to bench (remove from position)
    if (source === 'onField' && 'gameEventId' in player && player.gameEventId) {
      if (gameStatus === 'HALFTIME') {
        // Queue a removal for batch execution
        setQueue((prev) => [
          ...prev,
          {
            id: `removal-${Date.now()}-${Math.random()}`,
            type: 'removal' as const,
            player: player as GqlRosterPlayer,
            position: (player as GqlRosterPlayer).position!,
          },
        ]);
      } else {
        // SCHEDULED: execute immediately
        try {
          await removeFromLineup(player.gameEventId);
        } catch (err) {
          console.error('[LineupPanel] Failed to move player to bench:', err);
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to move player to bench';
          setError(message);
        }
      }
      return;
    }

    // Roster player → add to game roster with no position
    try {
      const playerId = 'oduserId' in player ? player.oduserId : player.playerId;
      const externalPlayerName =
        'externalPlayerName' in player ? player.externalPlayerName : undefined;
      const externalPlayerNumber =
        'externalPlayerNumber' in player
          ? player.externalPlayerNumber
          : undefined;

      await addPlayerToGameRoster({
        playerId: playerId || undefined,
        externalPlayerName: externalPlayerName || undefined,
        externalPlayerNumber: externalPlayerNumber || undefined,
        position: null, // No position = bench
      });
    } catch (err) {
      console.error('[LineupPanel] Failed to add player to bench:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to add player to bench';
      setError(message);
    }
  }, [selection, gameStatus, addPlayerToGameRoster, removeFromLineup]);

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
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsExecuting(false);
    }
  }, [
    gameStatus,
    onField,
    setSecondHalfLineup,
    refetchRoster,
    onLineupComplete,
  ]);

  return (
    <LineupPanelPresentation
      panelState={panelState}
      onPanelStateChange={setPanelState}
      gameStatus={gameStatus}
      teamName={teamName}
      teamColor={teamColor}
      playersPerTeam={playersPerTeam}
      onFieldPlayers={onField}
      benchPlayers={bench}
      availableRoster={availableRoster}
      playTimeByPlayer={playTimeByPlayer}
      selection={selection}
      onPositionClick={handlePositionClick}
      onPlayerClick={handlePlayerClick}
      onClearSelection={handleClearSelection}
      queue={queue}
      onRemoveFromQueue={handleRemoveFromQueue}
      onConfirmAll={handleConfirmAll}
      onClearQueue={handleClearQueue}
      onKeepSameLineup={
        gameStatus === 'HALFTIME' ? handleKeepSameLineup : undefined
      }
      onAddToBench={handleAddToBench}
      isExecuting={isExecuting}
      executionProgress={executionProgress}
      error={error}
      filledPositions={filledPositions}
      filledCount={filledCount}
      requiredPositions={requiredPositions}
    />
  );
};

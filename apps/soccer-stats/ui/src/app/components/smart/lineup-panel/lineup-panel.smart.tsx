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

  // Handle position click (placeholder - full implementation in later task)
  const handlePositionClick = useCallback((position: string) => {
    setError(null);
    // TODO: Implement in Task 5
    console.log('Position clicked:', position);
  }, []);

  // Handle player click (placeholder - full implementation in later task)
  const handlePlayerClick = useCallback(
    (
      player: GqlRosterPlayer | TeamRosterPlayer,
      source: 'onField' | 'bench' | 'roster'
    ) => {
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

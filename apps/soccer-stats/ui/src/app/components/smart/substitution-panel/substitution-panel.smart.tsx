import { useState, useCallback, useMemo, useEffect } from 'react';
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
  externalFieldPlayerSelection,
  onExternalSelectionHandled,
  onBenchSelectionChange,
  externalFieldPlayerToReplace,
  onExternalFieldPlayerToReplaceHandled,
  onQueuedPlayerIdsChange,
  onSelectedFieldPlayerChange,
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

  // Get queued player IDs - computed early so useEffects can validate against them
  const { outIds, inIds, swapPlayerIds } = useMemo(() => {
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

  // Notify parent when queued player IDs change
  useEffect(() => {
    onQueuedPlayerIdsChange?.(outIds);
  }, [outIds, onQueuedPlayerIdsChange]);

  // Notify parent when selected field player changes (for visual indicator on field)
  useEffect(() => {
    const selectedId =
      selection.direction === 'field-first' && selection.fieldPlayer
        ? selection.fieldPlayer.gameEventId
        : null;
    onSelectedFieldPlayerChange?.(selectedId);
  }, [selection.direction, selection.fieldPlayer, onSelectedFieldPlayerChange]);

  // Handle external field player selection (e.g., from tapping a player on the field view)
  useEffect(() => {
    if (externalFieldPlayerSelection) {
      // Ignore if player is already queued for substitution or swap
      const isQueued =
        outIds.has(externalFieldPlayerSelection.gameEventId) ||
        swapPlayerIds.has(getPlayerId(externalFieldPlayerSelection));

      if (!isQueued) {
        // Open panel and set selection to field-first with this player
        setPanelState('bench-view');
        setSelection({
          direction: 'field-first',
          fieldPlayer: externalFieldPlayerSelection,
          benchPlayer: null,
        });
      }
      // Notify parent that we've handled the selection (even if ignored)
      onExternalSelectionHandled?.();
    }
  }, [
    externalFieldPlayerSelection,
    onExternalSelectionHandled,
    outIds,
    swapPlayerIds,
  ]);

  // Notify parent when bench selection changes (for routing field clicks)
  useEffect(() => {
    if (selection.direction === 'bench-first' && selection.benchPlayer) {
      onBenchSelectionChange?.(selection.benchPlayer);
    } else {
      onBenchSelectionChange?.(null);
    }
  }, [selection.direction, selection.benchPlayer, onBenchSelectionChange]);

  // Handle external field player click to complete bench-first substitution
  useEffect(() => {
    if (
      externalFieldPlayerToReplace &&
      selection.direction === 'bench-first' &&
      selection.benchPlayer
    ) {
      // Ignore if player is already queued for substitution or swap
      const isQueued =
        outIds.has(externalFieldPlayerToReplace.gameEventId) ||
        swapPlayerIds.has(getPlayerId(externalFieldPlayerToReplace));

      if (!isQueued) {
        // Queue the substitution
        const subItem: QueuedItem = {
          id: `sub-${Date.now()}-${Math.random()}`,
          type: 'substitution',
          playerOut: externalFieldPlayerToReplace,
          playerIn: selection.benchPlayer,
        };
        setQueue((prev) => [...prev, subItem]);
        setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });
      }
      // Notify parent that we've handled the click (even if ignored)
      onExternalFieldPlayerToReplaceHandled?.();
    }
  }, [
    externalFieldPlayerToReplace,
    selection.direction,
    selection.benchPlayer,
    onExternalFieldPlayerToReplaceHandled,
    outIds,
    swapPlayerIds,
  ]);

  // Calculate play time for all players
  const playTimeByPlayer = useMemo(() => {
    const allPlayerIds = [
      ...onField.map(getPlayerId),
      ...bench.map(getPlayerId),
    ];
    const results = new Map<string, { minutes: number; isOnField: boolean }>();

    for (const playerId of allPlayerIds) {
      const result = calculatePlayTime(playerId, gameEvents, {
        period,
        periodSecond,
      });
      results.set(playerId, {
        minutes: result.minutes,
        isOnField: result.isOnField,
      });
    }

    return results;
  }, [onField, bench, gameEvents, period, periodSecond]);

  // Filter available players
  const onFieldPlayerIds = new Set(onField.map(getPlayerId));

  const availableOnField = useMemo(
    () =>
      onField.filter(
        (p) => !outIds.has(p.gameEventId) && !swapPlayerIds.has(getPlayerId(p)),
      ),
    [onField, outIds, swapPlayerIds],
  );

  const availableBench = useMemo(
    () =>
      bench.filter((b) => {
        const id = getPlayerId(b);
        return !inIds.has(id) && !onFieldPlayerIds.has(id);
      }),
    [bench, inIds, onFieldPlayerIds],
  );

  // Handle field player click
  const handleFieldPlayerClick = useCallback(
    (player: GqlRosterPlayer) => {
      // Clear any stale error when user starts a new interaction
      setError(null);

      // Prevent selecting a player already queued for substitution or swap
      if (
        outIds.has(player.gameEventId) ||
        swapPlayerIds.has(getPlayerId(player))
      ) {
        return;
      }

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
          setSelection({
            direction: null,
            fieldPlayer: null,
            benchPlayer: null,
          });
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
        setSelection({
          direction: null,
          fieldPlayer: null,
          benchPlayer: null,
        });
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
        setSelection({
          direction: null,
          fieldPlayer: null,
          benchPlayer: null,
        });
      }
    },
    [selection, outIds, swapPlayerIds],
  );

  // Handle bench player click
  const handleBenchPlayerClick = useCallback(
    (player: GqlRosterPlayer) => {
      // Clear any stale error when user starts a new interaction
      setError(null);

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
        setSelection({
          direction: null,
          fieldPlayer: null,
          benchPlayer: null,
        });
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
        setSelection({
          direction: null,
          fieldPlayer: null,
          benchPlayer: null,
        });
      }
    },
    [selection],
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
    if (queue.length === 0) {
      console.warn(
        '[SubstitutionPanel] handleConfirmAll called with empty queue',
      );
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(0);
    setError(null);

    const subs = queue.filter(
      (q): q is Extract<QueuedItem, { type: 'substitution' }> =>
        q.type === 'substitution',
    );
    const swaps = queue.filter(
      (q): q is Extract<QueuedItem, { type: 'swap' }> => q.type === 'swap',
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

      // Mutation succeeded - update progress and clear queue immediately
      // This ensures we don't lose track of successful operations
      setExecutionProgress(queue.length);
      setQueue([]);

      // Refetch queries in a separate try-catch - these are best-effort refreshes
      // The mutation already succeeded, so we don't want refetch failures to show errors
      try {
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
      } catch (refetchErr) {
        // Log but don't show error to user - the mutation succeeded
        console.warn(
          '[SubstitutionPanel] Refetch failed after successful mutation:',
          refetchErr,
        );
      }

      // Close panel and notify parent
      setPanelState('collapsed');

      // Wrap callback invocation to prevent parent errors from affecting our state
      try {
        onSubstitutionComplete?.();
      } catch (callbackErr) {
        console.error(
          '[SubstitutionPanel] onSubstitutionComplete callback threw:',
          callbackErr,
        );
      }
    } catch (err) {
      // This now only catches mutation failures, not refetch failures
      console.error('Failed to execute batch changes:', err);
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsExecuting(false);
    }
  }, [
    queue,
    gameTeamId,
    gameId,
    period,
    periodSecond,
    batchLineupChanges,
    client,
    onSubstitutionComplete,
  ]);

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

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';

import {
  RosterPlayer as GqlRosterPlayer,
  BatchSubstitutionInput,
  BatchSwapInput,
} from '@garage/soccer-stats/graphql-codegen';

import {
  BATCH_LINEUP_CHANGES,
  SWAP_POSITIONS,
  REMOVE_PLAYER_FROM_FIELD,
  BRING_PLAYER_ONTO_FIELD,
  GET_GAME_BY_ID,
} from '../../../services/games-graphql.service';
import { addEventsToGameTeam } from '../../../services/game-event-cache';
import { useGameOutbox } from '../../../outbox/game-outbox-context';
import { calculatePlayTime } from '../../../hooks/use-play-time';
import { FIELD_SENTINEL_POSITION } from '../lineup-panel/types';
import { useLineup } from '../../../hooks/use-lineup';

import { buildQueuedActions } from './build-queued-actions';
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
  executeImmediately = false,
  trackPositions = true,
  gameEvents,
  onSubstitutionComplete,
  externalFieldPlayerSelection,
  onExternalSelectionHandled,
  onBenchSelectionChange,
  externalFieldPlayerToReplace,
  onExternalFieldPlayerToReplaceHandled,
  externalFieldPlayerForSwap,
  onExternalFieldPlayerForSwapHandled,
  externalEmptyPosition,
  onExternalEmptyPositionHandled,
  externalAddToField,
  onExternalAddToFieldHandled,
  onProjectedOnFieldCountChange,
  onPanelStateChange: onPanelStateChangeExternal,
  onQueuedPlayerIdsChange,
  onSelectedFieldPlayerChange,
}: SubstitutionPanelSmartProps) => {
  // Panel state
  const [panelState, setPanelStateInternal] = useState<PanelState>('collapsed');
  const setPanelState = useCallback(
    (state: PanelState) => {
      setPanelStateInternal(state);
      onPanelStateChangeExternal?.(state);
    },
    [onPanelStateChangeExternal],
  );

  // Scroll field into view when panel expands so it's visible above the panel
  const prevPanelStateRef = useRef(panelState);
  useEffect(() => {
    const wasCollapsed = prevPanelStateRef.current === 'collapsed';
    prevPanelStateRef.current = panelState;

    if (wasCollapsed && panelState !== 'collapsed') {
      const fieldEl = document.getElementById('field-lineup');
      if (fieldEl) {
        fieldEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [panelState]);

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
  const { recordAction } = useGameOutbox();
  const { getJerseyNumber } = useLineup({ gameTeamId, gameId });
  const [batchLineupChanges] = useMutation(BATCH_LINEUP_CHANGES);
  const [swapPositions] = useMutation(SWAP_POSITIONS);
  const [removePlayerFromFieldMutation] = useMutation(REMOVE_PLAYER_FROM_FIELD);
  const [bringPlayerOntoFieldMutation] = useMutation(BRING_PLAYER_ONTO_FIELD);

  // Execute a single substitution immediately (used when executeImmediately=true)
  // Defined early so useEffects can reference it
  const executeSubstitutionNow = useCallback(
    async (playerOut: GqlRosterPlayer, playerIn: GqlRosterPlayer) => {
      setError(null);

      try {
        await batchLineupChanges({
          variables: {
            input: {
              gameTeamId,
              period,
              periodSecond,
              substitutions: [
                {
                  playerOutEventId: playerOut.gameEventId,
                  playerInId: playerIn.playerId || undefined,
                  externalPlayerInName:
                    playerIn.externalPlayerName || undefined,
                  externalPlayerInNumber:
                    playerIn.externalPlayerNumber || undefined,
                },
              ],
              swaps: [],
            },
          },
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, data?.batchLineupChanges),
        });
      } catch (err) {
        console.error('Failed to execute substitution:', err);
        const message =
          err instanceof Error ? err.message : 'Failed to execute substitution';
        setError(message);
      }
    },
    [gameTeamId, period, periodSecond, batchLineupChanges],
  );

  // Execute a single position swap immediately (used when executeImmediately=true)
  const executeSwapNow = useCallback(
    async (player1: GqlRosterPlayer, player2: GqlRosterPlayer) => {
      setError(null);

      try {
        await swapPositions({
          variables: {
            input: {
              gameTeamId,
              player1EventId: player1.gameEventId,
              player2EventId: player2.gameEventId,
              period,
              periodSecond,
            },
          },
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, data?.swapPositions),
        });
      } catch (err) {
        console.error('Failed to execute position swap:', err);
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to execute position swap';
        setError(message);
      }
    },
    [gameTeamId, period, periodSecond, swapPositions],
  );

  // Get queued player IDs - computed early so useEffects can validate against them
  const { outIds, inIds, swapPlayerIds, swapOnFieldGameEventIds } =
    useMemo(() => {
      const outIds = new Set<string>();
      const inIds = new Set<string>();
      const swapPlayerIds = new Set<string>();
      // gameEventIds of swap participants who are currently on the field —
      // the subset of swapPlayerIds (keyed by playerId/externalPlayerName)
      // that the on-field card grid can actually badge as queued (keyed by
      // gameEventId). A 'queuedSub' participant isn't on the field yet, so
      // there's no on-field card for it to mark.
      const swapOnFieldGameEventIds = new Set<string>();

      queue.forEach((item) => {
        if (item.type === 'substitution') {
          outIds.add(item.playerOut.gameEventId);
          inIds.add(getPlayerId(item.playerIn));
        } else if (item.type === 'removal') {
          outIds.add(item.playerOut.gameEventId);
        } else if (item.type === 'addition') {
          inIds.add(getPlayerId(item.playerIn));
        } else {
          swapPlayerIds.add(getPlayerId(item.player1.player));
          swapPlayerIds.add(getPlayerId(item.player2.player));
          if (item.player1.source === 'onField') {
            swapOnFieldGameEventIds.add(item.player1.gameEventId);
          }
          if (item.player2.source === 'onField') {
            swapOnFieldGameEventIds.add(item.player2.gameEventId);
          }
        }
      });

      return { outIds, inIds, swapPlayerIds, swapOnFieldGameEventIds };
    }, [queue]);

  // Notify parent when queued player IDs change. OnFieldCardGrid's isQueued
  // badge is keyed by gameEventId, so this must include on-field swap
  // participants too — outIds alone only covers substitution/removal
  // targets, which previously left a player queued as part of a swap
  // looking untouched (and silently un-tappable) in the card grid.
  useEffect(() => {
    const queuedGameEventIds = new Set([...outIds, ...swapOnFieldGameEventIds]);
    onQueuedPlayerIdsChange?.(queuedGameEventIds);
  }, [outIds, swapOnFieldGameEventIds, onQueuedPlayerIdsChange]);

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
        const playerOut = externalFieldPlayerToReplace;
        const playerIn = selection.benchPlayer;
        setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });

        if (executeImmediately) {
          executeSubstitutionNow(playerOut, playerIn);
        } else {
          const subItem: QueuedItem = {
            id: `sub-${Date.now()}-${Math.random()}`,
            type: 'substitution',
            playerOut,
            playerIn,
          };
          setQueue((prev) => [...prev, subItem]);
        }
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
    executeImmediately,
    executeSubstitutionNow,
  ]);

  // Handle a second on-field player clicked externally to complete a
  // field-first position swap (the card grid's equivalent of clicking a
  // second player in the old nested "On Field" tab)
  useEffect(() => {
    if (!externalFieldPlayerForSwap) return;

    if (selection.direction === 'field-first' && selection.fieldPlayer) {
      // Ignore if the target is already queued for substitution or swap
      const isQueued =
        outIds.has(externalFieldPlayerForSwap.gameEventId) ||
        swapPlayerIds.has(getPlayerId(externalFieldPlayerForSwap));

      if (!isQueued) {
        const fieldPlayer = selection.fieldPlayer;
        setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });

        if (executeImmediately) {
          executeSwapNow(fieldPlayer, externalFieldPlayerForSwap);
        } else {
          const swapItem: QueuedItem = {
            id: `swap-${Date.now()}-${Math.random()}`,
            type: 'swap',
            player1: {
              source: 'onField',
              player: fieldPlayer,
              gameEventId: fieldPlayer.gameEventId,
            },
            player2: {
              source: 'onField',
              player: externalFieldPlayerForSwap,
              gameEventId: externalFieldPlayerForSwap.gameEventId,
            },
          };
          setQueue((prev) => [...prev, swapItem]);
        }
      }
    }

    onExternalFieldPlayerForSwapHandled?.();
  }, [
    externalFieldPlayerForSwap,
    selection,
    outIds,
    swapPlayerIds,
    executeImmediately,
    executeSwapNow,
    onExternalFieldPlayerForSwapHandled,
  ]);

  // Calculate play time for all players
  const playTimeByPlayer = useMemo(() => {
    const allPlayerIds = [
      ...onField.map(getPlayerId),
      ...bench.map(getPlayerId),
    ];
    const results = new Map<
      string,
      { totalSeconds: number; isOnField: boolean }
    >();

    for (const playerId of allPlayerIds) {
      const result = calculatePlayTime(playerId, gameEvents, {
        period,
        periodSecond,
      });
      results.set(playerId, {
        totalSeconds: result.totalSeconds,
        isOnField: result.isOnField,
      });
    }

    return results;
  }, [onField, bench, gameEvents, period, periodSecond]);

  // Filter available players
  const onFieldPlayerIds = new Set(onField.map(getPlayerId));

  // Projected on-field count if every queued change were applied. The parent
  // gates the Lineup tab's "Add to Field" card on this. Substitutions and
  // swaps are net-zero (one comes in as one goes out), so only queued
  // additions (+1 each) and removals (-1 each) shift the count away from the
  // raw onField list.
  const projectedOnFieldCount = useMemo(() => {
    const queuedAdditions = queue.filter((q) => q.type === 'addition').length;
    const queuedRemovals = queue.filter((q) => q.type === 'removal').length;
    return onField.length + queuedAdditions - queuedRemovals;
  }, [onField.length, queue]);

  // Report the projected count upward so the parent can hide the "Add to
  // Field" card once queued adds would exceed the format's on-field limit.
  useEffect(() => {
    onProjectedOnFieldCountChange?.(projectedOnFieldCount);
  }, [projectedOnFieldCount, onProjectedOnFieldCountChange]);

  const availableBench = useMemo(
    () =>
      bench.filter((b) => {
        const id = getPlayerId(b);
        return !inIds.has(id) && !onFieldPlayerIds.has(id);
      }),
    [bench, inIds, onFieldPlayerIds],
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
        const fieldPlayer = selection.fieldPlayer;
        setSelection({
          direction: null,
          fieldPlayer: null,
          benchPlayer: null,
        });

        if (executeImmediately) {
          executeSubstitutionNow(fieldPlayer, player);
        } else {
          const subItem: QueuedItem = {
            id: `sub-${Date.now()}-${Math.random()}`,
            type: 'substitution',
            playerOut: fieldPlayer,
            playerIn: player,
          };
          setQueue((prev) => [...prev, subItem]);
        }
      }
    },
    [selection, executeImmediately, executeSubstitutionNow],
  );

  // Handle removal request (field player leaves, no replacement)
  const handleRequestRemoval = useCallback(
    (player: GqlRosterPlayer) => {
      setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });

      if (executeImmediately) {
        // Execute immediately (halftime mode - unlikely but handle for consistency)
        removePlayerFromFieldMutation({
          variables: {
            input: {
              gameTeamId,
              playerEventId: player.gameEventId,
              period,
              periodSecond,
            },
          },
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, [
              data?.removePlayerFromField,
            ]),
        }).catch((err) => {
          console.error('Failed to remove player from field:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to remove player from field',
          );
        });
      } else {
        const removalItem: QueuedItem = {
          id: `removal-${Date.now()}-${Math.random()}`,
          type: 'removal',
          playerOut: player,
        };
        setQueue((prev) => [...prev, removalItem]);
      }
    },
    [
      executeImmediately,
      gameTeamId,
      period,
      periodSecond,
      removePlayerFromFieldMutation,
    ],
  );

  // Handle addition request (bench player comes onto the field, no one
  // subbed out - e.g. filling a gap when the team is short a player, or
  // filling a specific empty formation slot when tracking positions).
  // `position` is omitted for the no-position-tracking "Add to Field" flow
  // (falls back to FIELD_SENTINEL_POSITION); it's the target formation slot
  // for the tracked-position "fill empty position" flow.
  const handleRequestAddition = useCallback(
    (player: GqlRosterPlayer, position?: string) => {
      setSelection({ direction: null, fieldPlayer: null, benchPlayer: null });
      const targetPosition = position ?? FIELD_SENTINEL_POSITION;

      if (executeImmediately) {
        // Execute immediately (halftime mode - unlikely but handle for consistency)
        bringPlayerOntoFieldMutation({
          variables: {
            input: {
              gameTeamId,
              playerId: player.playerId || undefined,
              externalPlayerName: player.externalPlayerName || undefined,
              externalPlayerNumber: player.externalPlayerNumber || undefined,
              position: targetPosition,
              period,
              periodSecond,
            },
          },
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, [
              data?.bringPlayerOntoField,
            ]),
        }).catch((err) => {
          console.error('Failed to bring player onto field:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to bring player onto field',
          );
        });
      } else {
        const additionItem: QueuedItem = {
          id: `addition-${Date.now()}-${Math.random()}`,
          type: 'addition',
          playerIn: player,
          position,
        };
        setQueue((prev) => [...prev, additionItem]);
      }
    },
    [
      executeImmediately,
      gameTeamId,
      period,
      periodSecond,
      bringPlayerOntoFieldMutation,
    ],
  );

  // Handle external "Add to Field" trigger - the card lives in the Lineup
  // tab's On Field section (next to the on-field players), not in this
  // panel, so the tap arrives here as a prop change.
  useEffect(() => {
    if (!externalAddToField) return;

    if (selection.direction === 'bench-first' && selection.benchPlayer) {
      handleRequestAddition(selection.benchPlayer);
    }
    // Notify the parent even if ignored, so its flag doesn't stay stuck on
    onExternalAddToFieldHandled?.();
  }, [
    externalAddToField,
    selection.direction,
    selection.benchPlayer,
    handleRequestAddition,
    onExternalAddToFieldHandled,
  ]);

  // Handle external empty position click (fill empty position during bench-first flow)
  useEffect(() => {
    if (
      externalEmptyPosition &&
      selection.direction === 'bench-first' &&
      selection.benchPlayer
    ) {
      // Reuse the same addition path the no-position-tracking "Add to
      // Field" flow uses, so filling an empty formation slot is queued
      // alongside other pending changes (and shown in the queue) just
      // like every other substitution action during live play, instead
      // of jumping the queue with an immediate mutation.
      handleRequestAddition(selection.benchPlayer, externalEmptyPosition);
      onExternalEmptyPositionHandled?.();
    } else if (externalEmptyPosition && selection.direction === null) {
      // No selection active at all - this is the first tap on the empty
      // slot. Open the panel so the coach can pick a bench player, then tap
      // the same slot again to complete the fill (handled by the branch
      // above once selection.direction is 'bench-first').
      setPanelState('bench-view');
      onExternalEmptyPositionHandled?.();
    } else if (externalEmptyPosition) {
      // A field-first (or other non-bench) selection is already active -
      // an empty-position tap isn't meaningful mid-flow. Clear without
      // disturbing the panel's current state.
      onExternalEmptyPositionHandled?.();
    }
  }, [
    externalEmptyPosition,
    selection.direction,
    selection.benchPlayer,
    onExternalEmptyPositionHandled,
    handleRequestAddition,
    setPanelState,
  ]);

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

    try {
      // Record each action on this device, in order; the outbox sends them.
      const actions = buildQueuedActions(queue, {
        gameTeamId,
        period,
        periodSecond,
        trackPositions,
      });
      for (const action of actions) {
        await recordAction(action);
      }

      // Everything is recorded on this device: clear the queue and close
      // now. The roster and score show the pending events until the outbox
      // has sent them.
      setExecutionProgress(queue.length);
      setQueue([]);
      setPanelState('collapsed');

      // The game query is still refreshed for the server-computed per-player
      // stats (play time) the client can't derive. It runs in the background
      // and, until the outbox has sent the changes, returns the pre-change
      // stats; the GameEventChanged subscription's debounced refetch brings
      // the final numbers once they're confirmed.
      client
        .query({
          query: GET_GAME_BY_ID,
          variables: { id: gameId },
          fetchPolicy: 'network-only',
        })
        .catch((refetchErr) => {
          console.warn(
            '[SubstitutionPanel] Background refetch failed:',
            refetchErr,
          );
        });

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
      // Only failing to store an action on this device lands here
      console.error('Failed to record lineup changes:', err);
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
    trackPositions,
    recordAction,
    client,
    onSubstitutionComplete,
    setPanelState,
  ]);

  return (
    <SubstitutionPanelPresentation
      panelState={panelState}
      onPanelStateChange={setPanelState}
      teamName={teamName}
      teamColor={teamColor}
      benchPlayers={availableBench}
      getJerseyNumber={getJerseyNumber}
      playTimeByPlayer={playTimeByPlayer}
      selection={selection}
      onBenchPlayerClick={handleBenchPlayerClick}
      onClearSelection={handleClearSelection}
      queue={queue}
      onRemoveFromQueue={handleRemoveFromQueue}
      onConfirmAll={handleConfirmAll}
      onRequestRemoval={handleRequestRemoval}
      isExecuting={isExecuting}
      executionProgress={executionProgress}
      error={error}
      period={period}
      periodSecond={periodSecond}
    />
  );
};

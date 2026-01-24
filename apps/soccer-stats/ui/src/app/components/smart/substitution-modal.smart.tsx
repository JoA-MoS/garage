import { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';

import { ModalPortal } from '@garage/soccer-stats/ui-components';
import {
  LineupPlayer,
  BatchSubstitutionInput,
  BatchSwapInput,
} from '@garage/soccer-stats/graphql-codegen';

import {
  BATCH_LINEUP_CHANGES,
  GET_GAME_BY_ID,
  GET_GAME_LINEUP,
} from '../../services/games-graphql.service';

interface SubstitutionModalProps {
  gameTeamId: string;
  gameId: string;
  teamName: string;
  teamColor: string;
  currentOnField: LineupPlayer[];
  bench: LineupPlayer[];
  gameMinute: number;
  gameSecond: number;
  onClose: () => void;
  onSuccess?: () => void;
}

// A player in a swap can be either an existing on-field player or an incoming player from a queued sub
type SwapPlayer =
  | {
      source: 'onField';
      player: LineupPlayer;
      gameEventId: string;
    }
  | {
      source: 'queuedSub';
      player: LineupPlayer;
      queuedSubId: string; // Reference to the queued substitution
    };

// Queued item can be either a substitution or a position swap
type QueuedItem =
  | {
      id: string;
      type: 'substitution';
      playerOut: LineupPlayer;
      playerIn: LineupPlayer;
    }
  | {
      id: string;
      type: 'swap';
      player1: SwapPlayer;
      player2: SwapPlayer;
    };

type ModalMode = 'substitution' | 'swap';

/**
 * Get display name for a player
 */
function getPlayerDisplayName(player: LineupPlayer): string {
  if (player.playerName) {
    return player.playerName;
  }
  if (player.firstName || player.lastName) {
    return `${player.firstName || ''} ${player.lastName || ''}`.trim();
  }
  if (player.externalPlayerName) {
    return player.externalPlayerName;
  }
  return 'Unknown';
}

/**
 * Get jersey number display
 */
function getJerseyNumber(player: LineupPlayer): string | null {
  if (player.externalPlayerNumber) {
    return player.externalPlayerNumber;
  }
  return null;
}

export const SubstitutionModal = ({
  gameTeamId,
  gameId,
  teamName,
  teamColor,
  currentOnField,
  bench,
  gameMinute,
  gameSecond,
  onClose,
  onSuccess,
}: SubstitutionModalProps) => {
  // Mode toggle between substitution and position swap
  const [mode, setMode] = useState<ModalMode>('substitution');

  // Unified queue for both substitutions and swaps
  const [queue, setQueue] = useState<QueuedItem[]>([]);

  // Current selection state for substitution
  const [playerOutEventId, setPlayerOutEventId] = useState('');
  const [playerInId, setPlayerInId] = useState('');

  // Position swap selection state - tracks both source and identifier
  type SwapSelection =
    | { source: 'onField'; gameEventId: string }
    | { source: 'queuedSub'; queuedSubId: string }
    | null;
  const [swapPlayer1, setSwapPlayer1] = useState<SwapSelection>(null);
  const [swapPlayer2, setSwapPlayer2] = useState<SwapSelection>(null);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Apollo client for manual refetch after all operations complete
  const client = useApolloClient();

  // Single batch mutation for all lineup changes
  // This reduces N+M requests down to 1 request for better performance
  const [batchLineupChanges] = useMutation(BATCH_LINEUP_CHANGES);

  // Helper to get player ID for matching
  const getPlayerId = (player: LineupPlayer) =>
    player.playerId || player.externalPlayerName || '';

  // Get IDs of players already in queue
  const getQueuedPlayerIds = () => {
    const outIds = new Set<string>(); // gameEventIds of players being subbed out
    const inIds = new Set<string>(); // playerIds of players being subbed in
    const swapPlayerIds = new Set<string>(); // playerIds of players in swaps

    queue.forEach((item) => {
      if (item.type === 'substitution') {
        outIds.add(item.playerOut.gameEventId);
        inIds.add(getPlayerId(item.playerIn));
      } else {
        // Track by playerId for swaps (handles both onField and queuedSub sources)
        swapPlayerIds.add(getPlayerId(item.player1.player));
        swapPlayerIds.add(getPlayerId(item.player2.player));
      }
    });

    return { outIds, inIds, swapPlayerIds };
  };

  const {
    outIds: queuedOutIds,
    inIds: queuedInIds,
    swapPlayerIds: queuedSwapPlayerIds,
  } = getQueuedPlayerIds();

  // Get queued substitutions (for showing incoming players in swap mode)
  const queuedSubs = queue.filter(
    (q): q is Extract<QueuedItem, { type: 'substitution' }> =>
      q.type === 'substitution',
  );

  // IDs of players currently on field (to prevent showing them in bench list)
  const currentOnFieldPlayerIds = new Set(
    currentOnField.map((p) => getPlayerId(p)),
  );

  // Available players (excluding those already in queue or on field)
  const availableOnField = currentOnField.filter(
    (p) =>
      !queuedOutIds.has(p.gameEventId) &&
      !queuedSwapPlayerIds.has(getPlayerId(p)),
  );
  const availableBench = bench.filter((b) => {
    if (b.isOnField) return false;
    const id = getPlayerId(b);
    // Exclude if already queued OR if currently on field
    return !queuedInIds.has(id) && !currentOnFieldPlayerIds.has(id);
  });

  // For swaps, show field players not queued out + incoming players from queued subs
  // Excluding those already in a swap
  const availableOnFieldForSwap = currentOnField.filter(
    (p) =>
      !queuedOutIds.has(p.gameEventId) &&
      !queuedSwapPlayerIds.has(getPlayerId(p)),
  );

  // Incoming players from queued subs (available for swaps, not already in a swap)
  const incomingPlayersForSwap = queuedSubs
    .filter((sub) => !queuedSwapPlayerIds.has(getPlayerId(sub.playerIn)))
    .map((sub) => ({
      player: sub.playerIn,
      queuedSubId: sub.id,
    }));

  // Mode change handler - reset selection states
  const handleModeChange = (newMode: ModalMode) => {
    setMode(newMode);
    // Reset selection states
    setPlayerOutEventId('');
    setPlayerInId('');
    setSwapPlayer1(null);
    setSwapPlayer2(null);
  };

  // Add substitution to queue
  const handleAddSubToQueue = () => {
    if (!playerOutEventId || !playerInId) return;

    const playerOut = currentOnField.find(
      (p) => p.gameEventId === playerOutEventId,
    );
    const playerIn = availableBench.find(
      (p) => (p.playerId || p.externalPlayerName) === playerInId,
    );

    if (!playerOut || !playerIn) return;

    setQueue((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}-${Math.random()}`,
        type: 'substitution',
        playerOut,
        playerIn,
      },
    ]);

    // Reset selection
    setPlayerOutEventId('');
    setPlayerInId('');
  };

  // Add swap to queue
  const handleAddSwapToQueue = () => {
    if (!swapPlayer1 || !swapPlayer2) return;

    // Resolve player1
    let resolvedPlayer1: SwapPlayer | null = null;
    if (swapPlayer1.source === 'onField') {
      const player = currentOnField.find(
        (p) => p.gameEventId === swapPlayer1.gameEventId,
      );
      if (player) {
        resolvedPlayer1 = {
          source: 'onField',
          player,
          gameEventId: swapPlayer1.gameEventId,
        };
      }
    } else {
      const sub = queuedSubs.find((s) => s.id === swapPlayer1.queuedSubId);
      if (sub) {
        resolvedPlayer1 = {
          source: 'queuedSub',
          player: sub.playerIn,
          queuedSubId: swapPlayer1.queuedSubId,
        };
      }
    }

    // Resolve player2
    let resolvedPlayer2: SwapPlayer | null = null;
    if (swapPlayer2.source === 'onField') {
      const player = currentOnField.find(
        (p) => p.gameEventId === swapPlayer2.gameEventId,
      );
      if (player) {
        resolvedPlayer2 = {
          source: 'onField',
          player,
          gameEventId: swapPlayer2.gameEventId,
        };
      }
    } else {
      const sub = queuedSubs.find((s) => s.id === swapPlayer2.queuedSubId);
      if (sub) {
        resolvedPlayer2 = {
          source: 'queuedSub',
          player: sub.playerIn,
          queuedSubId: swapPlayer2.queuedSubId,
        };
      }
    }

    if (!resolvedPlayer1 || !resolvedPlayer2) return;

    setQueue((prev) => [
      ...prev,
      {
        id: `swap-${Date.now()}-${Math.random()}`,
        type: 'swap',
        player1: resolvedPlayer1,
        player2: resolvedPlayer2,
      },
    ]);

    // Reset selection
    setSwapPlayer1(null);
    setSwapPlayer2(null);
  };

  // Remove item from queue
  const handleRemoveFromQueue = (queueId: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== queueId));
  };

  // Execute all queued items using a single batch mutation
  const handleConfirmAll = async () => {
    if (queue.length === 0) return;

    setIsExecuting(true);
    setExecutionProgress(0);
    setError(null); // Clear any previous error

    // Separate subs and swaps
    const subs = queue.filter(
      (q): q is Extract<QueuedItem, { type: 'substitution' }> =>
        q.type === 'substitution',
    );
    const swaps = queue.filter(
      (q): q is Extract<QueuedItem, { type: 'swap' }> => q.type === 'swap',
    );

    // Map from queuedSubId to substitution index for swap references
    const subIdToIndex = new Map<string, number>();
    subs.forEach((sub, index) => {
      subIdToIndex.set(sub.id, index);
    });

    try {
      // Build substitution inputs
      const substitutionInputs: BatchSubstitutionInput[] = subs.map((sub) => ({
        playerOutEventId: sub.playerOut.gameEventId,
        playerInId: sub.playerIn.playerId || undefined,
        externalPlayerInName: sub.playerIn.externalPlayerName || undefined,
        externalPlayerInNumber: sub.playerIn.externalPlayerNumber || undefined,
      }));

      // Build swap inputs with player references
      const swapInputs: BatchSwapInput[] = swaps.map((swap) => {
        // Resolve player1 reference
        const player1 =
          swap.player1.source === 'onField'
            ? { eventId: swap.player1.gameEventId }
            : { substitutionIndex: subIdToIndex.get(swap.player1.queuedSubId) };

        // Resolve player2 reference
        const player2 =
          swap.player2.source === 'onField'
            ? { eventId: swap.player2.gameEventId }
            : { substitutionIndex: subIdToIndex.get(swap.player2.queuedSubId) };

        return { player1, player2 };
      });

      // Execute single batch mutation for all changes
      await batchLineupChanges({
        variables: {
          input: {
            gameTeamId,
            gameMinute,
            gameSecond,
            substitutions: substitutionInputs,
            swaps: swapInputs,
          },
        },
      });

      setExecutionProgress(queue.length);

      // Refetch queries with explicit variables after batch completes
      await Promise.all([
        client.query({
          query: GET_GAME_BY_ID,
          variables: { id: gameId },
          fetchPolicy: 'network-only',
        }),
        client.query({
          query: GET_GAME_LINEUP,
          variables: { gameTeamId },
          fetchPolicy: 'network-only',
        }),
      ]);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to execute batch changes:', err);
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setIsExecuting(false);
    }
  };

  // Handle swap player click for on-field players
  const handleSwapOnFieldClick = (gameEventId: string) => {
    const selection: SwapSelection = { source: 'onField', gameEventId };

    // Check if this player is already selected
    const isPlayer1 =
      swapPlayer1?.source === 'onField' &&
      swapPlayer1.gameEventId === gameEventId;
    const isPlayer2 =
      swapPlayer2?.source === 'onField' &&
      swapPlayer2.gameEventId === gameEventId;

    if (isPlayer1) {
      setSwapPlayer1(null);
    } else if (isPlayer2) {
      setSwapPlayer2(null);
    } else if (!swapPlayer1) {
      setSwapPlayer1(selection);
    } else if (!swapPlayer2) {
      setSwapPlayer2(selection);
    } else {
      // Both selected, replace player 2
      setSwapPlayer2(selection);
    }
  };

  // Handle swap player click for incoming players from queued subs
  const handleSwapIncomingClick = (queuedSubId: string) => {
    const selection: SwapSelection = { source: 'queuedSub', queuedSubId };

    // Check if this player is already selected
    const isPlayer1 =
      swapPlayer1?.source === 'queuedSub' &&
      swapPlayer1.queuedSubId === queuedSubId;
    const isPlayer2 =
      swapPlayer2?.source === 'queuedSub' &&
      swapPlayer2.queuedSubId === queuedSubId;

    if (isPlayer1) {
      setSwapPlayer1(null);
    } else if (isPlayer2) {
      setSwapPlayer2(null);
    } else if (!swapPlayer1) {
      setSwapPlayer1(selection);
    } else if (!swapPlayer2) {
      setSwapPlayer2(selection);
    } else {
      // Both selected, replace player 2
      setSwapPlayer2(selection);
    }
  };

  // Check if current selection is valid
  const canAddSub = playerOutEventId && playerInId;
  const canAddSwap = swapPlayer1 && swapPlayer2;
  const hasQueuedItems = queue.length > 0;

  // Count items by type
  const subCount = queue.filter((q) => q.type === 'substitution').length;
  const swapCount = queue.filter((q) => q.type === 'swap').length;

  return (
    <ModalPortal isOpen={true}>
      <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: teamColor, color: '#fff' }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Changes</h3>
            <p className="text-sm text-gray-500">
              {teamName} &bull; {String(gameMinute).padStart(2, '0')}:
              {String(gameSecond).padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* Queued Items */}
        {hasQueuedItems && (
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Queued Changes ({queue.length})
                {subCount > 0 && swapCount > 0 && (
                  <span className="ml-1 font-normal text-gray-500">
                    ({subCount} sub{subCount !== 1 ? 's' : ''}, {swapCount} swap
                    {swapCount !== 1 ? 's' : ''})
                  </span>
                )}
              </span>
            </div>
            <div className="space-y-2">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg border bg-white p-2 ${
                    item.type === 'substitution'
                      ? 'border-blue-200'
                      : 'border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    {item.type === 'substitution' ? (
                      <>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-600">
                          S
                        </span>
                        <span className="inline-flex items-center gap-1 text-red-600">
                          {getJerseyNumber(item.playerOut) &&
                            `#${getJerseyNumber(item.playerOut)} `}
                          {getPlayerDisplayName(item.playerOut)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="inline-flex items-center gap-1 text-green-600">
                          {getJerseyNumber(item.playerIn) &&
                            `#${getJerseyNumber(item.playerIn)} `}
                          {getPlayerDisplayName(item.playerIn)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-xs font-medium text-purple-600">
                          P
                        </span>
                        <span
                          className={
                            item.player1.source === 'queuedSub'
                              ? 'text-green-600'
                              : 'text-gray-900'
                          }
                        >
                          {getJerseyNumber(item.player1.player) &&
                            `#${getJerseyNumber(item.player1.player)} `}
                          {getPlayerDisplayName(item.player1.player)}
                          {item.player1.source === 'queuedSub' && ' (incoming)'}
                        </span>
                        <span className="text-purple-500">↔</span>
                        <span
                          className={
                            item.player2.source === 'queuedSub'
                              ? 'text-green-600'
                              : 'text-gray-900'
                          }
                        >
                          {getJerseyNumber(item.player2.player) &&
                            `#${getJerseyNumber(item.player2.player)} `}
                          {getPlayerDisplayName(item.player2.player)}
                          {item.player2.source === 'queuedSub' && ' (incoming)'}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromQueue(item.id)}
                    disabled={isExecuting}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        {!isExecuting && (
          <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('substitution')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'substitution'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Substitute
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('swap')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'swap'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                Swap Positions
              </span>
            </button>
          </div>
        )}

        {/* SUBSTITUTION MODE */}
        {mode === 'substitution' && !isExecuting && (
          <div className="space-y-4">
            {/* Player Out */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <svg
                    className="h-4 w-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Player Out
                </span>
              </label>
              {availableOnField.length === 0 ? (
                <p className="text-sm italic text-gray-500">
                  {currentOnField.length === 0
                    ? 'No players on field'
                    : 'All field players are queued'}
                </p>
              ) : (
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {availableOnField.map((player) => {
                    const eventId = player.gameEventId;
                    const jersey = getJerseyNumber(player);
                    const name = getPlayerDisplayName(player);
                    const isSelected = playerOutEventId === eventId;

                    return (
                      <button
                        key={eventId}
                        type="button"
                        onClick={() => setPlayerOutEventId(eventId)}
                        className={`flex w-full items-center gap-3 rounded-lg border p-2 transition-colors ${
                          isSelected
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {jersey && (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                            {jersey}
                          </span>
                        )}
                        <span
                          className={`flex-1 text-left text-sm font-medium ${
                            isSelected ? 'text-red-700' : 'text-gray-900'
                          }`}
                        >
                          {name}
                        </span>
                        {player.position && (
                          <span className="text-xs text-gray-500">
                            {player.position}
                          </span>
                        )}
                        {isSelected && (
                          <svg
                            className="h-4 w-4 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Swap Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-gray-100 p-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
            </div>

            {/* Player In */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <span className="inline-flex items-center gap-1">
                  <svg
                    className="h-4 w-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Player In
                </span>
              </label>
              {availableBench.length === 0 ? (
                <p className="text-sm italic text-gray-500">
                  {bench.length === 0
                    ? 'No players on bench'
                    : 'All bench players are queued'}
                </p>
              ) : (
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {availableBench.map((player) => {
                    const id =
                      player.playerId || player.externalPlayerName || '';
                    const jersey = getJerseyNumber(player);
                    const name = getPlayerDisplayName(player);
                    const isSelected = playerInId === id;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPlayerInId(id)}
                        className={`flex w-full items-center gap-3 rounded-lg border p-2 transition-colors ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {jersey && (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                            {jersey}
                          </span>
                        )}
                        <span
                          className={`flex-1 text-left text-sm font-medium ${
                            isSelected ? 'text-green-700' : 'text-gray-900'
                          }`}
                        >
                          {name}
                        </span>
                        {isSelected && (
                          <svg
                            className="h-4 w-4 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add to Queue Button */}
            <button
              type="button"
              onClick={handleAddSubToQueue}
              disabled={!canAddSub}
              className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600"
            >
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Substitution to Queue
              </span>
            </button>
          </div>
        )}

        {/* POSITION SWAP MODE */}
        {mode === 'swap' && !isExecuting && (
          <>
            {/* Selected Players Preview */}
            {(swapPlayer1 || swapPlayer2) && (
              <div className="mb-4 rounded-lg bg-purple-50 p-3">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    {swapPlayer1 ? (
                      (() => {
                        let player: LineupPlayer | undefined;
                        let isIncoming = false;
                        if (swapPlayer1.source === 'onField') {
                          player = currentOnField.find(
                            (p) => p.gameEventId === swapPlayer1.gameEventId,
                          );
                        } else {
                          const sub = queuedSubs.find(
                            (s) => s.id === swapPlayer1.queuedSubId,
                          );
                          player = sub?.playerIn;
                          isIncoming = true;
                        }
                        return player ? (
                          <>
                            <div
                              className={`font-medium ${
                                isIncoming ? 'text-green-600' : 'text-gray-900'
                              }`}
                            >
                              {getPlayerDisplayName(player)}
                              {isIncoming && ' (incoming)'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {player.position || 'No position'}
                            </div>
                          </>
                        ) : null;
                      })()
                    ) : (
                      <div className="text-sm text-gray-400">
                        Select player 1
                      </div>
                    )}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <svg
                      className="h-5 w-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    {swapPlayer2 ? (
                      (() => {
                        let player: LineupPlayer | undefined;
                        let isIncoming = false;
                        if (swapPlayer2.source === 'onField') {
                          player = currentOnField.find(
                            (p) => p.gameEventId === swapPlayer2.gameEventId,
                          );
                        } else {
                          const sub = queuedSubs.find(
                            (s) => s.id === swapPlayer2.queuedSubId,
                          );
                          player = sub?.playerIn;
                          isIncoming = true;
                        }
                        return player ? (
                          <>
                            <div
                              className={`font-medium ${
                                isIncoming ? 'text-green-600' : 'text-gray-900'
                              }`}
                            >
                              {getPlayerDisplayName(player)}
                              {isIncoming && ' (incoming)'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {player.position || 'No position'}
                            </div>
                          </>
                        ) : null;
                      })()
                    ) : (
                      <div className="text-sm text-gray-400">
                        Select player 2
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <p className="mb-3 text-sm text-gray-600">
              Select two players to swap their positions.
              {incomingPlayersForSwap.length > 0 && (
                <span className="text-green-600">
                  {' '}
                  Incoming players from queued subs are available.
                </span>
              )}
            </p>

            {/* Player Selection */}
            <div className="space-y-4">
              {/* On-Field Players */}
              {availableOnFieldForSwap.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    On Field
                  </p>
                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {availableOnFieldForSwap.map((player) => {
                      const eventId = player.gameEventId;
                      const jersey = getJerseyNumber(player);
                      const name = getPlayerDisplayName(player);
                      const isPlayer1 =
                        swapPlayer1?.source === 'onField' &&
                        swapPlayer1.gameEventId === eventId;
                      const isPlayer2 =
                        swapPlayer2?.source === 'onField' &&
                        swapPlayer2.gameEventId === eventId;
                      const isSelected = isPlayer1 || isPlayer2;

                      return (
                        <button
                          key={eventId}
                          type="button"
                          onClick={() => handleSwapOnFieldClick(eventId)}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 transition-colors ${
                            isPlayer1
                              ? 'border-blue-500 bg-blue-50'
                              : isPlayer2
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {jersey && (
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                isPlayer1
                                  ? 'bg-blue-200 text-blue-700'
                                  : isPlayer2
                                    ? 'bg-purple-200 text-purple-700'
                                    : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {jersey}
                            </span>
                          )}
                          <div className="flex-1 text-left">
                            <span
                              className={`font-medium ${
                                isPlayer1
                                  ? 'text-blue-700'
                                  : isPlayer2
                                    ? 'text-purple-700'
                                    : 'text-gray-900'
                              }`}
                            >
                              {name}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              {player.position || 'No position'}
                            </span>
                          </div>
                          {isSelected && (
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                                isPlayer1 ? 'bg-blue-500' : 'bg-purple-500'
                              }`}
                            >
                              {isPlayer1 ? '1' : '2'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Incoming Players from Queued Subs */}
              {incomingPlayersForSwap.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-green-600">
                    Incoming (from queued subs)
                  </p>
                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {incomingPlayersForSwap.map(({ player, queuedSubId }) => {
                      const jersey = getJerseyNumber(player);
                      const name = getPlayerDisplayName(player);
                      const isPlayer1 =
                        swapPlayer1?.source === 'queuedSub' &&
                        swapPlayer1.queuedSubId === queuedSubId;
                      const isPlayer2 =
                        swapPlayer2?.source === 'queuedSub' &&
                        swapPlayer2.queuedSubId === queuedSubId;
                      const isSelected = isPlayer1 || isPlayer2;

                      return (
                        <button
                          key={queuedSubId}
                          type="button"
                          onClick={() => handleSwapIncomingClick(queuedSubId)}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 transition-colors ${
                            isPlayer1
                              ? 'border-blue-500 bg-blue-50'
                              : isPlayer2
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-green-200 bg-green-50 hover:border-green-300'
                          }`}
                        >
                          {jersey && (
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                isPlayer1
                                  ? 'bg-blue-200 text-blue-700'
                                  : isPlayer2
                                    ? 'bg-purple-200 text-purple-700'
                                    : 'bg-green-200 text-green-700'
                              }`}
                            >
                              {jersey}
                            </span>
                          )}
                          <div className="flex-1 text-left">
                            <span
                              className={`font-medium ${
                                isPlayer1
                                  ? 'text-blue-700'
                                  : isPlayer2
                                    ? 'text-purple-700'
                                    : 'text-green-700'
                              }`}
                            >
                              {name}
                            </span>
                            <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-600">
                              incoming
                            </span>
                          </div>
                          {isSelected && (
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                                isPlayer1 ? 'bg-blue-500' : 'bg-purple-500'
                              }`}
                            >
                              {isPlayer1 ? '1' : '2'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {availableOnFieldForSwap.length + incomingPlayersForSwap.length <
                2 && (
                <p className="text-sm italic text-gray-500">
                  Need at least 2 available players to swap
                </p>
              )}
            </div>

            {/* Add Swap to Queue Button */}
            <button
              type="button"
              onClick={handleAddSwapToQueue}
              disabled={!canAddSwap}
              className="mt-4 w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600"
            >
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Position Swap to Queue
              </span>
            </button>
          </>
        )}

        {/* Execution Progress */}
        {isExecuting && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">
              Processing changes... ({executionProgress}/{queue.length})
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-700 sm:p-5 sm:text-sm md:p-6">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Actions */}
        {!isExecuting && (
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
            >
              {hasQueuedItems ? 'Cancel' : 'Done'}
            </button>
            {hasQueuedItems && (
              <button
                type="button"
                onClick={handleConfirmAll}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
              >
                Confirm All ({queue.length})
              </button>
            )}
          </div>
        )}
      </div>
    </ModalPortal>
  );
};

import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

import { RECORD_GOAL, UPDATE_GOAL } from '../../services/games-graphql.service';
import { LineupPlayer, StatsTrackingLevel } from '../../generated/graphql';

// Fragment for writing GameEvent to cache during optimistic updates
const GameEventFragment = gql`
  fragment GameEventFragment on GameEvent {
    id
    gameMinute
    gameSecond
    position
    playerId
    externalPlayerName
    externalPlayerNumber
    eventType {
      id
      name
      category
    }
  }
`;

// Generate a temporary ID for optimistic updates
// Uses a prefix to distinguish from real IDs and includes timestamp for uniqueness
let optimisticIdCounter = 0;
function generateOptimisticId(): string {
  return `optimistic-goal-${Date.now()}-${++optimisticIdCounter}`;
}

// Data for an existing goal being edited
export interface EditGoalData {
  id: string;
  gameMinute: number;
  gameSecond: number;
  playerId?: string | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  assist?: {
    playerId?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
  } | null;
}

interface GoalModalProps {
  gameTeamId: string;
  gameId: string;
  teamId: string; // The actual team ID (not gameTeam ID) for refetching stats
  teamName: string;
  teamColor: string;
  currentOnField: LineupPlayer[];
  bench: LineupPlayer[];
  gameMinute: number;
  gameSecond: number;
  onClose: () => void;
  onSuccess?: () => void;
  // Edit mode props
  editGoal?: EditGoalData;
  // Stats tracking level - determines which fields to show
  statsTrackingLevel?: StatsTrackingLevel | null;
}

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
function getJerseyNumber(player: LineupPlayer): string {
  if (player.externalPlayerNumber) {
    return `#${player.externalPlayerNumber}`;
  }
  return '';
}

type EntryMode = 'lineup' | 'quick';

export const GoalModal = ({
  gameTeamId,
  gameId,
  teamId,
  teamName,
  teamColor,
  currentOnField,
  bench,
  gameMinute: defaultGameMinute,
  gameSecond: defaultGameSecond,
  onClose,
  onSuccess,
  editGoal,
  statsTrackingLevel,
}: GoalModalProps) => {
  // Determine which fields to show based on tracking level
  const showScorerField = statsTrackingLevel !== StatsTrackingLevel.GoalsOnly;
  const showAssisterField =
    statsTrackingLevel === StatsTrackingLevel.Full || !statsTrackingLevel;
  const isEditMode = !!editGoal;
  const hasLineupPlayers = currentOnField.length > 0 || bench.length > 0;

  // Determine initial entry mode based on edit data or lineup availability
  const getInitialEntryMode = (): EntryMode => {
    if (editGoal) {
      // If editing and there's a playerId, use lineup mode; otherwise quick mode
      return editGoal.playerId ? 'lineup' : 'quick';
    }
    return hasLineupPlayers ? 'lineup' : 'quick';
  };

  // Get initial scorer ID from edit data
  const getInitialScorerId = (): string => {
    if (editGoal?.playerId) return editGoal.playerId;
    if (editGoal?.externalPlayerName) return editGoal.externalPlayerName;
    return '';
  };

  // Get initial assister ID from edit data
  const getInitialAssisterId = (): string => {
    if (editGoal?.assist?.playerId) return editGoal.assist.playerId;
    if (editGoal?.assist?.externalPlayerName)
      return editGoal.assist.externalPlayerName;
    return '';
  };

  const [entryMode, setEntryMode] = useState<EntryMode>(getInitialEntryMode);
  const [scorerId, setScorerId] = useState(getInitialScorerId);
  const [assisterId, setAssisterId] = useState(getInitialAssisterId);
  const [showBench, setShowBench] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick entry fields - extract number from externalPlayerNumber
  const [quickScorerNumber, setQuickScorerNumber] = useState(
    editGoal?.externalPlayerNumber?.replace(/\D/g, '') || ''
  );
  const [quickAssisterNumber, setQuickAssisterNumber] = useState(
    editGoal?.assist?.externalPlayerNumber?.replace(/\D/g, '') || ''
  );

  // Time fields (editable in edit mode)
  const [editMinute, setEditMinute] = useState(
    editGoal?.gameMinute ?? defaultGameMinute
  );
  const [editSecond, setEditSecond] = useState(
    editGoal?.gameSecond ?? defaultGameSecond
  );

  // Track if we should clear the assist
  const [clearAssist, setClearAssist] = useState(false);

  // Optimistic update: immediately add goal to cache before server responds
  // This provides instant feedback when recording a goal
  const [recordGoal, { loading: recordLoading }] = useMutation(RECORD_GOAL);

  const [updateGoal, { loading: updateLoading }] = useMutation(UPDATE_GOAL);

  const loading = recordLoading || updateLoading;

  // Players available for selection (always include bench in edit mode for flexibility)
  const availablePlayers =
    showBench || isEditMode ? [...currentOnField, ...bench] : currentOnField;

  // Exclude selected scorer from assist options
  const assistOptions = availablePlayers.filter((p) => {
    const playerId = p.playerId || p.externalPlayerName;
    const selectedId = scorerId;
    return playerId !== selectedId;
  });

  const handleSubmit = async () => {
    setError(null); // Clear any previous error

    // Find the selected scorer player (lineup mode)
    const scorer =
      entryMode === 'lineup' && scorerId
        ? availablePlayers.find(
            (p) => (p.playerId || p.externalPlayerName) === scorerId
          )
        : null;

    // Find the selected assister player (lineup mode)
    const assister =
      entryMode === 'lineup' && assisterId
        ? availablePlayers.find(
            (p) => (p.playerId || p.externalPlayerName) === assisterId
          )
        : null;

    try {
      if (isEditMode) {
        // Update existing goal
        await updateGoal({
          variables: {
            input: {
              gameEventId: editGoal.id,
              gameMinute: editMinute,
              gameSecond: editSecond,
              // Scorer info
              scorerId: scorer?.playerId || undefined,
              externalScorerName:
                scorer?.externalPlayerName ||
                (entryMode === 'quick' && quickScorerNumber
                  ? `#${quickScorerNumber}`
                  : undefined),
              externalScorerNumber:
                scorer?.externalPlayerNumber ||
                (entryMode === 'quick'
                  ? quickScorerNumber || undefined
                  : undefined),
              // Assister info
              assisterId: assister?.playerId || undefined,
              externalAssisterName:
                assister?.externalPlayerName ||
                (entryMode === 'quick' && quickAssisterNumber
                  ? `#${quickAssisterNumber}`
                  : undefined),
              externalAssisterNumber:
                assister?.externalPlayerNumber ||
                (entryMode === 'quick'
                  ? quickAssisterNumber || undefined
                  : undefined),
              // Clear assist if checkbox is checked and no new assister provided
              clearAssist: clearAssist && !assisterId && !quickAssisterNumber,
            },
          },
        });
      } else {
        // Create new goal with optimistic update for instant feedback
        const optimisticId = generateOptimisticId();
        const externalScorerName =
          scorer?.externalPlayerName ||
          (entryMode === 'quick' && quickScorerNumber
            ? `#${quickScorerNumber}`
            : null);
        const externalScorerNumber =
          scorer?.externalPlayerNumber ||
          (entryMode === 'quick' ? quickScorerNumber || null : null);
        const externalAssisterName =
          assister?.externalPlayerName ||
          (entryMode === 'quick' && quickAssisterNumber
            ? `#${quickAssisterNumber}`
            : null);
        const externalAssisterNumber =
          assister?.externalPlayerNumber ||
          (entryMode === 'quick' ? quickAssisterNumber || null : null);

        await recordGoal({
          variables: {
            input: {
              gameTeamId,
              gameMinute: defaultGameMinute,
              gameSecond: defaultGameSecond,
              scorerId: scorer?.playerId || undefined,
              externalScorerName: externalScorerName || undefined,
              externalScorerNumber: externalScorerNumber || undefined,
              assisterId: assister?.playerId || undefined,
              externalAssisterName: externalAssisterName || undefined,
              externalAssisterNumber: externalAssisterNumber || undefined,
            },
          },
          // Optimistic response provides instant feedback before server responds
          optimisticResponse: {
            __typename: 'Mutation',
            recordGoal: {
              __typename: 'GameEvent',
              id: optimisticId,
              gameMinute: defaultGameMinute,
              gameSecond: defaultGameSecond,
              playerId: scorer?.playerId || null,
              externalPlayerName: externalScorerName,
              externalPlayerNumber: externalScorerNumber,
              eventType: {
                __typename: 'EventType',
                id: 'optimistic-goal-type',
                name: 'GOAL',
              },
              childEvents: assister
                ? [
                    {
                      __typename: 'GameEvent',
                      id: `${optimisticId}-assist`,
                      playerId: assister.playerId || null,
                      externalPlayerName: externalAssisterName,
                      externalPlayerNumber: externalAssisterNumber,
                      eventType: {
                        __typename: 'EventType',
                        id: 'optimistic-assist-type',
                        name: 'ASSIST',
                      },
                    },
                  ]
                : [],
            },
          },
          // Update cache to add the goal event to the GameTeam's gameEvents
          update: (cache, { data }) => {
            if (!data?.recordGoal) return;

            const newEvent = data.recordGoal;

            // Add the event to the GameTeam's gameEvents array
            cache.modify({
              id: cache.identify({
                __typename: 'GameTeam',
                id: gameTeamId,
              }),
              fields: {
                gameEvents(existingEvents = [], { readField }) {
                  // Check if event already exists (prevents duplicates with subscription)
                  const eventExists = existingEvents.some(
                    (ref: { __ref: string }) =>
                      readField('id', ref) === newEvent.id
                  );
                  if (eventExists) return existingEvents;

                  // Create a cache reference for the new event
                  const newEventRef = cache.writeFragment({
                    data: {
                      __typename: 'GameEvent',
                      id: newEvent.id,
                      gameMinute: newEvent.gameMinute,
                      gameSecond: newEvent.gameSecond,
                      playerId: newEvent.playerId,
                      externalPlayerName: newEvent.externalPlayerName,
                      externalPlayerNumber: newEvent.externalPlayerNumber,
                      position: null,
                      eventType: {
                        ...newEvent.eventType,
                        category: 'SCORING', // Add category for cache consistency
                      },
                    },
                    fragment: GameEventFragment,
                  });

                  return [...existingEvents, newEventRef];
                },
              },
            });
          },
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'record'} goal:`, err);
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    }
  };

  // Handle clearing assist when user removes selection
  useEffect(() => {
    if (isEditMode && editGoal?.assist && !assisterId && !quickAssisterNumber) {
      setClearAssist(true);
    } else {
      setClearAssist(false);
    }
  }, [isEditMode, editGoal?.assist, assisterId, quickAssisterNumber]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: teamColor, color: '#fff' }}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'Edit Goal' : 'Record Goal'}
            </h3>
            <p className="text-sm text-gray-500">
              {teamName} &bull;{' '}
              {String(isEditMode ? editMinute : defaultGameMinute).padStart(
                2,
                '0'
              )}
              :
              {String(isEditMode ? editSecond : defaultGameSecond).padStart(
                2,
                '0'
              )}
            </p>
          </div>
        </div>

        {/* Time Edit (only in edit mode) */}
        {isEditMode && (
          <div className="mb-4 flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Time:</label>
            <input
              type="number"
              min="0"
              max="999"
              value={editMinute}
              onChange={(e) =>
                setEditMinute(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="w-16 rounded-lg border border-gray-300 p-2 text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={editSecond}
              onChange={(e) =>
                setEditSecond(
                  Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                )
              }
              className="w-16 rounded-lg border border-gray-300 p-2 text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Entry Mode Toggle - only show if lineup players exist and scorer field is shown */}
        {showScorerField && hasLineupPlayers && (
          <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setEntryMode('lineup')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                entryMode === 'lineup'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              From Lineup
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('quick')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                entryMode === 'quick'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quick Entry
            </button>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Goals Only Mode - just show confirmation message */}
          {!showScorerField && (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-600">
              Recording goal at{' '}
              {String(isEditMode ? editMinute : defaultGameMinute).padStart(
                2,
                '0'
              )}
              :
              {String(isEditMode ? editSecond : defaultGameSecond).padStart(
                2,
                '0'
              )}
              <p className="mt-1 text-xs text-gray-500">
                Player tracking is disabled for this game
              </p>
            </div>
          )}

          {showScorerField && entryMode === 'lineup' ? (
            <>
              {/* Scorer - Lineup Mode */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Who scored?{' '}
                  {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={scorerId}
                  onChange={(e) => {
                    setScorerId(e.target.value);
                    // Clear assist if same player was selected
                    if (e.target.value === assisterId) {
                      setAssisterId('');
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select player...</option>
                  {availablePlayers.map((player) => {
                    const id =
                      player.playerId || player.externalPlayerName || '';
                    const jersey = getJerseyNumber(player);
                    const name = getPlayerDisplayName(player);
                    const isBench = !player.isOnField;
                    return (
                      <option key={id} value={id}>
                        {jersey ? `${jersey} ` : ''}
                        {name}
                        {isBench ? ' (bench)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Assist - Lineup Mode (only if showAssisterField) */}
              {showAssisterField && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Who assisted? (optional)
                  </label>
                  <select
                    value={assisterId}
                    onChange={(e) => setAssisterId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No assist / Select player...</option>
                    {assistOptions.map((player) => {
                      const id =
                        player.playerId || player.externalPlayerName || '';
                      const jersey = getJerseyNumber(player);
                      const name = getPlayerDisplayName(player);
                      const isBench = !player.isOnField;
                      return (
                        <option key={id} value={id}>
                          {jersey ? `${jersey} ` : ''}
                          {name}
                          {isBench ? ' (bench)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Show bench toggle - only when not in edit mode */}
              {!isEditMode && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showBench"
                    checked={showBench}
                    onChange={(e) => setShowBench(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showBench" className="text-sm text-gray-600">
                    Show bench players
                  </label>
                </div>
              )}
            </>
          ) : showScorerField ? (
            <>
              {/* Quick Entry Mode */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Scorer jersey number (optional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quickScorerNumber}
                  onChange={(e) =>
                    setQuickScorerNumber(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="e.g. 10"
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank to record goal without player info
                </p>
              </div>

              {showAssisterField && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Assister jersey number (optional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quickAssisterNumber}
                    onChange={(e) =>
                      setQuickAssisterNumber(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="e.g. 7"
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-700 sm:p-5 sm:text-sm md:p-6">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              (!isEditMode &&
                showScorerField &&
                entryMode === 'lineup' &&
                !scorerId) ||
              loading
            }
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading
              ? isEditMode
                ? 'Saving...'
                : 'Recording...'
              : isEditMode
              ? 'Save Changes'
              : 'Record Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

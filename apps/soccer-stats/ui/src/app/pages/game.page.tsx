import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router';
import { useQuery, useMutation } from '@apollo/client/react';

import {
  GET_GAME_BY_ID,
  UPDATE_GAME,
  GET_GAME_LINEUP,
  DELETE_GOAL,
  GET_PLAYER_STATS,
} from '../services/games-graphql.service';
import { GameStatus } from '../generated/graphql';
import { GameLineupTab } from '../components/smart/game-lineup-tab.smart';
import { GoalModal, EditGoalData } from '../components/smart/goal-modal.smart';
import { SubstitutionModal } from '../components/smart/substitution-modal.smart';
import { GameStats } from '../components/smart/game-stats.smart';

/**
 * Game page - displays a single game with lineup, stats, and event tracking
 */
type TabType = 'lineup' | 'stats' | 'events';

/**
 * Format elapsed seconds to MM:SS display
 */
function formatGameTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Compute score from GOAL events for a team
 */
function computeScore(
  gameEvents: Array<{ eventType?: { name?: string } | null }> | null | undefined
): number {
  if (!gameEvents) return 0;
  return gameEvents.filter((event) => event.eventType?.name === 'GOAL').length;
}

export const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('lineup');
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  const [goalModalTeam, setGoalModalTeam] = useState<'home' | 'away' | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editGoalData, setEditGoalData] = useState<{
    team: 'home' | 'away';
    goal: EditGoalData;
  } | null>(null);
  const [subModalTeam, setSubModalTeam] = useState<'home' | 'away' | null>(
    null
  );
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [clearEventsOnReset, setClearEventsOnReset] = useState(false);

  // Use ref to track timer base time without causing effect re-runs
  const timerBaseRef = useRef<{
    startTime: number;
    baseElapsed: number;
  } | null>(null);

  const { data, loading, error } = useQuery(GET_GAME_BY_ID, {
    variables: { id: gameId! },
    skip: !gameId,
  });

  const [updateGame, { loading: updatingGame }] = useMutation(UPDATE_GAME, {
    refetchQueries: [{ query: GET_GAME_BY_ID, variables: { id: gameId } }],
  });

  const [deleteGoal, { loading: deletingGoal }] = useMutation(DELETE_GOAL, {
    refetchQueries: () => {
      const queries: Array<{
        query: typeof GET_GAME_BY_ID | typeof GET_PLAYER_STATS;
        variables: object;
      }> = [{ query: GET_GAME_BY_ID, variables: { id: gameId } }];
      // Refetch stats for both teams since we don't know which team the goal belonged to
      const game = data?.game;
      const homeTeam = game?.gameTeams?.find((gt) => gt.teamType === 'home');
      const awayTeam = game?.gameTeams?.find((gt) => gt.teamType === 'away');
      if (homeTeam) {
        queries.push({
          query: GET_PLAYER_STATS,
          variables: { input: { teamId: homeTeam.team.id, gameId } },
        });
      }
      if (awayTeam) {
        queries.push({
          query: GET_PLAYER_STATS,
          variables: { input: { teamId: awayTeam.team.id, gameId } },
        });
      }
      return queries;
    },
  });

  // Get home and away team IDs for lineup queries
  const homeTeamId = data?.game?.gameTeams?.find(
    (gt) => gt.teamType === 'home'
  )?.id;
  const awayTeamId = data?.game?.gameTeams?.find(
    (gt) => gt.teamType === 'away'
  )?.id;

  // Fetch lineup data for goal modal (only when needed)
  const { data: homeLineupData } = useQuery(GET_GAME_LINEUP, {
    variables: { gameTeamId: homeTeamId! },
    skip: !homeTeamId,
  });

  const { data: awayLineupData } = useQuery(GET_GAME_LINEUP, {
    variables: { gameTeamId: awayTeamId! },
    skip: !awayTeamId,
  });

  // Start first half
  const handleStartFirstHalf = async () => {
    try {
      await updateGame({
        variables: {
          id: gameId!,
          updateGameInput: {
            status: GameStatus.FirstHalf,
            actualStart: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      console.error('Failed to start first half:', err);
    }
  };

  // End first half and go to halftime
  const handleEndFirstHalf = async () => {
    try {
      await updateGame({
        variables: {
          id: gameId!,
          updateGameInput: {
            status: GameStatus.Halftime,
            firstHalfEnd: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      console.error('Failed to end first half:', err);
    }
  };

  // Start second half
  const handleStartSecondHalf = async () => {
    try {
      await updateGame({
        variables: {
          id: gameId!,
          updateGameInput: {
            status: GameStatus.SecondHalf,
            secondHalfStart: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      console.error('Failed to start second half:', err);
    }
  };

  // End game
  const handleEndGame = async () => {
    try {
      await updateGame({
        variables: {
          id: gameId!,
          updateGameInput: {
            status: GameStatus.Completed,
            actualEnd: new Date().toISOString(),
          },
        },
      });
      setShowEndGameConfirm(false);
    } catch (err) {
      console.error('Failed to end game:', err);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (gameEventId: string) => {
    try {
      await deleteGoal({
        variables: { gameEventId },
      });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  // Pause/Resume game clock
  const handleTogglePause = async () => {
    const game = data?.game;
    if (!game) return;

    try {
      if (game.pausedAt) {
        // Resume: clear pausedAt and adjust start times
        await updateGame({
          variables: {
            id: gameId!,
            updateGameInput: {
              pausedAt: null,
            },
          },
        });
      } else {
        // Pause: set pausedAt to now
        await updateGame({
          variables: {
            id: gameId!,
            updateGameInput: {
              pausedAt: new Date().toISOString(),
            },
          },
        });
      }
      setShowGameMenu(false);
    } catch (err) {
      console.error('Failed to toggle pause:', err);
    }
  };

  // Reset game to scheduled state
  const handleResetGame = async () => {
    try {
      await updateGame({
        variables: {
          id: gameId!,
          updateGameInput: {
            resetGame: true,
            clearEvents: clearEventsOnReset,
          },
        },
      });
      setShowResetConfirm(false);
      setShowGameMenu(false);
      setClearEventsOnReset(false);
      setElapsedSeconds(0);
      timerBaseRef.current = null;
    } catch (err) {
      console.error('Failed to reset game:', err);
    }
  };

  // Track which half the timer was initialized for
  const timerHalfRef = useRef<'first' | 'second' | null>(null);

  // Game clock effect - runs during first or second half
  useEffect(() => {
    const game = data?.game;
    // Treat legacy IN_PROGRESS as FIRST_HALF
    const isFirstHalf =
      game?.status === GameStatus.FirstHalf ||
      game?.status === GameStatus.InProgress;
    const isSecondHalf = game?.status === GameStatus.SecondHalf;

    if (!game || (!isFirstHalf && !isSecondHalf)) {
      // Reset timer tracking when not in play
      timerHalfRef.current = null;
      return;
    }

    // Calculate half duration in seconds
    const halfDurationSeconds =
      ((game.gameFormat?.durationMinutes || 60) / 2) * 60;

    // Determine which half we should be tracking
    const currentHalf = isFirstHalf ? 'first' : 'second';

    // Reinitialize if we're in a different half than before
    if (timerHalfRef.current !== currentHalf) {
      timerHalfRef.current = currentHalf;

      if (isFirstHalf) {
        // First half starts at 0:00
        const halfStartTime = game.actualStart
          ? new Date(game.actualStart).getTime()
          : Date.now();
        const initialElapsed = Math.floor((Date.now() - halfStartTime) / 1000);
        timerBaseRef.current = {
          startTime: Date.now(),
          baseElapsed: initialElapsed,
        };
      } else {
        // Second half starts at half duration (e.g., 30:00 for 60-min game)
        const halfStartTime = game.secondHalfStart
          ? new Date(game.secondHalfStart).getTime()
          : Date.now();
        const secondsIntoSecondHalf = Math.floor(
          (Date.now() - halfStartTime) / 1000
        );
        timerBaseRef.current = {
          startTime: Date.now(),
          baseElapsed: halfDurationSeconds + secondsIntoSecondHalf,
        };
      }
    }

    // Ensure we have a valid timer base
    if (!timerBaseRef.current) {
      return;
    }

    // If game is paused, calculate elapsed time up to pause point and don't start interval
    if (game.pausedAt) {
      const pausedAtTime = new Date(game.pausedAt).getTime();
      const { startTime, baseElapsed } = timerBaseRef.current;
      const additionalSeconds = Math.floor((pausedAtTime - startTime) / 1000);
      setElapsedSeconds(Math.max(0, baseElapsed + additionalSeconds));
      return; // Don't start the interval - clock is frozen
    }

    const { startTime, baseElapsed } = timerBaseRef.current;

    const updateClock = () => {
      const now = Date.now();
      const additionalSeconds = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(baseElapsed + additionalSeconds);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [
    data?.game?.status,
    data?.game?.actualStart,
    data?.game?.secondHalfStart,
    data?.game?.gameFormat?.durationMinutes,
    data?.game?.pausedAt,
  ]);

  // Reset clock state when game status changes to scheduled
  useEffect(() => {
    const game = data?.game;
    if (game?.status === GameStatus.Scheduled) {
      setElapsedSeconds(0);
      timerBaseRef.current = null;
    }
  }, [data?.game?.status]);

  if (!gameId) {
    return <Navigate to="/games" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-xl font-bold text-red-900">
          Error loading game
        </h2>
        <p className="text-red-700">{error.message}</p>
      </div>
    );
  }

  if (!data?.game) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <h2 className="mb-2 text-xl font-bold text-yellow-900">
          Game not found
        </h2>
        <p className="text-yellow-700">
          The requested game could not be found.
        </p>
      </div>
    );
  }

  const { game } = data;
  const homeTeam = game.gameTeams?.find((gt) => gt.teamType === 'home');
  const awayTeam = game.gameTeams?.find((gt) => gt.teamType === 'away');

  // Check if game is in active play (goals can be recorded)
  const isActivePlay =
    game.status === GameStatus.FirstHalf ||
    game.status === GameStatus.SecondHalf ||
    game.status === GameStatus.InProgress;

  // Get current game time in minutes and seconds for goal recording
  const gameMinute = Math.floor(elapsedSeconds / 60);
  const gameSecond = elapsedSeconds % 60;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Game Header */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {game.name || 'Game Details'}
            </h1>
            {/* Status Badge */}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                game.status === GameStatus.Scheduled
                  ? 'bg-gray-100 text-gray-800'
                  : game.status === GameStatus.FirstHalf ||
                    game.status === GameStatus.SecondHalf ||
                    game.status === GameStatus.InProgress
                  ? 'bg-green-100 text-green-800'
                  : game.status === GameStatus.Halftime
                  ? 'bg-yellow-100 text-yellow-800'
                  : game.status === GameStatus.Completed
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {(game.status === GameStatus.FirstHalf ||
                game.status === GameStatus.SecondHalf ||
                game.status === GameStatus.InProgress) && (
                <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-green-500" />
              )}
              {game.status === GameStatus.FirstHalf ||
              game.status === GameStatus.InProgress
                ? '1ST HALF'
                : game.status === GameStatus.SecondHalf
                ? '2ND HALF'
                : game.status === GameStatus.Halftime
                ? 'HALF TIME'
                : game.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {game.gameFormat.name} ({game.gameFormat.durationMinutes} min)
            </div>
            {/* Three-dot menu */}
            <div className="relative">
              <button
                onClick={() => setShowGameMenu(!showGameMenu)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                type="button"
                title="Game options"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showGameMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowGameMenu(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {/* Pause/Resume - only during active play */}
                    {(game.status === GameStatus.FirstHalf ||
                      game.status === GameStatus.SecondHalf ||
                      game.status === GameStatus.InProgress) && (
                      <button
                        onClick={handleTogglePause}
                        disabled={updatingGame}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        type="button"
                      >
                        {game.pausedAt ? (
                          <>
                            <svg
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Resume Clock
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Pause Clock
                          </>
                        )}
                      </button>
                    )}

                    {/* Reset Game */}
                    {!showResetConfirm ? (
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        type="button"
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Reset Game
                      </button>
                    ) : (
                      <div className="space-y-2 px-4 py-2">
                        <p className="text-xs font-medium text-red-600">
                          Reset to scheduled?
                        </p>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={clearEventsOnReset}
                            onChange={(e) =>
                              setClearEventsOnReset(e.target.checked)
                            }
                            className="h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-xs text-gray-600">
                            Also clear all events
                          </span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={handleResetGame}
                            disabled={updatingGame}
                            className="flex-1 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            type="button"
                          >
                            {updatingGame ? '...' : 'Reset'}
                          </button>
                          <button
                            onClick={() => {
                              setShowResetConfirm(false);
                              setClearEventsOnReset(false);
                            }}
                            className="flex-1 rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Game Clock and Controls - Centered */}
        {game.status === GameStatus.Scheduled && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={handleStartFirstHalf}
              disabled={updatingGame}
              className="inline-flex items-center rounded-xl bg-green-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {updatingGame ? (
                <>
                  <span className="border-3 mr-3 h-6 w-6 animate-spin rounded-full border-white border-t-transparent" />
                  Starting...
                </>
              ) : (
                <>
                  <svg
                    className="mr-3 h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Start 1st Half
                </>
              )}
            </button>
          </div>
        )}

        {/* First Half - Clock + Half Time button (also handles legacy IN_PROGRESS) */}
        {(game.status === GameStatus.FirstHalf ||
          game.status === GameStatus.InProgress) && (
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              1st Half
            </div>
            <div
              className={`font-mono text-6xl font-bold tabular-nums ${
                game.pausedAt ? 'text-yellow-600' : 'text-gray-900'
              }`}
            >
              {formatGameTime(elapsedSeconds)}
            </div>
            {game.pausedAt && (
              <div className="flex animate-pulse items-center gap-2 text-sm font-medium text-yellow-600">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                PAUSED
              </div>
            )}
            <button
              onClick={handleEndFirstHalf}
              disabled={updatingGame}
              className="inline-flex items-center rounded-lg bg-yellow-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {updatingGame ? 'Ending half...' : 'Half Time'}
            </button>
          </div>
        )}

        {/* Halftime - Start 2nd Half button */}
        {game.status === GameStatus.Halftime && (
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="font-mono text-4xl font-bold text-yellow-600">
              HALF TIME
            </div>
            <div className="text-sm text-gray-500">
              1st half ended at{' '}
              {formatGameTime(
                game.firstHalfEnd && game.actualStart
                  ? Math.floor(
                      (new Date(game.firstHalfEnd).getTime() -
                        new Date(game.actualStart).getTime()) /
                        1000
                    )
                  : (game.gameFormat.durationMinutes / 2) * 60
              )}
            </div>
            <button
              onClick={handleStartSecondHalf}
              disabled={updatingGame}
              className="inline-flex items-center rounded-xl bg-green-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {updatingGame ? (
                <>
                  <span className="border-3 mr-3 h-6 w-6 animate-spin rounded-full border-white border-t-transparent" />
                  Starting...
                </>
              ) : (
                <>
                  <svg
                    className="mr-3 h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Start 2nd Half
                </>
              )}
            </button>
          </div>
        )}

        {/* Second Half - Clock + End Game button */}
        {game.status === GameStatus.SecondHalf && (
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              2nd Half
            </div>
            <div
              className={`font-mono text-6xl font-bold tabular-nums ${
                game.pausedAt ? 'text-yellow-600' : 'text-gray-900'
              }`}
            >
              {formatGameTime(elapsedSeconds)}
            </div>
            {game.pausedAt && (
              <div className="flex animate-pulse items-center gap-2 text-sm font-medium text-yellow-600">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                PAUSED
              </div>
            )}
            <div className="flex items-center gap-3">
              {!showEndGameConfirm ? (
                <button
                  onClick={() => setShowEndGameConfirm(true)}
                  className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  type="button"
                >
                  <svg
                    className="mr-1.5 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  End Game
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
                  <span className="text-sm font-medium text-red-700">
                    End game?
                  </span>
                  <button
                    onClick={handleEndGame}
                    disabled={updatingGame}
                    className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    type="button"
                  >
                    {updatingGame ? 'Ending...' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setShowEndGameConfirm(false)}
                    className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
                    type="button"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completed - Final score display */}
        {game.status === GameStatus.Completed && (
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="font-mono text-4xl font-bold text-gray-400">
              FINAL
            </div>
            {game.actualEnd && game.secondHalfStart && (
              <div className="text-sm text-gray-500">
                Duration:{' '}
                {formatGameTime(
                  Math.floor(
                    (new Date(game.actualEnd).getTime() -
                      new Date(game.actualStart).getTime()) /
                      1000
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Score Display */}
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Home Team */}
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">
              {homeTeam?.team.name || 'Home Team'}
            </div>
            <div className="mt-2 text-5xl font-bold text-blue-600">
              {computeScore(homeTeam?.gameEvents)}
            </div>
            {isActivePlay && (
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => setGoalModalTeam('home')}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
                  type="button"
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Goal
                </button>
                <button
                  onClick={() => setSubModalTeam('home')}
                  className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  type="button"
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
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Sub
                </button>
              </div>
            )}
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">VS</div>
          </div>

          {/* Away Team */}
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">
              {awayTeam?.team.name || 'Away Team'}
            </div>
            <div className="mt-2 text-5xl font-bold text-red-600">
              {computeScore(awayTeam?.gameEvents)}
            </div>
            {isActivePlay && (
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => setGoalModalTeam('away')}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                  type="button"
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Goal
                </button>
                <button
                  onClick={() => setSubModalTeam('away')}
                  className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  type="button"
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
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Sub
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Game Info */}
        {(game.venue || game.scheduledStart) && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {game.venue && (
                <div>
                  <span className="text-gray-600">Venue:</span>{' '}
                  <span className="font-medium text-gray-900">
                    {game.venue}
                  </span>
                </div>
              )}
              {game.scheduledStart && (
                <div>
                  <span className="text-gray-600">Date:</span>{' '}
                  <span className="font-medium text-gray-900">
                    {new Date(game.scheduledStart).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className="rounded-lg bg-white shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {(['lineup', 'stats', 'events'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
                type="button"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {/* Lineup Tab */}
          {activeTab === 'lineup' && (
            <div className="space-y-4">
              {/* Team Selector */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setActiveTeam('home')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTeam === 'home'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  {homeTeam?.team.name || 'Home'}
                </button>
                <button
                  onClick={() => setActiveTeam('away')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTeam === 'away'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  {awayTeam?.team.name || 'Away'}
                </button>
              </div>

              {/* Lineup Content */}
              {activeTeam === 'home' && homeTeam && (
                <GameLineupTab
                  gameTeamId={homeTeam.id}
                  gameId={gameId}
                  teamId={homeTeam.team.id}
                  teamName={homeTeam.team.name}
                  teamColor={homeTeam.team.homePrimaryColor || '#3B82F6'}
                  isManaged={homeTeam.team.isManaged}
                  playersPerTeam={game.gameFormat.playersPerTeam}
                />
              )}
              {activeTeam === 'away' && awayTeam && (
                <GameLineupTab
                  gameTeamId={awayTeam.id}
                  gameId={gameId}
                  teamId={awayTeam.team.id}
                  teamName={awayTeam.team.name}
                  teamColor={awayTeam.team.homePrimaryColor || '#EF4444'}
                  isManaged={awayTeam.team.isManaged}
                  playersPerTeam={game.gameFormat.playersPerTeam}
                />
              )}
            </div>
          )}

          {/* Stats Tab - Playing Time */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* Team Selector */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setActiveTeam('home')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTeam === 'home'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  {homeTeam?.team.name || 'Home'}
                </button>
                <button
                  onClick={() => setActiveTeam('away')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTeam === 'away'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  {awayTeam?.team.name || 'Away'}
                </button>
              </div>

              {/* Stats Content - Now using GameStats component */}
              {activeTeam === 'home' && homeTeam && (
                <GameStats
                  gameId={gameId!}
                  teamId={homeTeam.team.id}
                  teamName={homeTeam.team.name}
                  teamColor={homeTeam.team.homePrimaryColor || '#3B82F6'}
                />
              )}
              {activeTeam === 'away' && awayTeam && (
                <GameStats
                  gameId={gameId!}
                  teamId={awayTeam.team.id}
                  teamName={awayTeam.team.name}
                  teamColor={awayTeam.team.homePrimaryColor || '#EF4444'}
                />
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Match Events
              </h3>
              {(() => {
                // Define event types for the timeline
                type MatchEvent = {
                  id: string;
                  eventType: 'goal' | 'substitution' | 'position_swap';
                  gameMinute: number;
                  gameSecond: number;
                  teamType: string;
                  teamName: string;
                  teamColor: string;
                  // Goal-specific
                  playerId?: string | null;
                  externalPlayerName?: string | null;
                  externalPlayerNumber?: string | null;
                  assist?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                  } | null;
                  // Substitution-specific
                  playerOut?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                    externalPlayerNumber?: string | null;
                  };
                  playerIn?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                    externalPlayerNumber?: string | null;
                  };
                  // Position swap-specific
                  swapPlayer1?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                    externalPlayerNumber?: string | null;
                    position?: string | null;
                  };
                  swapPlayer2?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                    externalPlayerNumber?: string | null;
                    position?: string | null;
                  };
                };

                const matchEvents: MatchEvent[] = [];

                // Helper to process events for a team
                const processTeamEvents = (
                  gameTeam: typeof homeTeam,
                  teamType: 'home' | 'away',
                  defaultColor: string
                ) => {
                  if (!gameTeam?.gameEvents) return;

                  // Track SUB_IN events we've already paired
                  const processedSubIns = new Set<string>();
                  // Track POSITION_SWAP events we've already paired
                  const processedSwaps = new Set<string>();

                  gameTeam.gameEvents.forEach((event) => {
                    // Process GOAL events
                    if (event.eventType?.name === 'GOAL') {
                      const assistEvent = gameTeam.gameEvents?.find(
                        (e) =>
                          e.eventType?.name === 'ASSIST' &&
                          e.gameMinute === event.gameMinute &&
                          e.gameSecond === event.gameSecond
                      );
                      matchEvents.push({
                        id: event.id,
                        eventType: 'goal',
                        gameMinute: event.gameMinute,
                        gameSecond: event.gameSecond,
                        teamType,
                        teamName: gameTeam.team.name,
                        teamColor:
                          gameTeam.team.homePrimaryColor || defaultColor,
                        playerId: event.playerId,
                        externalPlayerName: event.externalPlayerName,
                        externalPlayerNumber: event.externalPlayerNumber,
                        assist: assistEvent
                          ? {
                              playerId: assistEvent.playerId,
                              externalPlayerName:
                                assistEvent.externalPlayerName,
                            }
                          : null,
                      });
                    }

                    // Process SUBSTITUTION_OUT events (pair with SUBSTITUTION_IN at same time)
                    if (event.eventType?.name === 'SUBSTITUTION_OUT') {
                      // Find matching SUBSTITUTION_IN at same time
                      const subInEvent = gameTeam.gameEvents?.find(
                        (e) =>
                          e.eventType?.name === 'SUBSTITUTION_IN' &&
                          e.gameMinute === event.gameMinute &&
                          e.gameSecond === event.gameSecond &&
                          !processedSubIns.has(e.id)
                      );

                      if (subInEvent) {
                        processedSubIns.add(subInEvent.id);
                      }

                      matchEvents.push({
                        id: event.id,
                        eventType: 'substitution',
                        gameMinute: event.gameMinute,
                        gameSecond: event.gameSecond,
                        teamType,
                        teamName: gameTeam.team.name,
                        teamColor:
                          gameTeam.team.homePrimaryColor || defaultColor,
                        playerOut: {
                          playerId: event.playerId,
                          externalPlayerName: event.externalPlayerName,
                          externalPlayerNumber: event.externalPlayerNumber,
                        },
                        playerIn: subInEvent
                          ? {
                              playerId: subInEvent.playerId,
                              externalPlayerName: subInEvent.externalPlayerName,
                              externalPlayerNumber:
                                subInEvent.externalPlayerNumber,
                            }
                          : undefined,
                      });
                    }

                    // Process POSITION_SWAP events (pair two swaps at same time)
                    if (
                      event.eventType?.name === 'POSITION_SWAP' &&
                      !processedSwaps.has(event.id)
                    ) {
                      // Find the paired swap event at the same time
                      const pairedSwap = gameTeam.gameEvents?.find(
                        (e) =>
                          e.eventType?.name === 'POSITION_SWAP' &&
                          e.id !== event.id &&
                          e.gameMinute === event.gameMinute &&
                          e.gameSecond === event.gameSecond &&
                          !processedSwaps.has(e.id)
                      );

                      // Mark both as processed
                      processedSwaps.add(event.id);
                      if (pairedSwap) {
                        processedSwaps.add(pairedSwap.id);
                      }

                      matchEvents.push({
                        id: event.id,
                        eventType: 'position_swap',
                        gameMinute: event.gameMinute,
                        gameSecond: event.gameSecond,
                        teamType,
                        teamName: gameTeam.team.name,
                        teamColor:
                          gameTeam.team.homePrimaryColor || defaultColor,
                        swapPlayer1: {
                          playerId: event.playerId,
                          externalPlayerName: event.externalPlayerName,
                          externalPlayerNumber: event.externalPlayerNumber,
                          position: event.position,
                        },
                        swapPlayer2: pairedSwap
                          ? {
                              playerId: pairedSwap.playerId,
                              externalPlayerName: pairedSwap.externalPlayerName,
                              externalPlayerNumber:
                                pairedSwap.externalPlayerNumber,
                              position: pairedSwap.position,
                            }
                          : undefined,
                      });
                    }
                  });
                };

                // Process both teams
                processTeamEvents(homeTeam, 'home', '#3B82F6');
                processTeamEvents(awayTeam, 'away', '#EF4444');

                // Sort by game time
                matchEvents.sort((a, b) => {
                  if (a.gameMinute !== b.gameMinute)
                    return a.gameMinute - b.gameMinute;
                  return a.gameSecond - b.gameSecond;
                });

                // Helper to find player name from team roster
                const getPlayerName = (
                  playerId?: string | null,
                  externalName?: string | null,
                  externalNumber?: string | null,
                  team?: typeof homeTeam
                ) => {
                  if (externalName) return externalName;
                  if (externalNumber) return `#${externalNumber}`;
                  if (!playerId || !team?.team.teamPlayers) return 'Unknown';
                  const player = team.team.teamPlayers.find(
                    (tp) => tp.userId === playerId
                  );
                  if (player?.user) {
                    return (
                      `${player.user.firstName || ''} ${
                        player.user.lastName || ''
                      }`.trim() || player.user.email
                    );
                  }
                  return 'Unknown';
                };

                if (matchEvents.length === 0) {
                  return (
                    <div className="py-8 text-center text-gray-500">
                      <p>No events recorded yet</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {matchEvents.map((event) => {
                      const team =
                        event.teamType === 'home' ? homeTeam : awayTeam;

                      if (event.eventType === 'goal') {
                        const scorerName = getPlayerName(
                          event.playerId,
                          event.externalPlayerName,
                          event.externalPlayerNumber,
                          team
                        );
                        const assisterName = event.assist
                          ? getPlayerName(
                              event.assist.playerId,
                              event.assist.externalPlayerName,
                              null,
                              team
                            )
                          : null;

                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
                          >
                            {/* Time */}
                            <div className="w-16 font-mono text-lg font-semibold text-gray-700">
                              {String(event.gameMinute).padStart(2, '0')}:
                              {String(event.gameSecond).padStart(2, '0')}
                            </div>

                            {/* Goal icon */}
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-full"
                              style={{ backgroundColor: event.teamColor }}
                            >
                              <svg
                                className="h-5 w-5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <circle cx="10" cy="10" r="8" />
                              </svg>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                Goal - {event.teamName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {scorerName}
                                {assisterName && (
                                  <span className="text-gray-400">
                                    {' '}
                                    (assist: {assisterName})
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Edit and Delete buttons */}
                            <div className="flex items-center gap-1">
                              {deleteConfirmId === event.id ? (
                                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                                  <span className="text-xs text-red-700">
                                    Delete?
                                  </span>
                                  <button
                                    onClick={() => handleDeleteGoal(event.id)}
                                    disabled={deletingGoal}
                                    className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                    type="button"
                                  >
                                    {deletingGoal ? '...' : 'Yes'}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300"
                                    type="button"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {/* Edit button */}
                                  <button
                                    onClick={() =>
                                      setEditGoalData({
                                        team: event.teamType as 'home' | 'away',
                                        goal: {
                                          id: event.id,
                                          gameMinute: event.gameMinute,
                                          gameSecond: event.gameSecond,
                                          playerId: event.playerId,
                                          externalPlayerName:
                                            event.externalPlayerName,
                                          externalPlayerNumber:
                                            event.externalPlayerNumber,
                                          assist: event.assist
                                            ? {
                                                playerId: event.assist.playerId,
                                                externalPlayerName:
                                                  event.assist
                                                    .externalPlayerName,
                                              }
                                            : null,
                                        },
                                      })
                                    }
                                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                                    type="button"
                                    title="Edit goal"
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
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  {/* Delete button */}
                                  <button
                                    onClick={() => setDeleteConfirmId(event.id)}
                                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                    type="button"
                                    title="Delete goal"
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
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Position swap event
                      if (event.eventType === 'position_swap') {
                        const player1Name = event.swapPlayer1
                          ? getPlayerName(
                              event.swapPlayer1.playerId,
                              event.swapPlayer1.externalPlayerName,
                              event.swapPlayer1.externalPlayerNumber,
                              team
                            )
                          : 'Unknown';
                        const player2Name = event.swapPlayer2
                          ? getPlayerName(
                              event.swapPlayer2.playerId,
                              event.swapPlayer2.externalPlayerName,
                              event.swapPlayer2.externalPlayerNumber,
                              team
                            )
                          : 'Unknown';

                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
                          >
                            {/* Time */}
                            <div className="w-16 font-mono text-lg font-semibold text-gray-700">
                              {String(event.gameMinute).padStart(2, '0')}:
                              {String(event.gameSecond).padStart(2, '0')}
                            </div>

                            {/* Position swap icon */}
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
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
                                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                />
                              </svg>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                Position Swap - {event.teamName}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-medium">
                                    {player1Name}
                                  </span>
                                  {event.swapPlayer1?.position && (
                                    <span className="text-purple-600">
                                      → {event.swapPlayer1.position}
                                    </span>
                                  )}
                                </span>
                                <span className="text-gray-400">↔</span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-medium">
                                    {player2Name}
                                  </span>
                                  {event.swapPlayer2?.position && (
                                    <span className="text-purple-600">
                                      → {event.swapPlayer2.position}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Substitution event
                      const playerOutName = event.playerOut
                        ? getPlayerName(
                            event.playerOut.playerId,
                            event.playerOut.externalPlayerName,
                            event.playerOut.externalPlayerNumber,
                            team
                          )
                        : 'Unknown';
                      const playerInName = event.playerIn
                        ? getPlayerName(
                            event.playerIn.playerId,
                            event.playerIn.externalPlayerName,
                            event.playerIn.externalPlayerNumber,
                            team
                          )
                        : 'Unknown';

                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
                        >
                          {/* Time */}
                          <div className="w-16 font-mono text-lg font-semibold text-gray-700">
                            {String(event.gameMinute).padStart(2, '0')}:
                            {String(event.gameSecond).padStart(2, '0')}
                          </div>

                          {/* Substitution icon */}
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                            <svg
                              className="h-5 w-5 text-gray-600"
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

                          {/* Details */}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              Substitution - {event.teamName}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <svg
                                  className="h-3 w-3 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {playerInName}
                              </span>
                              <span className="text-gray-400">for</span>
                              <span className="inline-flex items-center gap-1">
                                <svg
                                  className="h-3 w-3 text-red-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {playerOutName}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Goal Modal - New Goal */}
      {goalModalTeam && (
        <GoalModal
          gameTeamId={goalModalTeam === 'home' ? homeTeam!.id : awayTeam!.id}
          gameId={gameId!}
          teamId={
            goalModalTeam === 'home' ? homeTeam!.team.id : awayTeam!.team.id
          }
          teamName={
            goalModalTeam === 'home' ? homeTeam!.team.name : awayTeam!.team.name
          }
          teamColor={
            goalModalTeam === 'home'
              ? homeTeam!.team.homePrimaryColor || '#3B82F6'
              : awayTeam!.team.homePrimaryColor || '#EF4444'
          }
          currentOnField={
            goalModalTeam === 'home'
              ? homeLineupData?.gameLineup?.currentOnField ?? []
              : awayLineupData?.gameLineup?.currentOnField ?? []
          }
          bench={
            goalModalTeam === 'home'
              ? homeLineupData?.gameLineup?.bench ?? []
              : awayLineupData?.gameLineup?.bench ?? []
          }
          gameMinute={gameMinute}
          gameSecond={gameSecond}
          onClose={() => setGoalModalTeam(null)}
        />
      )}

      {/* Goal Modal - Edit Goal */}
      {editGoalData && (
        <GoalModal
          gameTeamId={
            editGoalData.team === 'home' ? homeTeam!.id : awayTeam!.id
          }
          gameId={gameId!}
          teamId={
            editGoalData.team === 'home' ? homeTeam!.team.id : awayTeam!.team.id
          }
          teamName={
            editGoalData.team === 'home'
              ? homeTeam!.team.name
              : awayTeam!.team.name
          }
          teamColor={
            editGoalData.team === 'home'
              ? homeTeam!.team.homePrimaryColor || '#3B82F6'
              : awayTeam!.team.homePrimaryColor || '#EF4444'
          }
          currentOnField={
            editGoalData.team === 'home'
              ? homeLineupData?.gameLineup?.currentOnField ?? []
              : awayLineupData?.gameLineup?.currentOnField ?? []
          }
          bench={
            editGoalData.team === 'home'
              ? homeLineupData?.gameLineup?.bench ?? []
              : awayLineupData?.gameLineup?.bench ?? []
          }
          gameMinute={gameMinute}
          gameSecond={gameSecond}
          onClose={() => setEditGoalData(null)}
          editGoal={editGoalData.goal}
        />
      )}

      {/* Substitution Modal */}
      {subModalTeam && (
        <SubstitutionModal
          gameTeamId={subModalTeam === 'home' ? homeTeam!.id : awayTeam!.id}
          gameId={gameId!}
          teamName={
            subModalTeam === 'home' ? homeTeam!.team.name : awayTeam!.team.name
          }
          teamColor={
            subModalTeam === 'home'
              ? homeTeam!.team.homePrimaryColor || '#3B82F6'
              : awayTeam!.team.homePrimaryColor || '#EF4444'
          }
          currentOnField={
            subModalTeam === 'home'
              ? homeLineupData?.gameLineup?.currentOnField ?? []
              : awayLineupData?.gameLineup?.currentOnField ?? []
          }
          bench={
            subModalTeam === 'home'
              ? homeLineupData?.gameLineup?.bench ?? []
              : awayLineupData?.gameLineup?.bench ?? []
          }
          gameMinute={gameMinute}
          gameSecond={gameSecond}
          onClose={() => setSubModalTeam(null)}
        />
      )}
    </div>
  );
};

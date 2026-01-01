import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Navigate } from 'react-router';
import {
  useQuery,
  useMutation,
  useLazyQuery,
  useApolloClient,
} from '@apollo/client/react';
import { gql } from '@apollo/client';

import {
  GET_GAME_BY_ID,
  UPDATE_GAME,
  GET_GAME_LINEUP,
  DELETE_GOAL,
  DELETE_SUBSTITUTION,
  DELETE_POSITION_SWAP,
  DELETE_STARTER_ENTRY,
  GET_PLAYER_STATS,
  GET_DEPENDENT_EVENTS,
  DELETE_EVENT_WITH_CASCADE,
  RESOLVE_EVENT_CONFLICT,
  RECORD_GOAL,
} from '../services/games-graphql.service';
import { GameStatus, StatsTrackingLevel } from '../generated/graphql';
import { GameLineupTab } from '../components/smart/game-lineup-tab.smart';
import { GoalModal, EditGoalData } from '../components/smart/goal-modal.smart';
import { SubstitutionModal } from '../components/smart/substitution-modal.smart';
import { GameStats } from '../components/smart/game-stats.smart';
import {
  EventCard,
  EventType as EventCardType,
} from '../components/presentation/event-card.presentation';
import { CascadeDeleteModal } from '../components/presentation/cascade-delete-modal.presentation';
import { ConflictResolutionModal } from '../components/presentation/conflict-resolution-modal.presentation';
import { StatsTrackingSelector } from '../components/presentation/stats-tracking-selector.presentation';
import { useGameEventSubscription } from '../hooks/use-game-event-subscription';

// Fragment for writing GameEvent to cache
const GameEventFragmentDoc = gql`
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

  // Cascade delete state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    eventType: EventCardType;
  } | null>(null);
  const [cascadeModalData, setCascadeModalData] = useState<{
    dependentEvents: Array<{
      id: string;
      eventType: string;
      gameMinute: number;
      gameSecond: number;
      playerName?: string | null;
      description?: string | null;
    }>;
    warningMessage?: string | null;
  } | null>(null);

  // Conflict resolution state
  const [conflictData, setConflictData] = useState<{
    conflictId: string;
    eventType: string;
    gameMinute: number;
    gameSecond: number;
    conflictingEvents: Array<{
      eventId: string;
      playerName: string;
      playerId?: string | null;
      recordedByUserName: string;
    }>;
  } | null>(null);

  // Use ref to track timer base time without causing effect re-runs
  const timerBaseRef = useRef<{
    startTime: number;
    baseElapsed: number;
  } | null>(null);

  const apolloClient = useApolloClient();

  const {
    data,
    loading,
    error,
    refetch: refetchGame,
  } = useQuery(GET_GAME_BY_ID, {
    variables: { id: gameId! },
    skip: !gameId,
    // Prevent loading state from becoming true during cache updates or background refetches
    // Only show loading on initial fetch, not when cache is modified by subscriptions
    notifyOnNetworkStatusChange: false,
    fetchPolicy: 'cache-first',
  });

  // Debug: Log when loading spinner is displayed (for E2E testing)
  useEffect(() => {
    if (loading) {
      console.log(
        '[Game Page Loading Spinner] Displayed - loading state is true'
      );
    }
  }, [loading]);

  const [updateGame, { loading: updatingGame }] = useMutation(UPDATE_GAME, {
    refetchQueries: [{ query: GET_GAME_BY_ID, variables: { id: gameId } }],
  });

  // Direct goal recording for GOALS_ONLY mode (skips modal)
  // Note: We intentionally don't use refetchQueries here.
  // The real-time subscription handles adding new events to the cache
  // via apolloClient.cache.modify, preventing loading state flickers.
  const [recordGoalDirect, { loading: recordingGoal }] =
    useMutation(RECORD_GOAL);

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

  const [deleteSubstitution, { loading: deletingSubstitution }] = useMutation(
    DELETE_SUBSTITUTION,
    {
      refetchQueries: () => {
        const queries: Array<{
          query:
            | typeof GET_GAME_BY_ID
            | typeof GET_PLAYER_STATS
            | typeof GET_GAME_LINEUP;
          variables: object;
        }> = [{ query: GET_GAME_BY_ID, variables: { id: gameId } }];
        const game = data?.game;
        const homeTeam = game?.gameTeams?.find((gt) => gt.teamType === 'home');
        const awayTeam = game?.gameTeams?.find((gt) => gt.teamType === 'away');
        if (homeTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: homeTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_LINEUP,
            variables: { gameTeamId: homeTeam.id },
          });
        }
        if (awayTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: awayTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_LINEUP,
            variables: { gameTeamId: awayTeam.id },
          });
        }
        return queries;
      },
    }
  );

  const [deletePositionSwap, { loading: deletingPositionSwap }] = useMutation(
    DELETE_POSITION_SWAP,
    {
      refetchQueries: () => {
        const queries: Array<{
          query: typeof GET_GAME_BY_ID | typeof GET_GAME_LINEUP;
          variables: object;
        }> = [{ query: GET_GAME_BY_ID, variables: { id: gameId } }];
        const game = data?.game;
        const homeTeam = game?.gameTeams?.find((gt) => gt.teamType === 'home');
        const awayTeam = game?.gameTeams?.find((gt) => gt.teamType === 'away');
        if (homeTeam) {
          queries.push({
            query: GET_GAME_LINEUP,
            variables: { gameTeamId: homeTeam.id },
          });
        }
        if (awayTeam) {
          queries.push({
            query: GET_GAME_LINEUP,
            variables: { gameTeamId: awayTeam.id },
          });
        }
        return queries;
      },
    }
  );

  const [deleteStarterEntry, { loading: deletingStarterEntry }] = useMutation(
    DELETE_STARTER_ENTRY,
    {
      refetchQueries: () => {
        const queries: Array<{
          query:
            | typeof GET_GAME_BY_ID
            | typeof GET_PLAYER_STATS
            | typeof GET_GAME_LINEUP;
          variables: object;
        }> = [{ query: GET_GAME_BY_ID, variables: { id: gameId } }];
        const game = data?.game;
        const homeTeam = game?.gameTeams?.find((gt) => gt.teamType === 'home');
        const awayTeam = game?.gameTeams?.find((gt) => gt.teamType === 'away');
        if (homeTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: homeTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_LINEUP,
            variables: { gameTeamId: homeTeam.id },
          });
        }
        if (awayTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: awayTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_LINEUP,
            variables: { gameTeamId: awayTeam.id },
          });
        }
        return queries;
      },
    }
  );

  // Cascade delete queries and mutations
  const [checkDependentEvents, { loading: checkingDependents }] = useLazyQuery(
    GET_DEPENDENT_EVENTS,
    {
      fetchPolicy: 'network-only',
    }
  );

  const [deleteWithCascade, { loading: deletingWithCascade }] = useMutation(
    DELETE_EVENT_WITH_CASCADE,
    {
      refetchQueries: () => {
        const queries: Array<{
          query:
            | typeof GET_GAME_BY_ID
            | typeof GET_PLAYER_STATS
            | typeof GET_GAME_LINEUP;
          variables: object;
        }> = [{ query: GET_GAME_BY_ID, variables: { id: gameId } }];
        const game = data?.game;
        const homeTeam = game?.gameTeams?.find((gt) => gt.teamType === 'home');
        const awayTeam = game?.gameTeams?.find((gt) => gt.teamType === 'away');
        if (homeTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: homeTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_LINEUP,
            variables: { gameTeamId: homeTeam.id },
          });
        }
        if (awayTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: awayTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_LINEUP,
            variables: { gameTeamId: awayTeam.id },
          });
        }
        return queries;
      },
    }
  );

  const [resolveConflict, { loading: resolvingConflict }] = useMutation(
    RESOLVE_EVENT_CONFLICT,
    {
      refetchQueries: [{ query: GET_GAME_BY_ID, variables: { id: gameId } }],
    }
  );

  // Memoize team lookups to prevent unnecessary recalculations
  const homeTeamData = useMemo(
    () => data?.game?.gameTeams?.find((gt) => gt.teamType === 'home'),
    [data?.game?.gameTeams]
  );
  const awayTeamData = useMemo(
    () => data?.game?.gameTeams?.find((gt) => gt.teamType === 'away'),
    [data?.game?.gameTeams]
  );
  const homeTeamId = homeTeamData?.id;
  const awayTeamId = awayTeamData?.id;

  // Memoize scores to prevent recalculation on every render
  const homeScore = useMemo(
    () => computeScore(homeTeamData?.gameEvents),
    [homeTeamData?.gameEvents]
  );
  const awayScore = useMemo(
    () => computeScore(awayTeamData?.gameEvents),
    [awayTeamData?.gameEvents]
  );

  // Fetch lineup data for goal modal (only when needed)
  const { data: homeLineupData } = useQuery(GET_GAME_LINEUP, {
    variables: { gameTeamId: homeTeamId! },
    skip: !homeTeamId,
  });

  const { data: awayLineupData } = useQuery(GET_GAME_LINEUP, {
    variables: { gameTeamId: awayTeamId! },
    skip: !awayTeamId,
  });

  // Track score highlights for animations
  const [highlightedScore, setHighlightedScore] = useState<
    'home' | 'away' | null
  >(null);

  // Subscribe to real-time game events
  // Update Apollo cache directly instead of refetching to prevent flickering
  const handleEventCreated = useCallback(
    (event: {
      id: string;
      gameTeamId: string;
      gameMinute: number;
      gameSecond: number;
      position?: string | null;
      playerId?: string | null;
      externalPlayerName?: string | null;
      externalPlayerNumber?: string | null;
      eventType: { id: string; name: string; category: string };
    }) => {
      // Update cache by adding the new event to the appropriate gameTeam
      apolloClient.cache.modify({
        id: apolloClient.cache.identify({
          __typename: 'GameTeam',
          id: event.gameTeamId,
        }),
        fields: {
          gameEvents(existingEvents = [], { readField }) {
            // Check if event already exists to prevent duplicates
            const eventExists = existingEvents.some(
              (ref: { __ref: string }) => readField('id', ref) === event.id
            );
            if (eventExists) return existingEvents;

            // Create a new cache reference for the event
            const newEventRef = apolloClient.cache.writeFragment({
              data: {
                __typename: 'GameEvent',
                id: event.id,
                gameMinute: event.gameMinute,
                gameSecond: event.gameSecond,
                position: event.position,
                playerId: event.playerId,
                externalPlayerName: event.externalPlayerName,
                externalPlayerNumber: event.externalPlayerNumber,
                eventType: {
                  __typename: 'EventType',
                  ...event.eventType,
                },
              },
              fragment: GameEventFragmentDoc,
            });

            return [...existingEvents, newEventRef];
          },
        },
      });

      // If a goal was scored, highlight the score for the correct team
      if (event.eventType?.name === 'GOAL') {
        const homeTeam = data?.game?.gameTeams?.find(
          (gt) => gt.teamType === 'home'
        );
        const awayTeam = data?.game?.gameTeams?.find(
          (gt) => gt.teamType === 'away'
        );
        if (event.gameTeamId === homeTeam?.id) {
          setHighlightedScore('home');
        } else if (event.gameTeamId === awayTeam?.id) {
          setHighlightedScore('away');
        }
        setTimeout(() => setHighlightedScore(null), 1000);
      }
    },
    [apolloClient, data?.game?.gameTeams]
  );

  const handleEventDeleted = useCallback(
    (deletedEventId: string) => {
      // Remove the event from cache by evicting it
      apolloClient.cache.evict({
        id: apolloClient.cache.identify({
          __typename: 'GameEvent',
          id: deletedEventId,
        }),
      });
      // Garbage collect any orphaned references
      apolloClient.cache.gc();
    },
    [apolloClient]
  );

  const handleConflictDetected = useCallback(
    (conflict: {
      conflictId: string;
      eventType: string;
      gameMinute: number;
      gameSecond: number;
      conflictingEvents: Array<{
        eventId: string;
        playerName: string;
        playerId?: string | null;
        recordedByUserName: string;
      }>;
    }) => {
      // Show the conflict resolution modal
      // The conflicting events should already be in the cache from CREATED actions
      setConflictData(conflict);
    },
    []
  );

  // Handle game state changes from subscription (start, pause, half-time, end, reset)
  const handleGameStateChanged = useCallback(
    (gameUpdate: {
      id: string;
      name?: string | null;
      status: GameStatus;
      actualStart?: unknown;
      firstHalfEnd?: unknown;
      secondHalfStart?: unknown;
      actualEnd?: unknown;
      pausedAt?: unknown;
    }) => {
      // Update the game in the Apollo cache
      apolloClient.cache.modify({
        id: apolloClient.cache.identify({
          __typename: 'Game',
          id: gameUpdate.id,
        }),
        fields: {
          status: () => gameUpdate.status,
          actualStart: () => (gameUpdate.actualStart as string) ?? null,
          firstHalfEnd: () => (gameUpdate.firstHalfEnd as string) ?? null,
          secondHalfStart: () => (gameUpdate.secondHalfStart as string) ?? null,
          actualEnd: () => (gameUpdate.actualEnd as string) ?? null,
          pausedAt: () => (gameUpdate.pausedAt as string) ?? null,
        },
      });

      // Reset timer state when game is reset to scheduled
      if (gameUpdate.status === GameStatus.Scheduled) {
        setElapsedSeconds(0);
        timerBaseRef.current = null;
        timerHalfRef.current = null;
      }
    },
    [apolloClient]
  );

  const handleResolveConflict = useCallback(
    async (conflictId: string, selectedEventId: string, keepAll: boolean) => {
      try {
        await resolveConflict({
          variables: {
            conflictId,
            selectedEventId,
            keepAll,
          },
        });
        setConflictData(null);
      } catch (err) {
        console.error('Failed to resolve conflict:', err);
      }
    },
    [resolveConflict]
  );

  // Track previous scores to detect which team scored
  const prevHomeScore = useRef<number | null>(null);
  const prevAwayScore = useRef<number | null>(null);

  const { isConnected, isEventHighlighted } = useGameEventSubscription({
    gameId: gameId || '',
    onEventCreated: handleEventCreated,
    onEventDeleted: handleEventDeleted,
    onConflictDetected: handleConflictDetected,
    onGameStateChanged: handleGameStateChanged,
  });

  // Detect score changes and trigger highlight (using memoized scores)
  useEffect(() => {
    if (!data?.game) return;

    // Check if home score increased
    if (prevHomeScore.current !== null && homeScore > prevHomeScore.current) {
      setHighlightedScore('home');
      setTimeout(() => setHighlightedScore(null), 1000);
    }

    // Check if away score increased
    if (prevAwayScore.current !== null && awayScore > prevAwayScore.current) {
      setHighlightedScore('away');
      setTimeout(() => setHighlightedScore(null), 1000);
    }

    // Update refs
    prevHomeScore.current = homeScore;
    prevAwayScore.current = awayScore;
  }, [data?.game, homeScore, awayScore]);

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
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  // Delete substitution
  const handleDeleteSubstitution = async (gameEventId: string) => {
    try {
      await deleteSubstitution({
        variables: { gameEventId },
      });
    } catch (err) {
      console.error('Failed to delete substitution:', err);
    }
  };

  // Delete position swap
  const handleDeletePositionSwap = async (gameEventId: string) => {
    try {
      await deletePositionSwap({
        variables: { gameEventId },
      });
    } catch (err) {
      console.error('Failed to delete position swap:', err);
    }
  };

  // Delete starter entry
  const handleDeleteStarterEntry = async (gameEventId: string) => {
    try {
      await deleteStarterEntry({
        variables: { gameEventId },
      });
    } catch (err) {
      console.error('Failed to delete starter entry:', err);
    }
  };

  // Handle delete click - check for dependents first
  const handleDeleteClick = async (id: string, eventType: EventCardType) => {
    setDeleteTarget({ id, eventType });

    try {
      const result = await checkDependentEvents({
        variables: { gameEventId: id },
      });

      const dependents = result.data?.dependentEvents;
      if (dependents && dependents.count > 0) {
        // Show cascade delete modal
        setCascadeModalData({
          dependentEvents: dependents.dependentEvents,
          warningMessage: dependents.warningMessage,
        });
      } else {
        // No dependents, delete directly
        await performSimpleDelete(id, eventType);
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('Failed to check dependent events:', err);
      setDeleteTarget(null);
    }
  };

  // Perform simple delete based on event type
  const performSimpleDelete = async (id: string, eventType: EventCardType) => {
    switch (eventType) {
      case 'goal':
        await handleDeleteGoal(id);
        break;
      case 'substitution':
        await handleDeleteSubstitution(id);
        break;
      case 'position_swap':
        await handleDeletePositionSwap(id);
        break;
      case 'starter_entry':
        await handleDeleteStarterEntry(id);
        break;
    }
  };

  // Confirm cascade delete
  const handleCascadeConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await deleteWithCascade({
        variables: {
          gameEventId: deleteTarget.id,
          eventType: deleteTarget.eventType,
        },
      });
      setCascadeModalData(null);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to cascade delete:', err);
    }
  };

  // Cancel cascade delete
  const handleCascadeCancel = () => {
    setCascadeModalData(null);
    setDeleteTarget(null);
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

  // Change stats tracking level for this game
  const handleStatsTrackingChange = async (level: StatsTrackingLevel) => {
    try {
      await updateGame({
        variables: {
          id: gameId!,
          updateGameInput: {
            statsTrackingLevel: level,
          },
        },
      });
      setShowGameMenu(false);
    } catch (err) {
      console.error('Failed to update stats tracking level:', err);
    }
  };

  // Handle goal button click - skip modal for GOALS_ONLY mode
  const handleGoalClick = async (team: 'home' | 'away') => {
    const game = data?.game;
    if (game?.statsTrackingLevel === StatsTrackingLevel.GoalsOnly) {
      // Skip modal - record goal directly without player attribution
      const gameTeam = game?.gameTeams?.find((gt) => gt.teamType === team);
      if (!gameTeam) return;

      const minute = Math.floor(elapsedSeconds / 60);
      const second = elapsedSeconds % 60;

      try {
        await recordGoalDirect({
          variables: {
            input: {
              gameTeamId: gameTeam.id,
              gameMinute: minute,
              gameSecond: second,
            },
          },
        });
      } catch (err) {
        console.error('Failed to record goal:', err);
      }
    } else {
      // Open modal for FULL or SCORER_ONLY modes
      setGoalModalTeam(team);
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
  // Use memoized team data instead of recalculating
  const homeTeam = homeTeamData;
  const awayTeam = awayTeamData;

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
            {/* Real-time sync indicator */}
            {isConnected && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                title="Real-time sync active"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                Live
              </span>
            )}
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

                    {/* Stats Tracking Level */}
                    <div className="border-t border-gray-100 py-2">
                      <StatsTrackingSelector
                        value={
                          game.statsTrackingLevel || StatsTrackingLevel.Full
                        }
                        onChange={handleStatsTrackingChange}
                        variant="compact"
                        disabled={updatingGame}
                        label="Stats Tracking"
                      />
                    </div>

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
            <div
              className={`mt-2 text-5xl font-bold text-blue-600 ${
                highlightedScore === 'home' ? 'score-highlight' : ''
              }`}
            >
              {homeScore}
            </div>
            {isActivePlay && (
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => handleGoalClick('home')}
                  disabled={recordingGoal}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div
              className={`mt-2 text-5xl font-bold text-red-600 ${
                highlightedScore === 'away' ? 'score-highlight' : ''
              }`}
            >
              {awayScore}
            </div>
            {isActivePlay && (
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => handleGoalClick('away')}
                  disabled={recordingGoal}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                  elapsedSeconds={isActivePlay ? elapsedSeconds : undefined}
                />
              )}
              {activeTeam === 'away' && awayTeam && (
                <GameStats
                  gameId={gameId!}
                  teamId={awayTeam.team.id}
                  teamName={awayTeam.team.name}
                  teamColor={awayTeam.team.homePrimaryColor || '#EF4444'}
                  elapsedSeconds={isActivePlay ? elapsedSeconds : undefined}
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
                // Player info type for resolved names
                type PlayerInfo = {
                  firstName?: string | null;
                  lastName?: string | null;
                  email?: string | null;
                };

                // Define event types for the timeline
                type MatchEvent = {
                  id: string;
                  createdAt: string;
                  eventType:
                    | 'goal'
                    | 'substitution'
                    | 'position_swap'
                    | 'starter_entry';
                  gameMinute: number;
                  gameSecond: number;
                  teamType: string;
                  teamName: string;
                  teamColor: string;
                  // Goal-specific
                  playerId?: string | null;
                  externalPlayerName?: string | null;
                  externalPlayerNumber?: string | null;
                  player?: PlayerInfo | null;
                  assist?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                    player?: PlayerInfo | null;
                  } | null;
                  // Substitution-specific
                  playerOut?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                    externalPlayerNumber?: string | null;
                    player?: PlayerInfo | null;
                  };
                  playerIn?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                    externalPlayerNumber?: string | null;
                    player?: PlayerInfo | null;
                  };
                  // Position swap-specific
                  swapPlayer1?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                    externalPlayerNumber?: string | null;
                    position?: string | null;
                    player?: PlayerInfo | null;
                  };
                  swapPlayer2?: {
                    playerId?: string | null;
                    externalPlayerName?: string | null;
                    externalPlayerNumber?: string | null;
                    position?: string | null;
                    player?: PlayerInfo | null;
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
                        createdAt: event.createdAt,
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
                        player: event.player,
                        assist: assistEvent
                          ? {
                              playerId: assistEvent.playerId,
                              externalPlayerName:
                                assistEvent.externalPlayerName,
                              player: assistEvent.player,
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
                        createdAt: event.createdAt,
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
                          player: event.player,
                        },
                        playerIn: subInEvent
                          ? {
                              playerId: subInEvent.playerId,
                              externalPlayerName: subInEvent.externalPlayerName,
                              externalPlayerNumber:
                                subInEvent.externalPlayerNumber,
                              player: subInEvent.player,
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
                        createdAt: event.createdAt,
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
                          player: event.player,
                        },
                        swapPlayer2: pairedSwap
                          ? {
                              playerId: pairedSwap.playerId,
                              externalPlayerName: pairedSwap.externalPlayerName,
                              externalPlayerNumber:
                                pairedSwap.externalPlayerNumber,
                              position: pairedSwap.position,
                              player: pairedSwap.player,
                            }
                          : undefined,
                      });
                    }

                    // Process SUBSTITUTION_IN events at minute 0 (starters entering field)
                    // These are not paired with SUBSTITUTION_OUT events
                    if (
                      event.eventType?.name === 'SUBSTITUTION_IN' &&
                      event.gameMinute === 0 &&
                      event.gameSecond === 0 &&
                      !processedSubIns.has(event.id)
                    ) {
                      matchEvents.push({
                        id: event.id,
                        createdAt: event.createdAt,
                        eventType: 'starter_entry',
                        gameMinute: event.gameMinute,
                        gameSecond: event.gameSecond,
                        teamType,
                        teamName: gameTeam.team.name,
                        teamColor:
                          gameTeam.team.homePrimaryColor || defaultColor,
                        playerIn: {
                          playerId: event.playerId,
                          externalPlayerName: event.externalPlayerName,
                          externalPlayerNumber: event.externalPlayerNumber,
                          player: event.player,
                        },
                      });
                    }
                  });
                };

                // Process both teams
                processTeamEvents(homeTeam, 'home', '#3B82F6');
                processTeamEvents(awayTeam, 'away', '#EF4444');

                // Sort by createdAt (most recent first, substitutions before swaps in batch)
                matchEvents.sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );

                // Helper to get player name from event data or team roster
                const getPlayerName = (
                  playerId?: string | null,
                  externalName?: string | null,
                  externalNumber?: string | null,
                  player?: PlayerInfo | null,
                  team?: typeof homeTeam
                ) => {
                  // Priority 1: External player name (for unmanaged teams)
                  if (externalName) return externalName;
                  // Priority 2: External player number
                  if (externalNumber) return `#${externalNumber}`;
                  // Priority 3: Player data from event relation (most reliable)
                  if (player) {
                    const name = `${player.firstName || ''} ${
                      player.lastName || ''
                    }`.trim();
                    return name || player.email || 'Unknown';
                  }
                  // Priority 4: Fallback to team roster lookup
                  if (playerId && team?.team.teamPlayers) {
                    const rosterPlayer = team.team.teamPlayers.find(
                      (tp) => tp.userId === playerId
                    );
                    if (rosterPlayer?.user) {
                      const name = `${rosterPlayer.user.firstName || ''} ${
                        rosterPlayer.user.lastName || ''
                      }`.trim();
                      return name || rosterPlayer.user.email;
                    }
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

                // Helper to check if deleting based on event type
                const isDeletingEvent = (
                  eventId: string,
                  eventType: EventCardType
                ) => {
                  // If this event is the target of cascade delete
                  if (deleteTarget?.id === eventId) {
                    return (
                      deletingWithCascade ||
                      deletingGoal ||
                      deletingSubstitution ||
                      deletingPositionSwap ||
                      deletingStarterEntry
                    );
                  }
                  return false;
                };

                // Helper to check if checking dependents for this event
                const isCheckingEvent = (eventId: string) => {
                  return deleteTarget?.id === eventId && checkingDependents;
                };

                return (
                  <div className="space-y-3">
                    {matchEvents.map((event) => {
                      const team =
                        event.teamType === 'home' ? homeTeam : awayTeam;

                      // Resolve player names based on event type
                      const scorerName =
                        event.eventType === 'goal'
                          ? getPlayerName(
                              event.playerId,
                              event.externalPlayerName,
                              event.externalPlayerNumber,
                              event.player,
                              team
                            )
                          : undefined;

                      const assisterName =
                        event.eventType === 'goal' && event.assist
                          ? getPlayerName(
                              event.assist.playerId,
                              event.assist.externalPlayerName,
                              null,
                              event.assist.player,
                              team
                            )
                          : null;

                      const playerInName =
                        event.eventType === 'substitution' ||
                        event.eventType === 'starter_entry'
                          ? getPlayerName(
                              event.playerIn?.playerId,
                              event.playerIn?.externalPlayerName,
                              event.playerIn?.externalPlayerNumber,
                              event.playerIn?.player,
                              team
                            )
                          : undefined;

                      const playerOutName =
                        event.eventType === 'substitution'
                          ? getPlayerName(
                              event.playerOut?.playerId,
                              event.playerOut?.externalPlayerName,
                              event.playerOut?.externalPlayerNumber,
                              event.playerOut?.player,
                              team
                            )
                          : undefined;

                      const player1Name =
                        event.eventType === 'position_swap'
                          ? getPlayerName(
                              event.swapPlayer1?.playerId,
                              event.swapPlayer1?.externalPlayerName,
                              event.swapPlayer1?.externalPlayerNumber,
                              event.swapPlayer1?.player,
                              team
                            )
                          : undefined;

                      const player2Name =
                        event.eventType === 'position_swap'
                          ? getPlayerName(
                              event.swapPlayer2?.playerId,
                              event.swapPlayer2?.externalPlayerName,
                              event.swapPlayer2?.externalPlayerNumber,
                              event.swapPlayer2?.player,
                              team
                            )
                          : undefined;

                      return (
                        <EventCard
                          key={event.id}
                          id={event.id}
                          eventType={event.eventType}
                          gameMinute={event.gameMinute}
                          gameSecond={event.gameSecond}
                          teamName={event.teamName}
                          teamColor={event.teamColor}
                          scorerName={scorerName}
                          assisterName={assisterName}
                          playerInName={playerInName}
                          playerOutName={playerOutName}
                          player1Name={player1Name}
                          player1Position={event.swapPlayer1?.position}
                          player2Name={player2Name}
                          player2Position={event.swapPlayer2?.position}
                          onDeleteClick={handleDeleteClick}
                          onEdit={
                            event.eventType === 'goal'
                              ? () =>
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
                                              event.assist.externalPlayerName,
                                          }
                                        : null,
                                    },
                                  })
                              : undefined
                          }
                          isDeleting={isDeletingEvent(
                            event.id,
                            event.eventType
                          )}
                          isCheckingDependents={isCheckingEvent(event.id)}
                          isHighlighted={isEventHighlighted(event.id)}
                        />
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
          statsTrackingLevel={game?.statsTrackingLevel}
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
          statsTrackingLevel={game?.statsTrackingLevel}
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

      {/* Cascade Delete Modal */}
      {cascadeModalData && deleteTarget && (
        <CascadeDeleteModal
          isOpen={true}
          eventType={deleteTarget.eventType}
          dependentEvents={cascadeModalData.dependentEvents}
          warningMessage={cascadeModalData.warningMessage}
          isDeleting={deletingWithCascade}
          onConfirm={handleCascadeConfirm}
          onCancel={handleCascadeCancel}
        />
      )}

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={conflictData !== null}
        conflictId={conflictData?.conflictId || ''}
        eventType={conflictData?.eventType || ''}
        gameMinute={conflictData?.gameMinute || 0}
        gameSecond={conflictData?.gameSecond || 0}
        conflictingEvents={conflictData?.conflictingEvents || []}
        isResolving={resolvingConflict}
        onResolve={handleResolveConflict}
        onClose={() => setConflictData(null)}
      />
    </div>
  );
};

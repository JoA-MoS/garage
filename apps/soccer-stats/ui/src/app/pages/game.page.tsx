import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router';
import {
  useQuery,
  useMutation,
  useLazyQuery,
  useApolloClient,
} from '@apollo/client/react';
import { gql } from '@apollo/client';

import {
  CascadeDeleteModal,
  ConflictResolutionModal,
  EventCard,
  type EventType as EventCardType,
  type ChildEventData,
} from '@garage/soccer-stats/ui-components';
import {
  GameStatus,
  StatsTrackingLevel,
  RosterPlayer as GqlRosterPlayer,
} from '@garage/soccer-stats/graphql-codegen';
import { fromPeriodSecond, toPeriodSecond } from '@garage/soccer-stats/utils';

import {
  GET_GAME_BY_ID,
  UPDATE_GAME,
  UPDATE_GAME_TEAM,
  GET_GAME_ROSTER,
  DELETE_GOAL,
  DELETE_SUBSTITUTION,
  DELETE_POSITION_SWAP,
  DELETE_STARTER_ENTRY,
  GET_PLAYER_STATS,
  GET_DEPENDENT_EVENTS,
  DELETE_EVENT_WITH_CASCADE,
  RESOLVE_EVENT_CONFLICT,
  RECORD_GOAL,
  RECORD_FORMATION_CHANGE,
  REOPEN_GAME,
} from '../services/games-graphql.service';
import { GameLineupTab } from '../components/smart/game-lineup-tab.smart';
import { GoalModal, EditGoalData } from '../components/smart/goal-modal.smart';
import { ManualGoalModal } from '../components/smart/manual-goal-modal.smart';
import { SubstitutionPanel } from '../components/smart/substitution-panel';
import { GameStats } from '../components/smart/game-stats.smart';
import { GameSummaryPresentation } from '../components/presentation/game-summary.presentation';
import { useGameEventSubscription } from '../hooks/use-game-event-subscription';
import { useSyncedGameTime } from '../hooks/use-synced-game-time';

import { computeScore, GameHeader, StickyScoreBar } from './game';

// Fragment for writing GameEvent to cache
// Must include all fields that GET_GAME_BY_ID query expects for proper cache merging
const GameEventFragmentDoc = gql`
  fragment GameEventFragment on GameEvent {
    id
    createdAt
    periodSecond
    position
    formation
    playerId
    externalPlayerName
    externalPlayerNumber
    period
    player {
      id
      firstName
      lastName
      email
    }
    eventType {
      id
      name
      category
    }
    childEvents {
      id
      playerId
      externalPlayerName
      externalPlayerNumber
      position
      player {
        id
        firstName
        lastName
      }
      eventType {
        id
        name
      }
    }
  }
`;

/**
 * Game page - displays a single game with lineup, stats, and event tracking
 */
type TabType = 'lineup' | 'stats' | 'events';

export const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from URL path (e.g., /games/:gameId/lineup -> 'lineup')
  const activeTab = useMemo<TabType>(() => {
    const pathParts = location.pathname.split('/');
    const tabFromUrl = pathParts[pathParts.length - 1];
    if (
      tabFromUrl === 'lineup' ||
      tabFromUrl === 'stats' ||
      tabFromUrl === 'events'
    ) {
      return tabFromUrl;
    }
    return 'lineup';
  }, [location.pathname]);

  // Navigate to tab (replaces setActiveTab)
  const setActiveTab = useCallback(
    (tab: TabType) => {
      navigate(`/games/${gameId}/${tab}`);
    },
    [navigate, gameId],
  );
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  const [goalModalTeam, setGoalModalTeam] = useState<'home' | 'away' | null>(
    null,
  );
  const [editGoalData, setEditGoalData] = useState<{
    team: 'home' | 'away';
    goal: EditGoalData;
  } | null>(null);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [clearEventsOnReset, setClearEventsOnReset] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [showManualGoalModal, setShowManualGoalModal] = useState(false);

  // Action error state - displayed as dismissible banner
  const [actionError, setActionError] = useState<string | null>(null);

  // Field player selection for substitution panel
  // When a player is selected (e.g., from tapping on field), the panel opens with them pre-selected
  const [selectedFieldPlayerForSub, setSelectedFieldPlayerForSub] =
    useState<GqlRosterPlayer | null>(null);

  // Bench selection from panel - when set, field player clicks complete the substitution
  const [panelBenchSelection, setPanelBenchSelection] =
    useState<GqlRosterPlayer | null>(null);

  // Field player clicked while bench selection is active (for completing bench-first subs)
  const [fieldPlayerToReplaceForPanel, setFieldPlayerToReplaceForPanel] =
    useState<GqlRosterPlayer | null>(null);

  // Queued player IDs from substitution panel - used to show indicators on field
  const [queuedPlayerIds, setQueuedPlayerIds] = useState<Set<string>>(
    new Set(),
  );

  // Selected field player ID from substitution panel - used to show selection indicator
  const [selectedFieldPlayerId, setSelectedFieldPlayerId] = useState<
    string | null
  >(null);

  // Cascade delete state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    eventType: EventCardType;
  } | null>(null);
  const [cascadeModalData, setCascadeModalData] = useState<{
    dependentEvents: Array<{
      id: string;
      eventType: string;
      period?: string | null;
      periodSecond: number;
      playerName?: string | null;
      description?: string | null;
    }>;
    warningMessage?: string | null;
  } | null>(null);

  // Conflict resolution state
  const [conflictData, setConflictData] = useState<{
    conflictId: string;
    eventType: string;
    period?: string | null;
    periodSecond: number;
    conflictingEvents: Array<{
      eventId: string;
      playerName: string;
      playerId?: string | null;
      recordedByUserName: string;
    }>;
  } | null>(null);

  // Track if we've set the initial tab based on game status (for completed games)
  const initialTabSetRef = useRef(false);
  // Track previous game status to detect completion
  const prevGameStatusRef = useRef<GameStatus | null>(null);

  const apolloClient = useApolloClient();

  const { data, loading, error } = useQuery(GET_GAME_BY_ID, {
    variables: { id: gameId! },
    skip: !gameId,
    // Prevent loading state from becoming true during cache updates or background refetches
    // Only show loading on initial fetch, not when cache is modified by subscriptions
    notifyOnNetworkStatusChange: false,
    fetchPolicy: 'cache-first',
  });

  // Server-synced game time - keeps multiple clients in sync
  const syncedTime = useSyncedGameTime(
    data?.game
      ? {
          currentPeriod: data.game.currentPeriod,
          currentPeriodSecond: data.game.currentPeriodSecond,
          serverTimestamp: data.game.serverTimestamp,
        }
      : null,
  );

  // Debug: Log when loading spinner is displayed (for E2E testing)
  // Only logs in development/test environments to avoid polluting production console
  useEffect(() => {
    if (import.meta.env.DEV && loading) {
      console.log(
        '[Game Page Loading Spinner] Displayed - loading state is true',
      );
    }
  }, [loading]);

  // Auto-switch to stats tab for completed games:
  // 1. When opening a completed game, default to stats tab
  // 2. When a game becomes completed during the session, auto-switch to stats
  useEffect(() => {
    const gameStatus = data?.game?.status;
    if (!gameStatus) return;

    // Case 1: Initial load of a completed game - set to stats tab
    if (!initialTabSetRef.current && gameStatus === GameStatus.Completed) {
      setActiveTab('stats');
      initialTabSetRef.current = true;
    }

    // Case 2: Game just became completed (status changed during session)
    if (
      prevGameStatusRef.current !== null &&
      prevGameStatusRef.current !== GameStatus.Completed &&
      gameStatus === GameStatus.Completed
    ) {
      setActiveTab('stats');
    }

    // Update previous status ref
    prevGameStatusRef.current = gameStatus;
  }, [data?.game?.status]);

  // Note: We don't use refetchQueries for updateGame.
  // Game status is updated via GameUpdated subscription (handleGameStateChanged).
  // Timing events (PERIOD_START, etc.) are now published by GamesService via
  // GameEventChanged subscription, enabling real-time updates for all viewers.
  const [updateGame, { loading: updatingGame }] = useMutation(UPDATE_GAME);
  const [reopenGame, { loading: reopeningGame }] = useMutation(REOPEN_GAME);

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
      const homeTeam = game?.teams?.find((gt) => gt.teamType === 'home');
      const awayTeam = game?.teams?.find((gt) => gt.teamType === 'away');
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
            | typeof GET_GAME_ROSTER;
          variables: object;
        }> = [{ query: GET_GAME_BY_ID, variables: { id: gameId } }];
        const game = data?.game;
        const homeTeam = game?.teams?.find((gt) => gt.teamType === 'home');
        const awayTeam = game?.teams?.find((gt) => gt.teamType === 'away');
        if (homeTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: homeTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_ROSTER,
            variables: { gameTeamId: homeTeam.id },
          });
        }
        if (awayTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: awayTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_ROSTER,
            variables: { gameTeamId: awayTeam.id },
          });
        }
        return queries;
      },
    },
  );

  const [deletePositionSwap, { loading: deletingPositionSwap }] = useMutation(
    DELETE_POSITION_SWAP,
    {
      refetchQueries: () => {
        const queries: Array<{
          query: typeof GET_GAME_BY_ID | typeof GET_GAME_ROSTER;
          variables: object;
        }> = [{ query: GET_GAME_BY_ID, variables: { id: gameId } }];
        const game = data?.game;
        const homeTeam = game?.teams?.find((gt) => gt.teamType === 'home');
        const awayTeam = game?.teams?.find((gt) => gt.teamType === 'away');
        if (homeTeam) {
          queries.push({
            query: GET_GAME_ROSTER,
            variables: { gameTeamId: homeTeam.id },
          });
        }
        if (awayTeam) {
          queries.push({
            query: GET_GAME_ROSTER,
            variables: { gameTeamId: awayTeam.id },
          });
        }
        return queries;
      },
    },
  );

  const [deleteStarterEntry, { loading: deletingStarterEntry }] = useMutation(
    DELETE_STARTER_ENTRY,
    {
      refetchQueries: () => {
        const queries: Array<{
          query:
            | typeof GET_GAME_BY_ID
            | typeof GET_PLAYER_STATS
            | typeof GET_GAME_ROSTER;
          variables: object;
        }> = [{ query: GET_GAME_BY_ID, variables: { id: gameId } }];
        const game = data?.game;
        const homeTeam = game?.teams?.find((gt) => gt.teamType === 'home');
        const awayTeam = game?.teams?.find((gt) => gt.teamType === 'away');
        if (homeTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: homeTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_ROSTER,
            variables: { gameTeamId: homeTeam.id },
          });
        }
        if (awayTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: awayTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_ROSTER,
            variables: { gameTeamId: awayTeam.id },
          });
        }
        return queries;
      },
    },
  );

  // Cascade delete queries and mutations
  const [checkDependentEvents, { loading: checkingDependents }] = useLazyQuery(
    GET_DEPENDENT_EVENTS,
    {
      fetchPolicy: 'network-only',
    },
  );

  const [deleteWithCascade, { loading: deletingWithCascade }] = useMutation(
    DELETE_EVENT_WITH_CASCADE,
    {
      refetchQueries: () => {
        const queries: Array<{
          query:
            | typeof GET_GAME_BY_ID
            | typeof GET_PLAYER_STATS
            | typeof GET_GAME_ROSTER;
          variables: object;
        }> = [{ query: GET_GAME_BY_ID, variables: { id: gameId } }];
        const game = data?.game;
        const homeTeam = game?.teams?.find((gt) => gt.teamType === 'home');
        const awayTeam = game?.teams?.find((gt) => gt.teamType === 'away');
        if (homeTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: homeTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_ROSTER,
            variables: { gameTeamId: homeTeam.id },
          });
        }
        if (awayTeam) {
          queries.push({
            query: GET_PLAYER_STATS,
            variables: { input: { teamId: awayTeam.team.id, gameId } },
          });
          queries.push({
            query: GET_GAME_ROSTER,
            variables: { gameTeamId: awayTeam.id },
          });
        }
        return queries;
      },
    },
  );

  const [resolveConflict, { loading: resolvingConflict }] = useMutation(
    RESOLVE_EVENT_CONFLICT,
    {
      refetchQueries: [{ query: GET_GAME_BY_ID, variables: { id: gameId } }],
    },
  );

  // Update per-team settings (formation, stats tracking level)
  const [updateGameTeam, { loading: updatingGameTeam }] = useMutation(
    UPDATE_GAME_TEAM,
    {
      refetchQueries: [{ query: GET_GAME_BY_ID, variables: { id: gameId } }],
    },
  );

  // Record formation change event
  // Note: No refetchQueries - the event is handled by GameEventChanged subscription
  const [recordFormationChange] = useMutation(RECORD_FORMATION_CHANGE);

  // Note: startPeriod and endPeriod mutations are NOT used here.
  // The backend's updateGame automatically handles period events via createTimingEventsForStatusChange.

  // Memoize team lookups to prevent unnecessary recalculations
  const homeTeamData = useMemo(
    () => data?.game?.teams?.find((gt) => gt.teamType === 'home'),
    [data?.game?.teams],
  );
  const awayTeamData = useMemo(
    () => data?.game?.teams?.find((gt) => gt.teamType === 'away'),
    [data?.game?.teams],
  );
  const homeTeamId = homeTeamData?.id;
  const awayTeamId = awayTeamData?.id;

  // Memoize scores to prevent recalculation on every render
  const homeScore = useMemo(
    () => computeScore(homeTeamData?.events),
    [homeTeamData?.events],
  );
  const awayScore = useMemo(
    () => computeScore(awayTeamData?.events),
    [awayTeamData?.events],
  );

  // Fetch lineup data for goal modal (only when needed)
  const { data: homeLineupData } = useQuery(GET_GAME_ROSTER, {
    variables: { gameTeamId: homeTeamId! },
    skip: !homeTeamId,
  });

  const { data: awayLineupData } = useQuery(GET_GAME_ROSTER, {
    variables: { gameTeamId: awayTeamId! },
    skip: !awayTeamId,
  });

  // Derive on-field and bench players from roster data
  // position != null = on field, position == null = bench
  const homeOnField = useMemo(
    () =>
      homeLineupData?.gameRoster?.players?.filter((p) => p.position != null) ??
      [],
    [homeLineupData],
  );
  const homeBench = useMemo(
    () =>
      homeLineupData?.gameRoster?.players?.filter((p) => p.position == null) ??
      [],
    [homeLineupData],
  );
  const awayOnField = useMemo(
    () =>
      awayLineupData?.gameRoster?.players?.filter((p) => p.position != null) ??
      [],
    [awayLineupData],
  );
  const awayBench = useMemo(
    () =>
      awayLineupData?.gameRoster?.players?.filter((p) => p.position == null) ??
      [],
    [awayLineupData],
  );

  // Track score highlights for animations
  const [highlightedScore, setHighlightedScore] = useState<
    'home' | 'away' | null
  >(null);

  // Track previous scores to detect changes and trigger animations
  // Using refs to avoid triggering useEffect on initialization
  const prevHomeScoreRef = useRef(homeScore);
  const prevAwayScoreRef = useRef(awayScore);

  // Trigger score animation when score actually changes (not on subscription message)
  // This ensures animation is synchronized with the displayed score update
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (homeScore > prevHomeScoreRef.current) {
      setHighlightedScore('home');
      timeoutId = setTimeout(() => setHighlightedScore(null), 1000);
    }
    prevHomeScoreRef.current = homeScore;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [homeScore]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (awayScore > prevAwayScoreRef.current) {
      setHighlightedScore('away');
      timeoutId = setTimeout(() => setHighlightedScore(null), 1000);
    }
    prevAwayScoreRef.current = awayScore;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [awayScore]);

  // Subscribe to real-time game events
  // Update Apollo cache directly instead of refetching to prevent flickering
  const handleEventCreated = useCallback(
    (event: {
      id: string;
      gameTeamId: string;
      period?: string | null;
      periodSecond: number;
      position?: string | null;
      playerId?: string | null;
      externalPlayerName?: string | null;
      externalPlayerNumber?: string | null;
      eventType: { id: string; name: string; category: string };
      childEvents?: Array<{
        id: string;
        period?: string | null;
        periodSecond: number;
        playerId?: string | null;
        externalPlayerName?: string | null;
        externalPlayerNumber?: string | null;
        position?: string | null;
        player?: { id: string; firstName: string; lastName: string } | null;
        eventType: { id: string; name: string; category: string };
      }>;
    }) => {
      // Update cache by adding the new event to the appropriate gameTeam
      apolloClient.cache.modify({
        id: apolloClient.cache.identify({
          __typename: 'GameTeam',
          id: event.gameTeamId,
        }),
        fields: {
          events(existingEvents = [], { readField }) {
            // Check if event already exists to prevent duplicates
            const eventExists = existingEvents.some(
              (ref: { __ref: string }) => readField('id', ref) === event.id,
            );
            if (eventExists) return existingEvents;

            // Create a new cache reference for the event
            const newEventRef = apolloClient.cache.writeFragment({
              data: {
                __typename: 'GameEvent',
                id: event.id,
                createdAt: new Date().toISOString(),
                period: event.period ?? null,
                periodSecond: event.periodSecond,
                position: event.position ?? null,
                formation: null,
                playerId: event.playerId,
                externalPlayerName: event.externalPlayerName,
                externalPlayerNumber: event.externalPlayerNumber,
                player: null, // Will be populated by server response
                eventType: {
                  __typename: 'EventType',
                  ...event.eventType,
                },
                childEvents: (event.childEvents || []).map((child) => ({
                  __typename: 'GameEvent',
                  id: child.id,
                  playerId: child.playerId,
                  externalPlayerName: child.externalPlayerName,
                  externalPlayerNumber: child.externalPlayerNumber,
                  position: child.position ?? null,
                  player: child.player
                    ? {
                        __typename: 'User',
                        id: child.player.id,
                        firstName: child.player.firstName,
                        lastName: child.player.lastName,
                      }
                    : null,
                  eventType: {
                    __typename: 'EventType',
                    ...child.eventType,
                  },
                })),
              },
              fragment: GameEventFragmentDoc,
            });

            return [...existingEvents, newEventRef];
          },
        },
      });

      // Refetch data when lineup/stats-affecting events are received
      // These events change who is on the field and player stats (time, isOnField, lastEntryPeriodSecond)
      const statsAffectingEvents = [
        'SUBSTITUTION_IN',
        'SUBSTITUTION_OUT',
        'PERIOD_START',
        'PERIOD_END',
      ];
      if (statsAffectingEvents.includes(event.eventType.name)) {
        apolloClient.refetchQueries({
          // GET_GAME_ROSTER: Updates lineup positions (who's on field vs bench)
          // GET_GAME_BY_ID: Updates player stats including isOnField, lastEntryPeriodSecond for live time
          include: [GET_GAME_ROSTER, GET_GAME_BY_ID],
        });
      }

      // Note: Score highlight animations are now triggered by useEffect watching
      // homeScore/awayScore changes, ensuring animation is synchronized with
      // the displayed score update (not the subscription message timing).
    },
    [apolloClient],
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
    [apolloClient],
  );

  const handleConflictDetected = useCallback(
    (conflict: {
      conflictId: string;
      eventType: string;
      period?: string | null;
      periodSecond: number;
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
    [],
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
      // Note: Timer state is now derived from server sync data,
      // so no need to manually reset here
    },
    [apolloClient],
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
        setActionError(
          err instanceof Error ? err.message : 'Failed to resolve conflict',
        );
      }
    },
    [resolveConflict],
  );

  const { isConnected, isEventHighlighted } = useGameEventSubscription({
    gameId: gameId || '',
    onEventCreated: handleEventCreated,
    onEventDeleted: handleEventDeleted,
    onConflictDetected: handleConflictDetected,
    onGameStateChanged: handleGameStateChanged,
  });

  // Start first half
  // Note: The backend's updateGame automatically creates PERIOD_START and SUB_IN events
  // via createTimingEventsForStatusChange when status changes to FIRST_HALF
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to start first half',
      );
    }
  };

  // End first half and go to halftime
  // Note: The backend's updateGame automatically creates PERIOD_END and SUB_OUT events
  // via createTimingEventsForStatusChange when status changes to HALFTIME
  const handleEndFirstHalf = async () => {
    try {
      // Use server-synced time for accurate event timing
      // In period 1, periodSecond equals total game seconds
      const gameMinute = Math.floor(syncedTime.periodSecond / 60);
      const gameSecond = syncedTime.periodSecond % 60;

      await updateGame({
        variables: {
          id: gameId!,
          updateGameInput: {
            status: GameStatus.Halftime,
            firstHalfEnd: new Date().toISOString(),
            gameMinute,
            gameSecond,
          },
        },
      });
    } catch (err) {
      console.error('Failed to end first half:', err);
      setActionError(
        err instanceof Error ? err.message : 'Failed to end first half',
      );
    }
  };

  // Start second half
  // Note: The backend's updateGame automatically creates PERIOD_START and SUB_IN events
  // via createTimingEventsForStatusChange when status changes to SECOND_HALF.
  // It also auto-copies the first half lineup if setSecondHalfLineup wasn't called.
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to start second half',
      );
    }
  };

  // End game
  // Note: The backend's updateGame automatically creates PERIOD_END and SUB_OUT events
  // via createTimingEventsForStatusChange when status changes to COMPLETED
  const handleEndGame = async () => {
    try {
      // Use server-synced time for accurate event timing
      // In period 2, total game time = half duration + period seconds
      const halfDurationSecs =
        ((data?.game?.format?.durationMinutes || 60) / 2) * 60;
      const totalSeconds =
        syncedTime.period === '2'
          ? halfDurationSecs + syncedTime.periodSecond
          : syncedTime.periodSecond;
      const gameMinute = Math.floor(totalSeconds / 60);
      const gameSecond = totalSeconds % 60;

      await updateGame({
        variables: {
          id: gameId!,
          updateGameInput: {
            status: GameStatus.Completed,
            actualEnd: new Date().toISOString(),
            gameMinute,
            gameSecond,
          },
        },
      });
      setShowEndGameConfirm(false);
    } catch (err) {
      console.error('Failed to end game:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to end game');
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete goal',
      );
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete substitution',
      );
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete position swap',
      );
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete starter entry',
      );
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to check dependent events',
      );
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete event',
      );
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to toggle pause',
      );
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
      // Note: Timer state is derived from server sync data
    } catch (err) {
      console.error('Failed to reset game:', err);
      setActionError(
        err instanceof Error ? err.message : 'Failed to reset game',
      );
    }
  };

  // Reopen completed game to add missed events
  const handleReopenGame = async () => {
    try {
      await reopenGame({
        variables: {
          id: gameId!,
        },
      });
      setShowReopenConfirm(false);
      setShowGameMenu(false);
    } catch (err) {
      console.error('Failed to reopen game:', err);
      setActionError(
        err instanceof Error ? err.message : 'Failed to reopen game',
      );
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
      setActionError(
        err instanceof Error ? err.message : 'Failed to update stats tracking',
      );
    }
  };

  // Determine current period - use server-synced time when available
  // Falls back to status-based calculation for games that haven't started
  const currentPeriod =
    syncedTime.period ??
    (data?.game?.status === GameStatus.SecondHalf
      ? '2'
      : data?.game?.status === GameStatus.Halftime
        ? '2' // At halftime, we're transitioning to period 2
        : '1');

  // Handle formation change for a team
  // Always creates a FORMATION_CHANGE event - pre-game uses period 1, second 0
  const handleFormationChange = useCallback(
    async (gameTeamId: string, formation: string, periodSecond?: number) => {
      try {
        // Always create a FORMATION_CHANGE event
        // Pre-game: period 1, second 0
        // Mid-game: current period and second
        await recordFormationChange({
          variables: {
            input: {
              gameTeamId,
              formation,
              period: periodSecond !== undefined ? currentPeriod : '1',
              periodSecond: periodSecond ?? 0,
            },
          },
        });
      } catch (err) {
        console.error('Failed to update formation:', err);
        setActionError(
          err instanceof Error ? err.message : 'Failed to update formation',
        );
        throw err; // Re-throw so calling code knows it failed
      }
    },
    [recordFormationChange, currentPeriod],
  );

  // Handle field player click - routes to appropriate substitution flow
  const handleFieldPlayerClickForSub = useCallback(
    (player: GqlRosterPlayer) => {
      if (panelBenchSelection) {
        // Bench-first flow: complete the substitution
        setFieldPlayerToReplaceForPanel(player);
      } else {
        // Field-first flow: start new substitution with this player
        setSelectedFieldPlayerForSub(player);
      }
    },
    [panelBenchSelection],
  );

  // Change stats tracking level for a specific team in this game
  const handleTeamStatsTrackingChange = async (
    team: 'home' | 'away',
    level: StatsTrackingLevel | null,
  ) => {
    const gameTeamId = team === 'home' ? homeTeamData?.id : awayTeamData?.id;
    if (!gameTeamId) return;

    try {
      await updateGameTeam({
        variables: {
          gameTeamId,
          updateGameTeamInput: {
            statsTrackingLevel: level,
          },
        },
      });
    } catch (err) {
      console.error('Failed to update team stats tracking level:', err);
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to update team stats tracking',
      );
    }
  };

  // Get effective stats tracking level for a team
  // Cascade: GameTeam.statsTrackingLevel → Game.statsTrackingLevel → default (FULL)
  const getEffectiveTrackingLevel = useCallback(
    (team: 'home' | 'away'): StatsTrackingLevel => {
      const game = data?.game;
      const gameTeam = team === 'home' ? homeTeamData : awayTeamData;

      // Priority: Per-team level > Game level > Default
      return (
        gameTeam?.statsTrackingLevel ||
        game?.statsTrackingLevel ||
        StatsTrackingLevel.Full
      );
    },
    [data?.game, homeTeamData, awayTeamData],
  );

  // Handle goal button click - skip modal for GOALS_ONLY mode
  const handleGoalClick = async (team: 'home' | 'away') => {
    const game = data?.game;
    const effectiveLevel = getEffectiveTrackingLevel(team);

    if (effectiveLevel === StatsTrackingLevel.GoalsOnly) {
      // Skip modal - record goal directly without player attribution
      const gameTeam = game?.teams?.find((gt) => gt.teamType === team);
      if (!gameTeam || !game) return;

      try {
        // Call mutation - subscription will update cache for all connected clients
        // Use server-synced time for consistent timing across clients
        await recordGoalDirect({
          variables: {
            input: {
              gameTeamId: gameTeam.id,
              period: currentPeriod,
              periodSecond: syncedTime.periodSecond,
            },
          },
        });
      } catch (err) {
        console.error('Failed to record goal:', err);
        setActionError(
          err instanceof Error ? err.message : 'Failed to record goal',
        );
      }
    } else {
      // Open modal for FULL or SCORER_ONLY modes
      setGoalModalTeam(team);
    }
  };

  // Note: Game clock is now managed by useSyncedGameTime hook
  // which provides server-synchronized timing across all clients

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
  // During HALFTIME, use the end-of-first-half time (half of total duration)
  const halftimeDurationMinutes = Math.floor(
    (game.format?.durationMinutes || 60) / 2,
  );
  const halftimeDurationSeconds = halftimeDurationMinutes * 60;

  // Current period seconds - use server-synced time
  // The hook handles ticking locally between server updates
  const currentPeriodSeconds = syncedTime.periodSecond;

  // Derive total elapsed seconds from synced time for components that need it
  // Period 1: elapsedSeconds = periodSecond
  // Period 2: elapsedSeconds = halfDuration + periodSecond
  const elapsedSeconds =
    syncedTime.period === '2'
      ? halftimeDurationSeconds + syncedTime.periodSecond
      : syncedTime.periodSecond;

  // Compute compact half indicator for sticky header
  const halfIndicator =
    game.status === GameStatus.FirstHalf ||
    game.status === GameStatus.InProgress
      ? '1H'
      : game.status === GameStatus.SecondHalf
        ? '2H'
        : game.status === GameStatus.Halftime
          ? 'HT'
          : game.status === GameStatus.Completed
            ? 'FT'
            : '';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <span>
            <span className="font-medium">Error:</span> {actionError}
          </span>
          <button
            onClick={() => setActionError(null)}
            className="ml-4 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
      )}

      {/* Game Header */}
      <GameHeader
        gameName={game.name || 'Game Details'}
        status={game.status}
        gameFormatName={game.format.name}
        durationMinutes={game.format.durationMinutes}
        statsTrackingLevel={game.statsTrackingLevel || StatsTrackingLevel.Full}
        isPaused={!!game.pausedAt}
        isConnected={isConnected}
        showGameMenu={showGameMenu}
        showResetConfirm={showResetConfirm}
        clearEventsOnReset={clearEventsOnReset}
        updatingGame={updatingGame}
        onToggleMenu={() => setShowGameMenu(!showGameMenu)}
        onCloseMenu={() => setShowGameMenu(false)}
        onTogglePause={handleTogglePause}
        onStatsTrackingChange={handleStatsTrackingChange}
        onShowResetConfirm={setShowResetConfirm}
        onClearEventsChange={setClearEventsOnReset}
        onResetGame={handleResetGame}
        // Reopen game (for completed games)
        showReopenConfirm={showReopenConfirm}
        reopeningGame={reopeningGame}
        onShowReopenConfirm={setShowReopenConfirm}
        onReopenGame={handleReopenGame}
        // Per-team stats tracking
        homeTeamName={homeTeam?.team.name}
        awayTeamName={awayTeam?.team.name}
        homeTeamStatsTrackingLevel={homeTeamData?.statsTrackingLevel}
        awayTeamStatsTrackingLevel={awayTeamData?.statsTrackingLevel}
        onTeamStatsTrackingChange={handleTeamStatsTrackingChange}
        updatingTeamStats={updatingGameTeam}
      />

      <StickyScoreBar
        status={game.status}
        elapsedSeconds={elapsedSeconds}
        isPaused={!!game.pausedAt}
        durationMinutes={game.format.durationMinutes}
        halfIndicator={halfIndicator}
        firstHalfEnd={game.firstHalfEnd}
        actualStart={game.actualStart}
        actualEnd={game.actualEnd}
        secondHalfStart={game.secondHalfStart}
        homeTeamName={homeTeam?.team.name || 'Home Team'}
        awayTeamName={awayTeam?.team.name || 'Away Team'}
        homeScore={homeScore}
        awayScore={awayScore}
        highlightedScore={highlightedScore}
        venue={game.venue}
        scheduledStart={game.scheduledStart}
        isActivePlay={isActivePlay}
        recordingGoal={recordingGoal}
        updatingGame={updatingGame}
        showEndGameConfirm={showEndGameConfirm}
        onStartFirstHalf={handleStartFirstHalf}
        onEndFirstHalf={handleEndFirstHalf}
        onStartSecondHalf={handleStartSecondHalf}
        onEndGame={handleEndGame}
        onShowEndGameConfirm={setShowEndGameConfirm}
        onGoalClick={handleGoalClick}
      />

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
                  playersPerTeam={game.format.playersPerTeam}
                  gameStatus={game.status}
                  currentPeriod={currentPeriod}
                  currentPeriodSeconds={currentPeriodSeconds}
                  onFormationChange={(formation, periodSecs) =>
                    handleFormationChange(homeTeam.id, formation, periodSecs)
                  }
                  onFieldPlayerClickForSub={handleFieldPlayerClickForSub}
                  hasBenchSelectionActive={panelBenchSelection !== null}
                  queuedPlayerIds={queuedPlayerIds}
                  selectedFieldPlayerId={selectedFieldPlayerId}
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
                  playersPerTeam={game.format.playersPerTeam}
                  gameStatus={game.status}
                  currentPeriod={currentPeriod}
                  currentPeriodSeconds={currentPeriodSeconds}
                  onFormationChange={(formation, periodSecs) =>
                    handleFormationChange(awayTeam.id, formation, periodSecs)
                  }
                  onFieldPlayerClickForSub={handleFieldPlayerClickForSub}
                  hasBenchSelectionActive={panelBenchSelection !== null}
                  queuedPlayerIds={queuedPlayerIds}
                  selectedFieldPlayerId={selectedFieldPlayerId}
                />
              )}
            </div>
          )}

          {/* Stats Tab - Game Summary and Playing Time */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Game Summary - shown for completed games */}
              {game.status === GameStatus.Completed && homeTeam && awayTeam && (
                <GameSummaryPresentation
                  homeTeam={{
                    id: homeTeam.id,
                    teamType: 'home',
                    team: {
                      id: homeTeam.team.id,
                      name: homeTeam.team.name,
                      homePrimaryColor: homeTeam.team.homePrimaryColor,
                    },
                    events: homeTeam.events?.map((e) => ({
                      id: e.id,
                      createdAt: e.createdAt,
                      period: e.period,
                      periodSecond: e.periodSecond,
                      playerId: e.playerId,
                      externalPlayerName: e.externalPlayerName,
                      externalPlayerNumber: e.externalPlayerNumber,
                      player: e.player,
                      eventType: e.eventType,
                      childEvents: e.childEvents,
                    })),
                  }}
                  awayTeam={{
                    id: awayTeam.id,
                    teamType: 'away',
                    team: {
                      id: awayTeam.team.id,
                      name: awayTeam.team.name,
                      homePrimaryColor: awayTeam.team.homePrimaryColor,
                    },
                    events: awayTeam.events?.map((e) => ({
                      id: e.id,
                      createdAt: e.createdAt,
                      period: e.period,
                      periodSecond: e.periodSecond,
                      playerId: e.playerId,
                      externalPlayerName: e.externalPlayerName,
                      externalPlayerNumber: e.externalPlayerNumber,
                      player: e.player,
                      eventType: e.eventType,
                      childEvents: e.childEvents,
                    })),
                  }}
                />
              )}

              {/* Player Statistics Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Player Statistics
                </h3>

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
                    teamName={homeTeam.team.name}
                    teamColor={homeTeam.team.homePrimaryColor || '#3B82F6'}
                    players={homeTeam.players || []}
                    elapsedSeconds={
                      isActivePlay ? syncedTime.periodSecond : undefined
                    }
                    isLoading={loading}
                  />
                )}
                {activeTeam === 'away' && awayTeam && (
                  <GameStats
                    teamName={awayTeam.team.name}
                    teamColor={awayTeam.team.homePrimaryColor || '#EF4444'}
                    players={awayTeam.players || []}
                    elapsedSeconds={
                      isActivePlay ? syncedTime.periodSecond : undefined
                    }
                    isLoading={loading}
                  />
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Match Events
                </h3>
                <button
                  type="button"
                  onClick={() => setShowManualGoalModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Goal
                </button>
              </div>
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
                    | 'starter_entry'
                    | 'formation_change'
                    | 'game_start'
                    | 'period_start'
                    | 'period_end'
                    | 'game_end';
                  periodSecond: number;
                  teamType: string;
                  teamName: string;
                  teamColor: string;
                  // Timing event-specific
                  period?: string | null;
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
                  // Formation change-specific
                  newFormation?: string | null;
                  // Period event child events (players entering/exiting)
                  childEvents?: ChildEventData[];
                };

                const matchEvents: MatchEvent[] = [];

                // Helper to process events for a team
                const processTeamEvents = (
                  gameTeam: typeof homeTeam,
                  teamType: 'home' | 'away',
                  defaultColor: string,
                ) => {
                  if (!gameTeam?.events) return;

                  // Track SUB_IN events we've already paired
                  const processedSubIns = new Set<string>();
                  // Track POSITION_SWAP events we've already paired
                  const processedSwaps = new Set<string>();
                  // Track child events of period events (should not be shown separately)
                  const periodChildEventIds = new Set<string>();

                  // First pass: collect all child event IDs from period and game end events
                  gameTeam.events.forEach((event) => {
                    if (
                      (event.eventType?.name === 'PERIOD_START' ||
                        event.eventType?.name === 'PERIOD_END') &&
                      event.childEvents
                    ) {
                      event.childEvents.forEach((child) => {
                        periodChildEventIds.add(child.id);
                      });
                    }
                  });

                  gameTeam.events.forEach((event) => {
                    // Skip events that are children of period events
                    if (periodChildEventIds.has(event.id)) {
                      return;
                    }
                    // Process GOAL events
                    if (event.eventType?.name === 'GOAL') {
                      const assistEvent = gameTeam.events?.find(
                        (e) =>
                          e.eventType?.name === 'ASSIST' &&
                          e.periodSecond === event.periodSecond,
                      );
                      matchEvents.push({
                        id: event.id,
                        createdAt: event.createdAt,
                        eventType: 'goal',
                        periodSecond: event.periodSecond,
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
                      const subInEvent = gameTeam.events?.find(
                        (e) =>
                          e.eventType?.name === 'SUBSTITUTION_IN' &&
                          e.periodSecond === event.periodSecond &&
                          !processedSubIns.has(e.id),
                      );

                      if (subInEvent) {
                        processedSubIns.add(subInEvent.id);
                      }

                      matchEvents.push({
                        id: event.id,
                        createdAt: event.createdAt,
                        eventType: 'substitution',
                        periodSecond: event.periodSecond,
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
                      const pairedSwap = gameTeam.events?.find(
                        (e) =>
                          e.eventType?.name === 'POSITION_SWAP' &&
                          e.id !== event.id &&
                          e.periodSecond === event.periodSecond &&
                          !processedSwaps.has(e.id),
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
                        periodSecond: event.periodSecond,
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

                    // Process SUBSTITUTION_IN events at second 0 (starters entering field)
                    // These are not paired with SUBSTITUTION_OUT events
                    if (
                      event.eventType?.name === 'SUBSTITUTION_IN' &&
                      event.periodSecond === 0 &&
                      !processedSubIns.has(event.id)
                    ) {
                      matchEvents.push({
                        id: event.id,
                        createdAt: event.createdAt,
                        eventType: 'starter_entry',
                        periodSecond: event.periodSecond,
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

                    // Process FORMATION_CHANGE events
                    if (event.eventType?.name === 'FORMATION_CHANGE') {
                      matchEvents.push({
                        id: event.id,
                        createdAt: event.createdAt,
                        eventType: 'formation_change',
                        periodSecond: event.periodSecond,
                        teamType,
                        teamName: gameTeam.team.name,
                        teamColor:
                          gameTeam.team.homePrimaryColor || defaultColor,
                        newFormation: event.formation,
                      });
                    }

                    // Note: GAME_START events are not displayed - PERIOD_START period 1 serves as the game start indicator

                    // Helper to build child event data from childEvents array
                    const buildChildEvents = (
                      children: typeof event.childEvents,
                    ): ChildEventData[] => {
                      if (!children) return [];
                      return children.map((child) => ({
                        id: child.id,
                        playerName:
                          child.externalPlayerName ||
                          (child.externalPlayerNumber
                            ? `#${child.externalPlayerNumber}`
                            : null) ||
                          (child.player
                            ? `${child.player.firstName || ''} ${child.player.lastName || ''}`.trim() ||
                              'Unknown'
                            : 'Unknown'),
                        position: (child as { position?: string }).position,
                      }));
                    };

                    // Process PERIOD_START events (show all - period 1 implies game started)
                    if (event.eventType?.name === 'PERIOD_START') {
                      matchEvents.push({
                        id: event.id,
                        createdAt: event.createdAt,
                        eventType: 'period_start',
                        periodSecond: event.periodSecond,
                        teamType,
                        teamName: gameTeam.team.name,
                        teamColor:
                          gameTeam.team.homePrimaryColor || defaultColor,
                        period: event.period,
                        childEvents: buildChildEvents(event.childEvents),
                      });
                    }

                    // Process PERIOD_END events
                    // For final period (determined by format.numberOfPeriods), this serves as the "game end" indicator
                    // (similar to how PERIOD_START period=1 serves as "game start")
                    if (event.eventType?.name === 'PERIOD_END') {
                      // Check if this is the final period using numberOfPeriods from game format
                      const numberOfPeriods = game.format?.numberOfPeriods ?? 2;
                      const isFinalPeriod =
                        event.period === String(numberOfPeriods);
                      matchEvents.push({
                        id: event.id,
                        createdAt: event.createdAt,
                        // Use 'game_end' type for final period to show "Full Time" label
                        eventType: isFinalPeriod ? 'game_end' : 'period_end',
                        periodSecond: event.periodSecond,
                        teamType,
                        teamName: gameTeam.team.name,
                        teamColor:
                          gameTeam.team.homePrimaryColor || defaultColor,
                        period: event.period,
                        childEvents: buildChildEvents(event.childEvents),
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
                    new Date(a.createdAt).getTime(),
                );

                // Helper to get player name from event data or team roster
                const getPlayerName = (
                  playerId?: string | null,
                  externalName?: string | null,
                  externalNumber?: string | null,
                  player?: PlayerInfo | null,
                  team?: typeof homeTeam,
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
                  // Priority 4: Fallback to game players lookup
                  if (playerId && team?.players) {
                    const gamePlayer = team.players.find(
                      (p) => p.playerId === playerId,
                    );
                    if (gamePlayer?.playerName) {
                      return gamePlayer.playerName;
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
                  _eventType: EventCardType,
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
                              team,
                            )
                          : undefined;

                      const assisterName =
                        event.eventType === 'goal' && event.assist
                          ? getPlayerName(
                              event.assist.playerId,
                              event.assist.externalPlayerName,
                              null,
                              event.assist.player,
                              team,
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
                              team,
                            )
                          : undefined;

                      const playerOutName =
                        event.eventType === 'substitution'
                          ? getPlayerName(
                              event.playerOut?.playerId,
                              event.playerOut?.externalPlayerName,
                              event.playerOut?.externalPlayerNumber,
                              event.playerOut?.player,
                              team,
                            )
                          : undefined;

                      const player1Name =
                        event.eventType === 'position_swap'
                          ? getPlayerName(
                              event.swapPlayer1?.playerId,
                              event.swapPlayer1?.externalPlayerName,
                              event.swapPlayer1?.externalPlayerNumber,
                              event.swapPlayer1?.player,
                              team,
                            )
                          : undefined;

                      const player2Name =
                        event.eventType === 'position_swap'
                          ? getPlayerName(
                              event.swapPlayer2?.playerId,
                              event.swapPlayer2?.externalPlayerName,
                              event.swapPlayer2?.externalPlayerNumber,
                              event.swapPlayer2?.player,
                              team,
                            )
                          : undefined;

                      return (
                        <EventCard
                          key={event.id}
                          id={event.id}
                          eventType={event.eventType}
                          periodSecond={event.periodSecond}
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
                          newFormation={event.newFormation}
                          period={event.period}
                          childEvents={event.childEvents}
                          onDeleteClick={handleDeleteClick}
                          onEdit={
                            event.eventType === 'goal'
                              ? () =>
                                  setEditGoalData({
                                    team: event.teamType as 'home' | 'away',
                                    goal: {
                                      id: event.id,
                                      period: event.period || '1',
                                      periodSecond: event.periodSecond,
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
                            event.eventType,
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
          onField={goalModalTeam === 'home' ? homeOnField : awayOnField}
          bench={goalModalTeam === 'home' ? homeBench : awayBench}
          period={currentPeriod}
          periodSecond={currentPeriodSeconds}
          onClose={() => setGoalModalTeam(null)}
          statsTrackingLevel={getEffectiveTrackingLevel(goalModalTeam)}
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
          onField={editGoalData.team === 'home' ? homeOnField : awayOnField}
          bench={editGoalData.team === 'home' ? homeBench : awayBench}
          period={editGoalData.goal.period}
          periodSecond={editGoalData.goal.periodSecond}
          onClose={() => setEditGoalData(null)}
          editGoal={editGoalData.goal}
          statsTrackingLevel={getEffectiveTrackingLevel(editGoalData.team)}
        />
      )}

      {/* Manual Goal Modal - Add missed goals at any time */}
      {showManualGoalModal && homeTeam && awayTeam && (
        <ManualGoalModal
          gameId={gameId!}
          homeTeam={{
            gameTeamId: homeTeam.id,
            teamId: homeTeam.team.id,
            teamName: homeTeam.team.name,
            teamColor: homeTeam.team.homePrimaryColor || '#3B82F6',
            teamType: 'home',
            onField: homeOnField,
            bench: homeBench,
            statsTrackingLevel: getEffectiveTrackingLevel('home'),
          }}
          awayTeam={{
            gameTeamId: awayTeam.id,
            teamId: awayTeam.team.id,
            teamName: awayTeam.team.name,
            teamColor: awayTeam.team.homePrimaryColor || '#EF4444',
            teamType: 'away',
            onField: awayOnField,
            bench: awayBench,
            statsTrackingLevel: getEffectiveTrackingLevel('away'),
          }}
          onClose={() => setShowManualGoalModal(false)}
        />
      )}

      {/* Inline Substitution Panel */}
      {isActivePlay && homeTeam && awayTeam && (
        <SubstitutionPanel
          gameTeamId={activeTeam === 'home' ? homeTeam.id : awayTeam.id}
          gameId={gameId!}
          teamName={
            activeTeam === 'home' ? homeTeam.team.name : awayTeam.team.name
          }
          teamColor={
            activeTeam === 'home'
              ? homeTeam.team.homePrimaryColor || '#3B82F6'
              : awayTeam.team.homePrimaryColor || '#EF4444'
          }
          onField={activeTeam === 'home' ? homeOnField : awayOnField}
          bench={activeTeam === 'home' ? homeBench : awayBench}
          period={currentPeriod}
          periodSecond={currentPeriodSeconds}
          gameEvents={
            (activeTeam === 'home' ? homeTeam.events : awayTeam.events)?.map(
              (e) => ({
                id: e.id,
                playerId: e.playerId,
                externalPlayerName: e.externalPlayerName,
                eventType: e.eventType,
                period: e.period ?? '1',
                periodSecond: e.periodSecond,
                childEvents: e.childEvents?.map((ce) => ({
                  playerId: ce.playerId,
                  externalPlayerName: ce.externalPlayerName,
                  eventType: ce.eventType,
                })),
              }),
            ) ?? []
          }
          externalFieldPlayerSelection={selectedFieldPlayerForSub}
          onExternalSelectionHandled={() => setSelectedFieldPlayerForSub(null)}
          onBenchSelectionChange={setPanelBenchSelection}
          externalFieldPlayerToReplace={fieldPlayerToReplaceForPanel}
          onExternalFieldPlayerToReplaceHandled={() =>
            setFieldPlayerToReplaceForPanel(null)
          }
          onQueuedPlayerIdsChange={setQueuedPlayerIds}
          onSelectedFieldPlayerChange={setSelectedFieldPlayerId}
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
        period={conflictData?.period}
        periodSecond={conflictData?.periodSecond || 0}
        conflictingEvents={conflictData?.conflictingEvents || []}
        isResolving={resolvingConflict}
        onResolve={handleResolveConflict}
        onClose={() => setConflictData(null)}
      />
    </div>
  );
};

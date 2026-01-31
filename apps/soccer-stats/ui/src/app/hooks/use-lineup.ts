import { useMutation, useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';

import {
  GetGameRosterDocument,
  GetGameByIdDocument,
  GetGameByIdQuery,
  AddPlayerToGameRosterDocument,
  RemoveFromLineupDocument,
  UpdatePlayerPositionDocument,
  SubstitutePlayerDocument,
  SetSecondHalfLineupDocument,
  BringPlayerOntoFieldDocument,
  StartPeriodDocument,
  EndPeriodDocument,
  RosterPlayer as GqlRosterPlayer,
} from '@garage/soccer-stats/graphql-codegen';

import { RECORD_POSITION_CHANGE } from '../services/games-graphql.service';

// Extract TeamPlayer type from query result
type GameTeamFromQuery = NonNullable<
  NonNullable<GetGameByIdQuery['game']['teams']>[number]
>;
type TeamPlayerFromQuery = NonNullable<
  NonNullable<GameTeamFromQuery['team']['roster']>[number]
>;

export interface UseLineupOptions {
  gameTeamId: string;
  gameId?: string;
}

export interface RosterPlayer {
  id: string;
  oduserId: string;
  jerseyNumber?: string | null;
  primaryPosition?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export function useLineup({ gameTeamId, gameId }: UseLineupOptions) {
  // Fetch roster data using optimized SQL window function query
  // Use cache-and-network to ensure fresh data after mutations
  // GameRoster is a computed result without an 'id' field, so cache normalization
  // doesn't work well - we need to always fetch to get accurate roster state
  const {
    data: rosterData,
    loading: rosterLoading,
    error: rosterError,
    refetch: refetchRoster,
  } = useQuery(GetGameRosterDocument, {
    variables: { gameTeamId },
    skip: !gameTeamId,
    fetchPolicy: 'cache-and-network',
  });

  // Fetch game data for roster (if gameId provided)
  const { data: gameData, loading: gameLoading } = useQuery(
    GetGameByIdDocument,
    {
      variables: { id: gameId! },
      skip: !gameId,
    },
  );

  // Helper to create refetchQueries function that handles undefined gameTeamId
  // Using a function ensures we get the current value at mutation time
  const getRefetchQueries = () =>
    gameTeamId
      ? [{ query: GetGameRosterDocument, variables: { gameTeamId } }]
      : [];

  // Mutations - all use awaitRefetchQueries to prevent race conditions
  // when multiple mutations are called in sequence
  const [addToGameRosterMutation, { loading: addingToGameRoster }] =
    useMutation(AddPlayerToGameRosterDocument, {
      refetchQueries: getRefetchQueries,
      awaitRefetchQueries: true,
    });

  const [removeFromLineupMutation, { loading: removing }] = useMutation(
    RemoveFromLineupDocument,
    {
      refetchQueries: getRefetchQueries,
      awaitRefetchQueries: true,
    },
  );

  const [updatePositionMutation, { loading: updatingPosition }] = useMutation(
    UpdatePlayerPositionDocument,
    {
      refetchQueries: getRefetchQueries,
      awaitRefetchQueries: true,
    },
  );

  const [substitutePlayerMutation, { loading: substituting }] = useMutation(
    SubstitutePlayerDocument,
    {
      refetchQueries: getRefetchQueries,
      awaitRefetchQueries: true,
    },
  );

  const [recordPositionChangeMutation, { loading: recordingPositionChange }] =
    useMutation(RECORD_POSITION_CHANGE, {
      refetchQueries: getRefetchQueries,
      awaitRefetchQueries: true,
    });

  const [setSecondHalfLineupMutation, { loading: settingSecondHalfLineup }] =
    useMutation(SetSecondHalfLineupDocument, {
      refetchQueries: getRefetchQueries,
      awaitRefetchQueries: true,
    });

  const [bringPlayerOntoFieldMutation, { loading: bringingOntoField }] =
    useMutation(BringPlayerOntoFieldDocument, {
      refetchQueries: getRefetchQueries,
      awaitRefetchQueries: true,
    });

  const [startPeriodMutation, { loading: startingPeriod }] = useMutation(
    StartPeriodDocument,
    {
      refetchQueries: getRefetchQueries,
      awaitRefetchQueries: true,
    },
  );

  const [endPeriodMutation, { loading: endingPeriod }] = useMutation(
    EndPeriodDocument,
    {
      refetchQueries: getRefetchQueries,
      awaitRefetchQueries: true,
    },
  );

  // Get the team roster from game data
  const teamRoster = useMemo((): RosterPlayer[] => {
    if (!gameData?.game?.teams) return [];

    const gameTeam = gameData.game.teams.find(
      (gt: GameTeamFromQuery) => gt.id === gameTeamId,
    );

    if (!gameTeam?.team?.roster) return [];

    return gameTeam.team.roster
      .filter(
        (tp: TeamPlayerFromQuery) =>
          tp.teamMember.isActive && !!tp.teamMember.user,
      )
      .map((tp: TeamPlayerFromQuery) => ({
        id: tp.id,
        oduserId: tp.teamMember.user.id,
        jerseyNumber: tp.jerseyNumber,
        primaryPosition: tp.primaryPosition,
        firstName: tp.teamMember.user.firstName,
        lastName: tp.teamMember.user.lastName,
        email: tp.teamMember.user.email,
      }));
  }, [gameData, gameTeamId]);

  // Get all players from the game roster
  const players = useMemo(
    () => rosterData?.gameRoster?.players ?? [],
    [rosterData],
  );

  // Derive on-field players (position != null)
  const onField = useMemo(
    () => players.filter((p) => p.position != null),
    [players],
  );

  // Derive bench players (position == null)
  const bench = useMemo(
    () => players.filter((p) => p.position == null),
    [players],
  );

  // Get players not yet assigned to game roster
  const availableRoster = useMemo((): RosterPlayer[] => {
    const assignedPlayerIds = new Set<string>();

    // Collect all assigned player IDs from the game roster
    players.forEach((player) => {
      if (player.playerId) {
        assignedPlayerIds.add(player.playerId);
      }
    });

    return teamRoster.filter(
      (player) => !assignedPlayerIds.has(player.oduserId),
    );
  }, [teamRoster, players]);

  // Action handlers with error logging
  // All mutations log errors for debugging while re-throwing for caller handling
  // addPlayerToGameRoster: Creates a GAME_ROSTER event
  // - With position: player is a planned starter
  // - Without position: player is on the bench
  const addPlayerToGameRoster = useCallback(
    async (params: {
      playerId?: string;
      externalPlayerName?: string;
      externalPlayerNumber?: string;
      position?: string;
    }) => {
      try {
        return await addToGameRosterMutation({
          variables: {
            input: {
              gameTeamId,
              playerId: params.playerId,
              externalPlayerName: params.externalPlayerName,
              externalPlayerNumber: params.externalPlayerNumber,
              position: params.position,
            },
          },
        });
      } catch (error) {
        console.error('[useLineup] addPlayerToGameRoster failed:', error);
        throw error;
      }
    },
    [gameTeamId, addToGameRosterMutation],
  );

  const removeFromLineup = useCallback(
    async (gameEventId: string) => {
      try {
        return await removeFromLineupMutation({
          variables: { gameEventId },
        });
      } catch (error) {
        console.error('[useLineup] removeFromLineup failed:', error);
        throw error;
      }
    },
    [removeFromLineupMutation],
  );

  const updatePosition = useCallback(
    async (gameEventId: string, position: string) => {
      try {
        return await updatePositionMutation({
          variables: { gameEventId, position },
        });
      } catch (error) {
        console.error('[useLineup] updatePosition failed:', error);
        throw error;
      }
    },
    [updatePositionMutation],
  );

  const substitutePlayer = useCallback(
    async (params: {
      playerOutEventId: string;
      playerInId?: string;
      externalPlayerInName?: string;
      externalPlayerInNumber?: string;
      period: string;
      periodSecond?: number;
    }) => {
      try {
        return await substitutePlayerMutation({
          variables: {
            input: {
              gameTeamId,
              playerOutEventId: params.playerOutEventId,
              playerInId: params.playerInId,
              externalPlayerInName: params.externalPlayerInName,
              externalPlayerInNumber: params.externalPlayerInNumber,
              period: params.period,
              periodSecond: params.periodSecond ?? 0,
            },
          },
        });
      } catch (error) {
        console.error('[useLineup] substitutePlayer failed:', error);
        throw error;
      }
    },
    [gameTeamId, substitutePlayerMutation],
  );

  const recordPositionChange = useCallback(
    async (params: {
      playerEventId: string;
      newPosition: string;
      period: string;
      periodSecond?: number;
      reason?: 'FORMATION_CHANGE' | 'TACTICAL' | 'OTHER';
    }) => {
      try {
        return await recordPositionChangeMutation({
          variables: {
            input: {
              gameTeamId,
              playerEventId: params.playerEventId,
              newPosition: params.newPosition,
              period: params.period,
              periodSecond: params.periodSecond ?? 0,
              reason: params.reason,
            },
          },
        });
      } catch (error) {
        console.error('[useLineup] recordPositionChange failed:', error);
        throw error;
      }
    },
    [gameTeamId, recordPositionChangeMutation],
  );

  // Set the second half lineup (subs everyone out/in with new positions at halftime)
  const setSecondHalfLineup = useCallback(
    async (
      lineup: Array<{
        playerId?: string;
        externalPlayerName?: string;
        externalPlayerNumber?: string;
        position: string;
      }>,
    ) => {
      try {
        return await setSecondHalfLineupMutation({
          variables: {
            input: {
              gameTeamId,
              lineup,
            },
          },
        });
      } catch (error) {
        console.error('[useLineup] setSecondHalfLineup failed:', error);
        throw error;
      }
    },
    [gameTeamId, setSecondHalfLineupMutation],
  );

  // Bring a player onto the field during a game (halftime or mid-game)
  const bringPlayerOntoField = useCallback(
    async (params: {
      playerId?: string;
      externalPlayerName?: string;
      externalPlayerNumber?: string;
      position: string;
      period: string;
      periodSecond?: number;
    }) => {
      try {
        return await bringPlayerOntoFieldMutation({
          variables: {
            input: {
              gameTeamId,
              playerId: params.playerId,
              externalPlayerName: params.externalPlayerName,
              externalPlayerNumber: params.externalPlayerNumber,
              position: params.position,
              period: params.period,
              periodSecond: params.periodSecond ?? 0,
            },
          },
        });
      } catch (error) {
        console.error('[useLineup] bringPlayerOntoField failed:', error);
        throw error;
      }
    },
    [gameTeamId, bringPlayerOntoFieldMutation],
  );

  // Start a period - creates PERIOD_START event with SUB_IN events as children
  const startPeriod = useCallback(
    async (params: {
      period: string;
      lineup: Array<{
        playerId?: string;
        externalPlayerName?: string;
        externalPlayerNumber?: string;
        position: string;
      }>;
      periodSecond?: number;
    }) => {
      try {
        return await startPeriodMutation({
          variables: {
            input: {
              gameTeamId,
              period: params.period,
              lineup: params.lineup,
              periodSecond: params.periodSecond ?? 0,
            },
          },
        });
      } catch (error) {
        console.error('[useLineup] startPeriod failed:', error);
        throw error;
      }
    },
    [gameTeamId, startPeriodMutation],
  );

  // End a period - creates PERIOD_END event with SUB_OUT events as children
  // Queries the database for current on-field players
  const endPeriod = useCallback(
    async (params: { period: string; periodSecond?: number }) => {
      try {
        return await endPeriodMutation({
          variables: {
            input: {
              gameTeamId,
              period: params.period,
              periodSecond: params.periodSecond,
            },
          },
        });
      } catch (error) {
        console.error('[useLineup] endPeriod failed:', error);
        throw error;
      }
    },
    [gameTeamId, endPeriodMutation],
  );

  return {
    // Data - simplified from 5 arrays to position-based derivation
    formation: rosterData?.gameRoster?.formation,
    players, // All players with current position state
    onField, // Derived: players.filter(p => p.position != null)
    bench, // Derived: players.filter(p => p.position == null)
    teamRoster,
    availableRoster,

    // Loading states
    loading: rosterLoading || gameLoading,
    mutating:
      addingToGameRoster ||
      removing ||
      updatingPosition ||
      substituting ||
      recordingPositionChange ||
      settingSecondHalfLineup ||
      bringingOntoField ||
      startingPeriod ||
      endingPeriod,

    // Error
    error: rosterError,

    // Actions
    addPlayerToGameRoster,
    removeFromLineup,
    updatePosition,
    substitutePlayer,
    recordPositionChange,
    setSecondHalfLineup,
    bringPlayerOntoField,
    startPeriod,
    endPeriod,
    refetchRoster,
  };
}

// Helper to get player display name
export function getPlayerDisplayName(player: GqlRosterPlayer): string {
  if (player.externalPlayerName) {
    const number = player.externalPlayerNumber
      ? `#${player.externalPlayerNumber} `
      : '';
    return `${number}${player.externalPlayerName}`;
  }
  if (player.playerName) {
    return player.playerName;
  }
  return 'Unknown Player';
}

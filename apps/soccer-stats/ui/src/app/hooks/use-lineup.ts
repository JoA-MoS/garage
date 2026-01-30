import { useMutation, useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';

import {
  GetGameLineupDocument,
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
  LineupPlayer,
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
  // Fetch lineup data
  // Use cache-and-network to ensure fresh data after mutations
  // GameLineup is a computed result without an 'id' field, so cache normalization
  // doesn't work well - we need to always fetch to get accurate lineup state
  const {
    data: lineupData,
    loading: lineupLoading,
    error: lineupError,
    refetch: refetchLineup,
  } = useQuery(GetGameLineupDocument, {
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

  // Mutations - all use awaitRefetchQueries to prevent race conditions
  // when multiple mutations are called in sequence
  const [addToGameRosterMutation, { loading: addingToGameRoster }] =
    useMutation(AddPlayerToGameRosterDocument, {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
      awaitRefetchQueries: true,
    });

  const [removeFromLineupMutation, { loading: removing }] = useMutation(
    RemoveFromLineupDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
      awaitRefetchQueries: true,
    },
  );

  const [updatePositionMutation, { loading: updatingPosition }] = useMutation(
    UpdatePlayerPositionDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
      awaitRefetchQueries: true,
    },
  );

  const [substitutePlayerMutation, { loading: substituting }] = useMutation(
    SubstitutePlayerDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
      awaitRefetchQueries: true,
    },
  );

  const [recordPositionChangeMutation, { loading: recordingPositionChange }] =
    useMutation(RECORD_POSITION_CHANGE, {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
      awaitRefetchQueries: true,
    });

  const [setSecondHalfLineupMutation, { loading: settingSecondHalfLineup }] =
    useMutation(SetSecondHalfLineupDocument, {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
      awaitRefetchQueries: true,
    });

  const [bringPlayerOntoFieldMutation, { loading: bringingOntoField }] =
    useMutation(BringPlayerOntoFieldDocument, {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
      awaitRefetchQueries: true,
    });

  const [startPeriodMutation, { loading: startingPeriod }] = useMutation(
    StartPeriodDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
      awaitRefetchQueries: true,
    },
  );

  const [endPeriodMutation, { loading: endingPeriod }] = useMutation(
    EndPeriodDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
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

  // Get players not yet assigned to lineup, bench, or currently on field
  const availableRoster = useMemo((): RosterPlayer[] => {
    const lineup = lineupData?.gameLineup;
    if (!lineup) return teamRoster;

    const assignedPlayerIds = new Set<string>();

    // Collect all assigned player IDs from starters, bench, AND currentOnField
    // currentOnField may contain players who came on via substitutions or period starts
    // and may not be in the original starters list
    [...lineup.starters, ...lineup.bench, ...lineup.currentOnField].forEach(
      (player) => {
        if (player.playerId) {
          assignedPlayerIds.add(player.playerId);
        }
      },
    );

    return teamRoster.filter(
      (player) => !assignedPlayerIds.has(player.oduserId),
    );
  }, [teamRoster, lineupData]);

  // Action handlers
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
      return addToGameRosterMutation({
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
    },
    [gameTeamId, addToGameRosterMutation],
  );

  const removeFromLineup = useCallback(
    async (gameEventId: string) => {
      return removeFromLineupMutation({
        variables: { gameEventId },
      });
    },
    [removeFromLineupMutation],
  );

  const updatePosition = useCallback(
    async (gameEventId: string, position: string) => {
      return updatePositionMutation({
        variables: { gameEventId, position },
      });
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
      return substitutePlayerMutation({
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
      return recordPositionChangeMutation({
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
      return setSecondHalfLineupMutation({
        variables: {
          input: {
            gameTeamId,
            lineup,
          },
        },
      });
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
      return bringPlayerOntoFieldMutation({
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
      return startPeriodMutation({
        variables: {
          input: {
            gameTeamId,
            period: params.period,
            lineup: params.lineup,
            periodSecond: params.periodSecond ?? 0,
          },
        },
      });
    },
    [gameTeamId, startPeriodMutation],
  );

  // End a period - creates PERIOD_END event with SUB_OUT events as children
  // Queries the database for current on-field players
  const endPeriod = useCallback(
    async (params: { period: string; periodSecond?: number }) => {
      return endPeriodMutation({
        variables: {
          input: {
            gameTeamId,
            period: params.period,
            periodSecond: params.periodSecond,
          },
        },
      });
    },
    [gameTeamId, endPeriodMutation],
  );

  return {
    // Data
    lineup: lineupData?.gameLineup,
    gameRoster: lineupData?.gameLineup?.gameRoster ?? [],
    starters: lineupData?.gameLineup?.starters ?? [],
    bench: lineupData?.gameLineup?.bench ?? [],
    currentOnField: lineupData?.gameLineup?.currentOnField ?? [],
    previousPeriodLineup: lineupData?.gameLineup?.previousPeriodLineup,
    formation: lineupData?.gameLineup?.formation,
    teamRoster,
    availableRoster,

    // Loading states
    loading: lineupLoading || gameLoading,
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
    error: lineupError,

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
    refetchLineup,
  };
}

// Helper to get player display name
export function getPlayerDisplayName(player: LineupPlayer): string {
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

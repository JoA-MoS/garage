import { useMutation, useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';

import {
  GetGameLineupDocument,
  GetGameByIdDocument,
  GetGameByIdQuery,
  AddPlayerToLineupDocument,
  AddPlayerToBenchDocument,
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
  NonNullable<GetGameByIdQuery['game']['gameTeams']>[number]
>;
type TeamPlayerFromQuery = NonNullable<
  NonNullable<GameTeamFromQuery['team']['teamPlayers']>[number]
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
  const {
    data: lineupData,
    loading: lineupLoading,
    error: lineupError,
    refetch: refetchLineup,
  } = useQuery(GetGameLineupDocument, {
    variables: { gameTeamId },
    skip: !gameTeamId,
  });

  // Fetch game data for roster (if gameId provided)
  const { data: gameData, loading: gameLoading } = useQuery(
    GetGameByIdDocument,
    {
      variables: { id: gameId! },
      skip: !gameId,
    },
  );

  // Mutations
  const [addToLineupMutation, { loading: addingToLineup }] = useMutation(
    AddPlayerToLineupDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    },
  );

  const [addToBenchMutation, { loading: addingToBench }] = useMutation(
    AddPlayerToBenchDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    },
  );

  const [removeFromLineupMutation, { loading: removing }] = useMutation(
    RemoveFromLineupDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    },
  );

  const [updatePositionMutation, { loading: updatingPosition }] = useMutation(
    UpdatePlayerPositionDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    },
  );

  const [substitutePlayerMutation, { loading: substituting }] = useMutation(
    SubstitutePlayerDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    },
  );

  const [recordPositionChangeMutation, { loading: recordingPositionChange }] =
    useMutation(RECORD_POSITION_CHANGE, {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    });

  const [setSecondHalfLineupMutation, { loading: settingSecondHalfLineup }] =
    useMutation(SetSecondHalfLineupDocument, {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    });

  const [bringPlayerOntoFieldMutation, { loading: bringingOntoField }] =
    useMutation(BringPlayerOntoFieldDocument, {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    });

  const [startPeriodMutation, { loading: startingPeriod }] = useMutation(
    StartPeriodDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    },
  );

  const [endPeriodMutation, { loading: endingPeriod }] = useMutation(
    EndPeriodDocument,
    {
      refetchQueries: [
        { query: GetGameLineupDocument, variables: { gameTeamId } },
      ],
    },
  );

  // Get the team roster from game data
  const teamRoster = useMemo((): RosterPlayer[] => {
    if (!gameData?.game?.gameTeams) return [];

    const gameTeam = gameData.game.gameTeams.find(
      (gt: GameTeamFromQuery) => gt.id === gameTeamId,
    );

    if (!gameTeam?.team?.teamPlayers) return [];

    return gameTeam.team.teamPlayers
      .filter((tp: TeamPlayerFromQuery) => tp.isActive && !!tp.user)
      .map((tp: TeamPlayerFromQuery) => ({
        id: tp.id,
        oduserId: tp.userId,
        jerseyNumber: tp.jerseyNumber,
        primaryPosition: tp.primaryPosition,
        firstName: tp.user.firstName,
        lastName: tp.user.lastName,
        email: tp.user.email,
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
  const addToLineup = useCallback(
    async (params: {
      playerId?: string;
      externalPlayerName?: string;
      externalPlayerNumber?: string;
      position: string;
    }) => {
      return addToLineupMutation({
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
    [gameTeamId, addToLineupMutation],
  );

  const addToBench = useCallback(
    async (params: {
      playerId?: string;
      externalPlayerName?: string;
      externalPlayerNumber?: string;
    }) => {
      return addToBenchMutation({
        variables: {
          input: {
            gameTeamId,
            playerId: params.playerId,
            externalPlayerName: params.externalPlayerName,
            externalPlayerNumber: params.externalPlayerNumber,
          },
        },
      });
    },
    [gameTeamId, addToBenchMutation],
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
      gameMinute: number;
      gameSecond?: number;
    }) => {
      return substitutePlayerMutation({
        variables: {
          input: {
            gameTeamId,
            playerOutEventId: params.playerOutEventId,
            playerInId: params.playerInId,
            externalPlayerInName: params.externalPlayerInName,
            externalPlayerInNumber: params.externalPlayerInNumber,
            gameMinute: params.gameMinute,
            gameSecond: params.gameSecond ?? 0,
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
      gameMinute: number;
      gameSecond?: number;
      reason?: 'FORMATION_CHANGE' | 'TACTICAL' | 'OTHER';
    }) => {
      return recordPositionChangeMutation({
        variables: {
          input: {
            gameTeamId,
            playerEventId: params.playerEventId,
            newPosition: params.newPosition,
            gameMinute: params.gameMinute,
            gameSecond: params.gameSecond ?? 0,
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
      gameMinute: number;
      gameSecond?: number;
    }) => {
      return bringPlayerOntoFieldMutation({
        variables: {
          input: {
            gameTeamId,
            playerId: params.playerId,
            externalPlayerName: params.externalPlayerName,
            externalPlayerNumber: params.externalPlayerNumber,
            position: params.position,
            gameMinute: params.gameMinute,
            gameSecond: params.gameSecond ?? 0,
          },
        },
      });
    },
    [gameTeamId, bringPlayerOntoFieldMutation],
  );

  // Start a period - creates PERIOD_START event with SUB_IN events as children
  const startPeriod = useCallback(
    async (params: {
      period: number;
      lineup: Array<{
        playerId?: string;
        externalPlayerName?: string;
        externalPlayerNumber?: string;
        position: string;
      }>;
      gameMinute?: number;
      gameSecond?: number;
    }) => {
      return startPeriodMutation({
        variables: {
          input: {
            gameTeamId,
            period: params.period,
            lineup: params.lineup,
            gameMinute: params.gameMinute,
            gameSecond: params.gameSecond,
          },
        },
      });
    },
    [gameTeamId, startPeriodMutation],
  );

  // End a period - creates PERIOD_END event with SUB_OUT events as children
  // Queries the database for current on-field players
  const endPeriod = useCallback(
    async (params: {
      period: number;
      gameMinute?: number;
      gameSecond?: number;
    }) => {
      return endPeriodMutation({
        variables: {
          input: {
            gameTeamId,
            period: params.period,
            gameMinute: params.gameMinute,
            gameSecond: params.gameSecond,
          },
        },
      });
    },
    [gameTeamId, endPeriodMutation],
  );

  return {
    // Data
    lineup: lineupData?.gameLineup,
    starters: lineupData?.gameLineup?.starters ?? [],
    bench: lineupData?.gameLineup?.bench ?? [],
    currentOnField: lineupData?.gameLineup?.currentOnField ?? [],
    formation: lineupData?.gameLineup?.formation,
    teamRoster,
    availableRoster,

    // Loading states
    loading: lineupLoading || gameLoading,
    mutating:
      addingToLineup ||
      addingToBench ||
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
    addToLineup,
    addToBench,
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

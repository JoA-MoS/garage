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
  LineupPlayer,
} from '@garage/soccer-stats/graphql-codegen';

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

  // Get players not yet assigned to lineup or bench
  const availableRoster = useMemo((): RosterPlayer[] => {
    const lineup = lineupData?.gameLineup;
    if (!lineup) return teamRoster;

    const assignedPlayerIds = new Set<string>();

    // Collect all assigned player IDs
    [...lineup.starters, ...lineup.bench].forEach((player) => {
      if (player.playerId) {
        assignedPlayerIds.add(player.playerId);
      }
    });

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
      substituting,

    // Error
    error: lineupError,

    // Actions
    addToLineup,
    addToBench,
    removeFromLineup,
    updatePosition,
    substitutePlayer,
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

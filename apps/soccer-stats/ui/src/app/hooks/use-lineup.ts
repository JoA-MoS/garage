import { useMutation, useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';

import {
  GetGameByIdDocument,
  GetGameByIdQuery,
  GetTeamByIdDocument,
  GetTeamByIdQuery,
  AddPlayerToGameRosterDocument,
  RemoveFromLineupDocument,
  UpdatePlayerPositionDocument,
  SubstitutePlayerDocument,
  SetSecondHalfLineupDocument,
  BringPlayerOntoFieldDocument,
  RemovePlayerFromFieldDocument,
  StartPeriodDocument,
  EndPeriodDocument,
  RosterPlayer as GqlRosterPlayer,
  PlayerNameDisplayFormat,
} from '@garage/soccer-stats/graphql-codegen';

import { RECORD_POSITION_CHANGE } from '../services/games-graphql.service';
import {
  addEventsToGameTeam,
  removeEventFromGameTeam,
} from '../services/game-event-cache';
import { formatPlayerName } from '../utils/format-player-name';
import { usePendingTeamEvents } from '../outbox/game-outbox-context';

import { useTeamRoster } from './use-live-game-state';

// Extract TeamPlayer type from team query result
type TeamPlayerFromQuery = NonNullable<
  NonNullable<GetTeamByIdQuery['team']>['roster']
>[number];

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
  // The game query carries every team's events. The on-field/bench roster is
  // derived from them on the client (useTeamRoster), so lineup mutations only
  // need to write the events they return into the cache - no roster refetch.
  const {
    data: gameData,
    loading: gameLoading,
    error: gameError,
    refetch: refetchGame,
  } = useQuery(GetGameByIdDocument, {
    variables: { id: gameId! },
    skip: !gameId,
  });

  const gameTeam = useMemo(
    () => gameData?.game?.teams?.find((gt) => gt.id === gameTeamId),
    [gameData, gameTeamId],
  );
  const pendingEvents = usePendingTeamEvents(gameTeamId);
  const roster = useTeamRoster(gameTeam, pendingEvents);

  // Get team ID from game data
  const teamId = useMemo(() => {
    return gameTeam?.team?.id ?? null;
  }, [gameTeam]);

  // Fetch team roster separately (only when we have team ID)
  const { data: teamData, loading: teamLoading } = useQuery(
    GetTeamByIdDocument,
    {
      variables: { id: teamId! },
      skip: !teamId,
    },
  );

  // Mutations. Each lineup action passes an `update` (see the callbacks below)
  // that writes the events it returns into the cache, so the derived roster
  // changes as soon as the response arrives.
  const [addToGameRosterMutation, { loading: addingToGameRoster }] =
    useMutation(AddPlayerToGameRosterDocument);
  const [removeFromLineupMutation, { loading: removing }] = useMutation(
    RemoveFromLineupDocument,
  );
  const [updatePositionMutation, { loading: updatingPosition }] = useMutation(
    UpdatePlayerPositionDocument,
  );
  const [substitutePlayerMutation, { loading: substituting }] = useMutation(
    SubstitutePlayerDocument,
  );
  const [recordPositionChangeMutation, { loading: recordingPositionChange }] =
    useMutation(RECORD_POSITION_CHANGE);
  const [setSecondHalfLineupMutation, { loading: settingSecondHalfLineup }] =
    useMutation(SetSecondHalfLineupDocument);
  const [bringPlayerOntoFieldMutation, { loading: bringingOntoField }] =
    useMutation(BringPlayerOntoFieldDocument);
  const [removePlayerFromFieldMutation, { loading: removingFromField }] =
    useMutation(RemovePlayerFromFieldDocument);
  const [startPeriodMutation, { loading: startingPeriod }] =
    useMutation(StartPeriodDocument);
  const [endPeriodMutation, { loading: endingPeriod }] =
    useMutation(EndPeriodDocument);

  // Get the team roster from team data (fetched separately for performance)
  const teamRoster = useMemo((): RosterPlayer[] => {
    if (!teamData?.team?.roster) return [];

    return teamData.team.roster
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
  }, [teamData]);

  // Get all players from the game roster
  const players = useMemo(() => roster?.players ?? [], [roster]);

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

  // Kept for callers that resync after a batch of changes. The roster is
  // derived from the cache now, so there's nothing to wait for: this refreshes
  // the game query (events, server-computed play time) in the background.
  const refetchRoster = useCallback(async () => {
    if (!gameId) return;
    refetchGame().catch((error) => {
      console.warn('[useLineup] background game refetch failed:', error);
    });
  }, [gameId, refetchGame]);

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
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, [
              data?.addPlayerToGameRoster,
            ]),
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
          update: (cache) =>
            removeEventFromGameTeam(cache, gameTeamId, gameEventId),
        });
      } catch (error) {
        console.error('[useLineup] removeFromLineup failed:', error);
        throw error;
      }
    },
    [gameTeamId, removeFromLineupMutation],
  );

  // position null moves the player to the bench
  const updatePosition = useCallback(
    async (gameEventId: string, position: string | null) => {
      try {
        return await updatePositionMutation({
          variables: { gameEventId, position },
          // Updates the event in place; Apollo normalizes the new position
          // into the cached event the roster derivation reads.
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
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, data?.substitutePlayer),
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
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, [
              data?.recordPositionChange,
            ]),
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
          update: (cache, { data }) =>
            addEventsToGameTeam(
              cache,
              gameTeamId,
              data?.setSecondHalfLineup?.events,
            ),
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
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, [
              data?.bringPlayerOntoField,
            ]),
        });
      } catch (error) {
        console.error('[useLineup] bringPlayerOntoField failed:', error);
        throw error;
      }
    },
    [gameTeamId, bringPlayerOntoFieldMutation],
  );

  // Remove a player from the field without replacement (injury, red card, tactical)
  const removePlayerFromField = useCallback(
    async (params: {
      playerEventId: string;
      period: string;
      periodSecond?: number;
    }) => {
      try {
        return await removePlayerFromFieldMutation({
          variables: {
            input: {
              gameTeamId,
              playerEventId: params.playerEventId,
              period: params.period,
              periodSecond: params.periodSecond ?? 0,
            },
          },
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, [
              data?.removePlayerFromField,
            ]),
        });
      } catch (error) {
        console.error('[useLineup] removePlayerFromField failed:', error);
        throw error;
      }
    },
    [gameTeamId, removePlayerFromFieldMutation],
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
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, [
              data?.startPeriod?.periodEvent,
              ...(data?.startPeriod?.substitutionEvents ?? []),
            ]),
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
          update: (cache, { data }) =>
            addEventsToGameTeam(cache, gameTeamId, [
              data?.endPeriod?.periodEvent,
              ...(data?.endPeriod?.substitutionEvents ?? []),
            ]),
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
    formation: roster?.formation,
    players, // All players with current position state
    onField, // Derived: players.filter(p => p.position != null)
    bench, // Derived: players.filter(p => p.position == null)
    teamRoster,
    availableRoster,

    // Loading states
    loading: (gameLoading && !gameData) || teamLoading,
    mutating:
      addingToGameRoster ||
      removing ||
      updatingPosition ||
      substituting ||
      recordingPositionChange ||
      settingSecondHalfLineup ||
      bringingOntoField ||
      removingFromField ||
      startingPeriod ||
      endingPeriod,

    // Error
    error: gameError,

    // Actions
    addPlayerToGameRoster,
    removeFromLineup,
    updatePosition,
    substitutePlayer,
    recordPositionChange,
    setSecondHalfLineup,
    bringPlayerOntoField,
    removePlayerFromField,
    startPeriod,
    endPeriod,
    refetchRoster,
  };
}

/**
 * Helper to get player display name. Prefers firstName/lastName (formatted
 * per the team's configured display format) so a team's format choice
 * actually takes effect; playerName is a server-computed "First Last"
 * fallback for rows that don't carry name parts, and externalPlayerName
 * (with a jersey-number prefix) takes priority for players with no linked
 * account, since they never have firstName/lastName to format.
 */
export function getPlayerDisplayName(
  player: GqlRosterPlayer,
  format: PlayerNameDisplayFormat = PlayerNameDisplayFormat.FirstLast,
): string {
  if (player.externalPlayerName) {
    const number = player.externalPlayerNumber
      ? `#${player.externalPlayerNumber} `
      : '';
    return `${number}${player.externalPlayerName}`;
  }
  if (player.firstName || player.lastName) {
    return formatPlayerName(
      { firstName: player.firstName, lastName: player.lastName },
      format,
    );
  }
  if (player.playerName) {
    return player.playerName;
  }
  return 'Unknown Player';
}

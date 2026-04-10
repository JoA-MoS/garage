import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@apollo/client/react';

import { PlayerStatsTable } from '@garage/soccer-stats/ui-components';
import type { PlayerStatRow } from '@garage/soccer-stats/ui-components';

import {
  GET_GAME_TEAM_STATS,
  type GetGameTeamStatsResponse,
} from '../services/team-stats-graphql.service';

/**
 * Page component for viewing stats for a specific game within the team context.
 * Accessed via /teams/:teamId/games/:gameTeamId/stats
 */
export const TeamGameStatsPage = () => {
  const { teamId, gameTeamId } = useParams<{
    teamId: string;
    gameTeamId: string;
  }>();
  const navigate = useNavigate();

  const handlePlayerClick = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  const { data, loading, error } = useQuery<GetGameTeamStatsResponse>(
    GET_GAME_TEAM_STATS,
    {
      variables: { gameTeamId: gameTeamId! },
      skip: !gameTeamId,
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    },
  );

  if (!gameTeamId) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error: No game team ID provided</div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading game statistics...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 text-center text-red-600">
        <div className="text-lg font-semibold">Error loading game stats</div>
        <div className="mt-2 text-sm">{error.message}</div>
      </div>
    );
  }

  const stats = data?.gameTeamStats;
  if (!stats) {
    return (
      <div className="p-4 text-center">
        <div className="text-lg">No statistics available for this game</div>
      </div>
    );
  }

  const playerStats: PlayerStatRow[] = stats.playerStats.map((p) => ({
    playerId: p.playerId ?? undefined,
    playerName: p.playerName ?? undefined,
    externalPlayerName: p.externalPlayerName ?? undefined,
    externalPlayerNumber: p.externalPlayerNumber ?? undefined,
    goals: p.goals,
    unassistedGoals: p.unassistedGoals,
    assists: p.assists,
    totalMinutes: p.totalMinutes,
    totalSeconds: p.totalSeconds,
    totalPlayTimeSeconds: p.totalPlayTimeSeconds,
    gamesPlayed: p.gamesPlayed,
  }));

  const scoreDisplay =
    stats.teamScore !== null &&
    stats.teamScore !== undefined &&
    stats.opponentScore !== null &&
    stats.opponentScore !== undefined
      ? `${stats.teamScore} - ${stats.opponentScore}`
      : null;

  const resultColors: Record<string, string> = {
    W: 'text-green-600',
    D: 'text-yellow-600',
    L: 'text-red-600',
  };

  const resultLabels: Record<string, string> = {
    W: 'Win',
    D: 'Draw',
    L: 'Loss',
  };

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Back button */}
      <button
        onClick={() => navigate(`/teams/${teamId}/stats`)}
        className="inline-flex items-center gap-1 text-sm text-blue-600 transition-colors lg:hover:text-blue-800"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Team Stats
      </button>

      {/* Game header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {stats.opponentName
                ? `vs ${stats.opponentName}`
                : stats.gameName || 'Game Stats'}
            </h2>
            {stats.gameDate && (
              <p className="mt-1 text-sm text-gray-500">
                {new Date(stats.gameDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {scoreDisplay && (
              <span className="text-3xl font-bold text-gray-900">
                {scoreDisplay}
              </span>
            )}
            {stats.result !== 'N/A' && (
              <span
                className={`text-lg font-semibold ${resultColors[stats.result] ?? 'text-gray-500'}`}
              >
                {resultLabels[stats.result] ?? stats.result}
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md bg-blue-50 p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalGoals}
            </div>
            <div className="text-xs text-gray-500">Goals</div>
          </div>
          <div className="rounded-md bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.totalAssists}
            </div>
            <div className="text-xs text-gray-500">Assists</div>
          </div>
          <div className="rounded-md bg-purple-50 p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {playerStats.length}
            </div>
            <div className="text-xs text-gray-500">Players</div>
          </div>
          <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-2xl font-bold text-gray-700">
              {stats.gameStatus}
            </div>
            <div className="text-xs text-gray-500">Status</div>
          </div>
        </div>
      </div>

      {/* Player stats table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3 sm:px-6">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            Player Performance
          </h3>
        </div>
        <PlayerStatsTable
          players={playerStats}
          showGamesPlayed={false}
          onPlayerClick={handlePlayerClick}
        />
      </div>

      {/* Link to full game view */}
      <div className="text-center">
        <button
          onClick={() => navigate(`/games/${stats.gameId}/stats`)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors lg:hover:bg-gray-50"
        >
          View Full Game
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

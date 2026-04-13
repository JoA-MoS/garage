import { useParams, useNavigate, Link } from 'react-router';
import { useQuery } from '@apollo/client/react';

import { toMinutesAndSeconds } from '@garage/soccer-stats/utils';

import {
  GET_PLAYER_CAREER_STATS,
  type GetPlayerCareerStatsResponse,
  type PlayerGameEntryData,
  type PlayerTeamStatsData,
} from '../services/player-profile-graphql.service';

function formatPlayTime(totalSeconds: number): string {
  if (totalSeconds === 0) return '-';
  if (totalSeconds < 60) return '<1m';
  const { minute: minutes } = toMinutesAndSeconds(totalSeconds);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

const resultColors: Record<string, string> = {
  W: 'text-green-600 bg-green-50',
  D: 'text-yellow-700 bg-yellow-50',
  L: 'text-red-600 bg-red-50',
};

function StatCard({
  value,
  label,
  color = 'text-gray-900',
}: {
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}

function TeamBreakdownTable({
  teamStats,
}: {
  teamStats: PlayerTeamStatsData[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Team
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              GP
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              G
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              A
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              UG
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {teamStats.map((team) => (
            <tr key={team.teamId} className="lg:hover:bg-gray-50">
              <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-900">
                <Link
                  to={`/teams/${team.teamId}/stats`}
                  className="text-blue-600 lg:hover:text-blue-800"
                >
                  {team.teamName}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
                {team.gamesPlayed}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-blue-600">
                {team.goals || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-green-600">
                {team.assists || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-blue-400">
                {team.unassistedGoals || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
                {formatPlayTime(team.totalPlayTimeSeconds)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GameHistoryTable({ games }: { games: PlayerGameEntryData[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Team
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Opponent
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Score
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Result
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              G
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              A
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {games.map((game) => {
            const scoreDisplay =
              game.teamScore !== null && game.teamScore !== undefined
                ? `${game.teamScore} - ${game.opponentScore ?? '?'}`
                : null;

            return (
              <tr key={game.gameTeamId} className="lg:hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
                  {game.gameDate
                    ? new Date(game.gameDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
                  <Link
                    to={`/teams/${game.teamId}/games/${game.gameTeamId}/stats`}
                    className="text-blue-600 lg:hover:text-blue-800"
                  >
                    {game.teamName}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
                  {game.opponentName ?? '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
                  {scoreDisplay ?? '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  {game.result !== 'N/A' ? (
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${resultColors[game.result] ?? 'text-gray-500'}`}
                    >
                      {game.result}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-blue-600">
                  {game.goals || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-green-600">
                  {game.assists || '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700">
                  {formatPlayTime(game.totalPlayTimeSeconds)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Player profile page showing career stats across all teams.
 * Accessed via /players/:playerId
 */
export const PlayerProfilePage = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery<GetPlayerCareerStatsResponse>(
    GET_PLAYER_CAREER_STATS,
    {
      variables: { playerId: playerId! },
      skip: !playerId,
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    },
  );

  if (!playerId) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error: No player ID provided</div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading player stats...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 text-center text-red-600">
        <div className="text-lg font-semibold">Error loading player stats</div>
        <div className="mt-2 text-sm">{error.message}</div>
      </div>
    );
  }

  const stats = data?.playerCareerStats;
  if (!stats) {
    return (
      <div className="p-4 text-center">
        <div className="text-lg">No statistics available for this player</div>
      </div>
    );
  }

  const showTeamBreakdown = stats.teamStats.length > 1;

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/players')}
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
        All Players
      </button>

      {/* Player header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {stats.playerName}
        </h1>
        {showTeamBreakdown && (
          <p className="mt-1 text-sm text-gray-500">
            {stats.teamStats.map((t) => t.teamName).join(' · ')}
          </p>
        )}
      </div>

      {/* Career stat highlights */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          value={stats.totalGamesPlayed}
          label="Games Played"
          color="text-gray-900"
        />
        <StatCard
          value={stats.totalGoals}
          label="Goals"
          color="text-blue-600"
        />
        <StatCard
          value={stats.totalAssists}
          label="Assists"
          color="text-green-600"
        />
        <StatCard
          value={stats.totalUnassistedGoals}
          label="Unassisted"
          color="text-blue-400"
        />
        <StatCard
          value={formatPlayTime(stats.totalPlayTimeSeconds)}
          label="Total Time"
          color="text-gray-700"
        />
        <StatCard
          value={formatPlayTime(
            stats.totalGamesPlayed > 0
              ? Math.round(stats.totalPlayTimeSeconds / stats.totalGamesPlayed)
              : 0,
          )}
          label="Avg Time/Game"
          color="text-gray-700"
        />
      </div>

      {/* Per-team breakdown — only shown when player has played for multiple teams */}
      {showTeamBreakdown && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
              By Team
            </h2>
          </div>
          <TeamBreakdownTable teamStats={stats.teamStats} />
        </div>
      )}

      {/* Game history */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
            Game History
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {stats.totalGamesPlayed} completed{' '}
            {stats.totalGamesPlayed === 1 ? 'game' : 'games'}
          </p>
        </div>
        {stats.gameHistory.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No game history available
          </div>
        ) : (
          <GameHistoryTable games={stats.gameHistory} />
        )}
      </div>
    </div>
  );
};

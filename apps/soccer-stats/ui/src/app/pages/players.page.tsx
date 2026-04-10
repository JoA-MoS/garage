import { Link } from 'react-router';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';

const GET_ALL_PLAYERS = gql`
  query GetAllPlayers {
    players {
      id
      firstName
      lastName
      email
    }
  }
`;

interface PlayerData {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

interface GetAllPlayersResponse {
  players: PlayerData[];
}

function getDisplayName(player: PlayerData): string {
  const name = `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim();
  return name || player.email;
}

function getInitials(player: PlayerData): string {
  const first = player.firstName?.[0] ?? '';
  const last = player.lastName?.[0] ?? '';
  return (first + last).toUpperCase() || player.email[0].toUpperCase();
}

/**
 * Global players list page — shows all players with links to their profile.
 * Accessed via /players
 */
export const PlayersPage = () => {
  const { data, loading, error } = useQuery<GetAllPlayersResponse>(
    GET_ALL_PLAYERS,
    { fetchPolicy: 'cache-and-network' },
  );

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading players...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 text-center text-red-600">
        <div className="text-lg font-semibold">Error loading players</div>
        <div className="mt-2 text-sm">{error.message}</div>
      </div>
    );
  }

  const players = data?.players ?? [];

  const sorted = [...players].sort((a, b) =>
    getDisplayName(a).localeCompare(getDisplayName(b)),
  );

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Players</h1>
        <span className="text-sm text-gray-500">{sorted.length} players</span>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500">
          No players found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((player) => (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors lg:hover:border-blue-300 lg:hover:bg-blue-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {getInitials(player)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">
                  {getDisplayName(player)}
                </div>
                {(player.firstName || player.lastName) && (
                  <div className="truncate text-xs text-gray-400">
                    {player.email}
                  </div>
                )}
              </div>
              <svg
                className="ml-auto h-4 w-4 shrink-0 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

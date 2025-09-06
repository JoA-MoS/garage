import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';

import {
  GET_PLAYERS,
  PlayersResponse,
} from '../services/players-graphql.service';
import { CreatePlayerSmart } from '../components/smart/create-player.smart';

/**
 * Players management page - shows all players and allows management
 */
export const PlayersPage = () => {
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const { data, loading, error } = useQuery<PlayersResponse>(GET_PLAYERS, {
    fetchPolicy: 'cache-first',
  });

  const handlePlayerCreated = () => {
    setShowCreatePlayer(false);
  };

  const handleCancelCreate = () => {
    setShowCreatePlayer(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-600 mt-2">
            Manage player profiles and statistics
          </p>
        </div>

        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-600 mt-2">
            Manage player profiles and statistics
          </p>
        </div>

        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Players
          </h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const players = data?.players || [];

  // Show create player form
  if (showCreatePlayer) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <CreatePlayerSmart
          onPlayerCreated={handlePlayerCreated}
          onCancel={handleCancelCreate}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Players</h1>
            <p className="text-gray-600 mt-2">
              Manage player profiles and statistics
            </p>
          </div>
          <button
            onClick={() => setShowCreatePlayer(true)}
            className="
              min-h-[44px] px-6 py-2 bg-green-600 text-white rounded-md
              hover:bg-green-700 
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              transition-colors duration-200
            "
          >
            Add Player
          </button>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Players Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Create your first player to get started with team management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowCreatePlayer(true)}
              className="
                min-h-[44px] px-6 py-2 bg-green-600 text-white rounded-md
                hover:bg-green-700 
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                transition-colors duration-200
              "
            >
              Create First Player
            </button>
            <Link
              to="/teams"
              className="
                min-h-[44px] px-6 py-2 bg-blue-600 text-white rounded-md 
                hover:bg-blue-700 transition-colors inline-flex items-center justify-center
              "
            >
              Manage Teams
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              All Players ({players.length})
            </h2>
            <Link
              to="/teams"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Manage Teams
            </Link>
          </div>

          <div
            className="
            grid grid-cols-1 gap-4
            sm:grid-cols-2 
            lg:grid-cols-3 
            xl:grid-cols-4
          "
          >
            {players.map((player) => (
              <div
                key={player.id}
                className="
                  border border-gray-200 rounded-lg p-4 
                  hover:shadow-md transition-shadow
                  bg-white
                "
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="
                    w-10 h-10 bg-blue-500 rounded-full 
                    flex items-center justify-center 
                    text-white font-semibold text-lg
                  "
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {player.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {player.position}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import { useQuery } from '@apollo/client/react';

import { GamesListSmart } from '../smart/games-list.smart';
import { GET_GAMES, GamesResponse } from '../../services/games-graphql.service';

/**
 * Layer 3: Composition Component for Games List
 * - Query orchestration using Apollo Client
 * - Handles loading, error, and data states
 * - Manages GraphQL query execution and caching
 * - Provides data to Smart component layer
 */

export const GamesListComposition = () => {
  const { data, loading, error, refetch } = useQuery<GamesResponse>(GET_GAMES, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    // Refetch games every 30 seconds to get latest updates
    pollInterval: 30000,
  });

  // Transform GraphQL error to user-friendly message
  const errorMessage = error
    ? `Failed to load games: ${error.message}`
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <GamesListSmart
        games={data?.games || []}
        loading={loading}
        error={errorMessage}
      />

      {/* Debug info in development */}
      {process.env['NODE_ENV'] === 'development' && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-gray-800 p-2 text-xs text-white">
          <div>Games: {data?.games?.length || 0}</div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          {error && <div>Error: {error.message}</div>}
          <button
            onClick={() => refetch()}
            className="mt-1 rounded bg-gray-600 px-2 py-1 text-xs hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

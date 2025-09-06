import { useParams } from 'react-router';
import { useQuery } from '@apollo/client/react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
} from '../services/teams-graphql.service';
import { mapServiceTeamToUITeam } from '../components/utils/data-mapping.utils';

/**
 * Page component for team statistics and analytics
 */
export const TeamStatsPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  const { data, loading, error, refetch } = useQuery<TeamResponse>(
    GET_TEAM_BY_ID,
    {
      variables: { id: teamId },
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      skip: !teamId,
    }
  );

  if (!teamId) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error: No team ID provided</div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading team statistics...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center text-red-600 p-4">
        <div className="text-lg font-semibold">Error loading team</div>
        <div className="text-sm mt-2">{error.message}</div>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const team = data?.team ? mapServiceTeamToUITeam(data.team) : null;

  if (!team) {
    return (
      <div className="text-center p-4">
        <div className="text-lg">Team not found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <span className="text-4xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Team Statistics
        </h3>
        <p className="text-gray-600 mb-6">
          Detailed statistics and analytics will be displayed here.
        </p>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Goals Scored</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Assists</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">0h</div>
            <div className="text-sm text-gray-600">Play Time</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">0</div>
            <div className="text-sm text-gray-600">Red Cards</div>
          </div>
        </div>

        {/* Additional Stats Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Game Performance
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Games Played:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wins:</span>
                <span className="font-medium text-green-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Draws:</span>
                <span className="font-medium text-yellow-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Losses:</span>
                <span className="font-medium text-red-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Win Rate:</span>
                <span className="font-medium">0%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Player Statistics
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Players:</span>
                <span className="font-medium">{team.playerCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Players:</span>
                <span className="font-medium">{team.playerCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top Scorer:</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top Assister:</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Most Minutes:</span>
                <span className="font-medium">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

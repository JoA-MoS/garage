import { useParams } from 'react-router';
import { useQuery } from '@apollo/client/react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
} from '../services/teams-graphql.service';

/**
 * Page component for team overview information
 */
export const TeamOverviewPage = () => {
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
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading team details...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 text-center text-red-600">
        <div className="text-lg font-semibold">Error loading team</div>
        <div className="mt-2 text-sm">{error.message}</div>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // TODO: Implement mapServiceTeamToUITeam when migrating to new architecture
  // For now, use data.team directly
  const team = data?.team || null;

  if (!team) {
    return (
      <div className="p-4 text-center">
        <div className="text-lg">Team not found</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Team Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{team.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {team.createdAt
                    ? new Date(team.createdAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono text-xs">{team.id}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Quick Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Players:</span>
                <span className="font-medium">
                  {
                    0 /* TODO: Calculate player count when migrating to new architecture */
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Games Played:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wins:</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Team Colors
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div
                  className="h-8 w-8 rounded border border-gray-300"
                  style={{ backgroundColor: team.homePrimaryColor }}
                />
                <div>
                  <div className="text-sm font-medium">Primary</div>
                  <div className="text-xs text-gray-600">
                    {team.homePrimaryColor}
                  </div>
                </div>
              </div>
              {team.homeSecondaryColor && (
                <div className="flex items-center space-x-3">
                  <div
                    className="h-8 w-8 rounded border border-gray-300"
                    style={{ backgroundColor: team.homeSecondaryColor }}
                  />
                  <div>
                    <div className="text-sm font-medium">Secondary</div>
                    <div className="text-xs text-gray-600">
                      {team.homeSecondaryColor}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500">
          <p>
            Use the navigation to manage players, view games, and analyze
            statistics.
          </p>
        </div>
      </div>
    </div>
  );
};

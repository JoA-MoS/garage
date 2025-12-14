import {
  useParams,
  useNavigate,
  useLocation,
  Link,
  Outlet,
} from 'react-router';
import { useQuery } from '@apollo/client/react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
} from '../../services/teams-graphql.service';

/**
 * Layout component that provides common navigation and header for team pages
 */
export const TeamLayout = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, loading, error } = useQuery<TeamResponse>(GET_TEAM_BY_ID, {
    variables: { id: teamId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !teamId,
  });

  if (!teamId) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error: No team ID provided</div>
      </div>
    );
  }

  // TODO: Implement mapServiceTeamToUITeam when migrating to new architecture
  // const team = data?.team ? mapServiceTeamToUITeam(data.team) : null;
  const team = data?.team || null;

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '🏠',
      path: `/teams/${teamId}/overview`,
    },
    {
      id: 'players',
      label: 'Players',
      icon: '👥',
      path: `/teams/${teamId}/players`,
    },
    { id: 'games', label: 'Games', icon: '⚽', path: `/teams/${teamId}/games` },
    {
      id: 'stats',
      label: 'Statistics',
      icon: '📊',
      path: `/teams/${teamId}/stats`,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: `/teams/${teamId}/settings`,
    },
  ];

  const currentTab = tabs.find((tab) => location.pathname === tab.path);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 rounded-lg bg-white shadow-lg">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teams')}
                className="flex items-center text-gray-600 transition-colors hover:text-gray-800"
              >
                <span className="mr-2 text-xl">←</span>
                <span className="text-sm font-medium">Back to Teams</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                disabled={loading}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? '⟳' : '🔄'} Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Team Info */}
        {team && (
          <div className="px-4 py-6 sm:px-6">
            <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0">
              <div
                className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: team.homePrimaryColor }}
              >
                {team.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-grow">
                <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  {team.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Created:</span>
                    <span>
                      {team.createdAt
                        ? new Date(team.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Primary Color:</span>
                    <div
                      className="h-4 w-4 rounded border border-gray-300"
                      style={{ backgroundColor: team.homePrimaryColor }}
                    />
                    <span>{team.homePrimaryColor}</span>
                  </div>
                  {team.homeSecondaryColor && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Secondary Color:</span>
                      <div
                        className="h-4 w-4 rounded border border-gray-300"
                        style={{ backgroundColor: team.homeSecondaryColor }}
                      />
                      <span>{team.homeSecondaryColor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 rounded-lg bg-white shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`
                  flex items-center space-x-2 whitespace-nowrap border-b-2 px-4 py-4 text-sm
                  font-medium transition-colors sm:px-6
                  ${
                    currentTab?.id === tab.id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <Outlet />
    </div>
  );
};

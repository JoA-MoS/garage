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
import { mapServiceTeamToUITeam } from '../utils/data-mapping.utils';

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

  const team = data?.team ? mapServiceTeamToUITeam(data.team) : null;

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
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teams')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span className="text-xl mr-2">←</span>
                <span className="text-sm font-medium">Back to Teams</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                disabled={loading}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {loading ? '⟳' : '🔄'} Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Team Info */}
        {team && (
          <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                style={{ backgroundColor: team.primaryColor }}
              >
                {team.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-grow">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
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
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: team.primaryColor }}
                    />
                    <span>{team.primaryColor}</span>
                  </div>
                  {team.secondaryColor && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Secondary Color:</span>
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: team.secondaryColor }}
                      />
                      <span>{team.secondaryColor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`
                  flex items-center space-x-2 px-4 sm:px-6 py-4 text-sm font-medium
                  border-b-2 transition-colors whitespace-nowrap
                  ${
                    currentTab?.id === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

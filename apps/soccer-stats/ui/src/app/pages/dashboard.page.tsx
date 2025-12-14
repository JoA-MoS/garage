import { Link } from 'react-router';

import { useUserProfile } from '../hooks/use-user-profile';

/**
 * Dashboard page - main landing page with game overview
 */
export const DashboardPage = () => {
  const { userDisplayName, isLoaded } = useUserProfile();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {userDisplayName}! ⚽
        </h1>
        <p className="text-blue-100">
          Ready to track some soccer stats? Let's get started!
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Soccer Stats Dashboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to="/game/new"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                Start New Game
              </Link>
              <Link
                to="/history"
                className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-center"
              >
                View Game History
              </Link>
            </div>
          </div>

          {/* Recent Games */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-4">
              Recent Games
            </h2>
            <div className="text-gray-600">
              <p className="text-sm">No recent games found.</p>
              <p className="text-sm mt-2">
                Start tracking your team's performance!
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-purple-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-purple-900 mb-4">
              Quick Stats
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total Games:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span>Wins:</span>
                <span className="font-medium text-green-600">0</span>
              </div>
              <div className="flex justify-between">
                <span>Losses:</span>
                <span className="font-medium text-red-600">0</span>
              </div>
              <div className="flex justify-between">
                <span>Draws:</span>
                <span className="font-medium text-yellow-600">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/players"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-medium text-gray-900">Players</h3>
          <p className="text-sm text-gray-600">Manage player profiles</p>
        </Link>

        <Link
          to="/teams"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-medium text-gray-900">Teams</h3>
          <p className="text-sm text-gray-600">Team management</p>
        </Link>

        <Link
          to="/analytics"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-medium text-gray-900">Analytics</h3>
          <p className="text-sm text-gray-600">Performance insights</p>
        </Link>

        <Link
          to="/settings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-3xl mb-2">⚙️</div>
          <h3 className="font-medium text-gray-900">Settings</h3>
          <p className="text-sm text-gray-600">App configuration</p>
        </Link>
      </div>
    </div>
  );
};

import { Link } from 'react-router';

/**
 * Dashboard page - main landing page with game overview
 */
export const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Soccer Stats Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              Quick Actions
            </h2>
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

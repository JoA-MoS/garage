import { Link } from 'react-router';

import { UITeam } from '../types/ui.types';

interface TeamDetailPresentationProps {
  team: UITeam;
  onEdit: () => void;
  onBack: () => void;
}

export const TeamDetailPresentation = ({
  team,
  onEdit,
  onBack,
}: TeamDetailPresentationProps) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: team.primaryColor }}
              >
                {team.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {team.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  {team.playerCount
                    ? `${team.playerCount} players`
                    : 'No players yet'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back to Teams
              </button>
              <button
                onClick={onEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Edit Team
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Team Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Team Name
                  </label>
                  <p className="mt-1 text-gray-900">{team.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Team Colors
                  </label>
                  <div className="mt-1 flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <div
                        className="w-8 h-8 rounded-full border border-gray-300"
                        style={{ backgroundColor: team.primaryColor }}
                        title="Primary Color"
                      />
                      <div
                        className="w-8 h-8 rounded-full border border-gray-300"
                        style={{ backgroundColor: team.secondaryColor }}
                        title="Secondary Color"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      Primary: {team.primaryColor} • Secondary:{' '}
                      {team.secondaryColor}
                    </div>
                  </div>
                </div>

                {team.logo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Team Logo
                    </label>
                    <div className="mt-1">
                      <img
                        src={team.logo}
                        alt={`${team.name} logo`}
                        className="w-16 h-16 object-contain rounded-md border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {team.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Created
                    </label>
                    <p className="mt-1 text-gray-900">
                      {new Date(team.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Team Actions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Team Management
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Link
                      to={`/teams/${team.id}/configure`}
                      className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Configure Formation
                    </Link>
                    <Link
                      to={`/teams/${team.id}/add-players`}
                      className="block w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    >
                      Add Players
                    </Link>
                    <button
                      onClick={onEdit}
                      className="block w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    >
                      Edit Team Info
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Next Steps</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Complete your team setup to start tracking games:
                  </p>
                  <ol className="text-sm text-blue-700 space-y-1">
                    <li>1. Configure your team formation</li>
                    <li>2. Add players to your roster</li>
                    <li>3. Start tracking games</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

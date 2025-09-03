import { UITeam } from '../types/ui.types';

interface TeamsListPresentationProps {
  teams: UITeam[];
  onCreateTeam: () => void;
  onEditTeam: (teamId: string) => void;
  onViewTeam: (teamId: string) => void;
}

export const TeamsListPresentation = ({
  teams,
  onCreateTeam,
  onEditTeam,
  onViewTeam,
}: TeamsListPresentationProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <button
          onClick={onCreateTeam}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Create Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Get started with your first team
            </h2>
            <p className="text-gray-600 mb-6">
              Follow these simple steps to set up your team and start tracking
              games:
            </p>

            <div className="space-y-4 text-left mb-6">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create your team</p>
                  <p className="text-gray-600 text-sm">
                    Set up basic team information like name and colors
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Configure formation
                  </p>
                  <p className="text-gray-600 text-sm">
                    Choose your preferred formation and position setup
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add players</p>
                  <p className="text-gray-600 text-sm">
                    Add your roster and assign positions
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onCreateTeam}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Create Your First Team
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: team.primaryColor }}
                >
                  {team.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {team.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {team.playerCount
                      ? `${team.playerCount} players`
                      : 'No players yet'}
                  </p>
                </div>
                {/* Action buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewTeam(team.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="View team details"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEditTeam(team.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Edit team"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: team.primaryColor }}
                    title="Primary Color"
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: team.secondaryColor }}
                    title="Secondary Color"
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {team.createdAt
                    ? new Date(team.createdAt).toLocaleDateString()
                    : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { Link } from 'react-router';

import { UITeam } from '../types/ui.types';

interface TeamsListPresentationProps {
  teams: UITeam[];
  loading?: boolean;
  onCreateTeam: () => void;
  onEditTeam: (teamId: string) => void;
}

const TeamCardSkeleton = () => (
  <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div className="mb-4 flex items-center space-x-3">
      <div className="h-12 w-12 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex space-x-2">
        <div className="h-4 w-4 rounded-full bg-gray-200" />
        <div className="h-4 w-4 rounded-full bg-gray-200" />
      </div>
      <div className="h-3 w-20 rounded bg-gray-200" />
    </div>
  </div>
);

export const TeamsListPresentation = ({
  teams,
  loading = false,
  onCreateTeam,
  onEditTeam,
}: TeamsListPresentationProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <button
          onClick={onCreateTeam}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Create Team
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <TeamCardSkeleton />
          <TeamCardSkeleton />
          <TeamCardSkeleton />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto max-w-md">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Get started with your first team
            </h2>
            <p className="mb-6 text-gray-600">
              Follow these simple steps to set up your team and start tracking
              games:
            </p>

            <div className="mb-6 space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create your team</p>
                  <p className="text-sm text-gray-600">
                    Set up basic team information like name and colors
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Configure formation
                  </p>
                  <p className="text-sm text-gray-600">
                    Choose your preferred formation and position setup
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add players</p>
                  <p className="text-sm text-gray-600">
                    Add your roster and assign positions
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onCreateTeam}
              className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Create Your First Team
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-center space-x-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-white"
                  style={{
                    backgroundColor:
                      team.homePrimaryColor || team.primaryColor || '#6b7280',
                  }}
                >
                  {team.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <Link
                    to={`/teams/${team.id}`}
                    className="text-lg font-semibold text-gray-900 transition-colors hover:text-blue-600"
                  >
                    {team.name}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {team.playerCount
                      ? `${team.playerCount} players`
                      : 'No players yet'}
                  </p>
                </div>
                {/* Action buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditTeam(team.id)}
                    className="rounded-md p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                    title="Edit team"
                  >
                    <svg
                      className="h-4 w-4"
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

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <div
                    className="h-4 w-4 rounded-full border border-gray-300"
                    style={{
                      backgroundColor:
                        team.homePrimaryColor || team.primaryColor || '#e5e7eb',
                    }}
                    title="Primary Color"
                  />
                  <div
                    className="h-4 w-4 rounded-full border border-gray-300"
                    style={{
                      backgroundColor:
                        team.homeSecondaryColor ||
                        team.secondaryColor ||
                        '#e5e7eb',
                    }}
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

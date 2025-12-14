import { TeamWithGames } from '../../services/teams-graphql.service';

interface TeamPlayersPresentationProps {
  team: TeamWithGames;
  onAddPlayers: () => void;
}

export const TeamPlayersPresentation = ({
  team,
  onAddPlayers,
}: TeamPlayersPresentationProps) => {
  // Note: The team from GraphQL doesn't include players directly.
  // We would need to add a proper relationship query or use teamPlayers
  // For now, let's show a placeholder that can be enhanced later

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {team.name} - Players
          </h2>
          <p className="text-gray-600 mt-1">
            Manage team roster and player assignments
          </p>
        </div>
        <button
          onClick={onAddPlayers}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Add Players
        </button>
      </div>

      {/* Team Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="font-medium text-gray-900">{team.name}</h3>
            {(team.homePrimaryColor || team.homeSecondaryColor) && (
              <p className="text-sm text-gray-600">
                Colors: {team.homePrimaryColor || 'N/A'} /{' '}
                {team.homeSecondaryColor || 'N/A'}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Created: {new Date(team.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Players Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Roster</h3>

        {/* Show actual players if they exist */}
        {team.playersWithJersey && team.playersWithJersey.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.playersWithJersey.map((player) => (
              <div
                key={player.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Jersey Number */}
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {player.jersey}
                    </div>
                    {/* Player Info */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {player.name}
                      </h4>
                      <p className="text-sm text-gray-500">{player.position}</p>
                      {!player.isActive && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                      </svg>
                    </button>
                    <button className="text-red-400 hover:text-red-600">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0V8a1 1 0 10-2 0v1zm4-1a1 1 0 100 2v1a1 1 0 100-2V8z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Show placeholder when no players */
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No players assigned
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by adding players to this team.
            </p>
            <div className="mt-6">
              <button
                onClick={onAddPlayers}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Add Players
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
          View Full Roster
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700">
          Create New Player
        </button>
      </div>
    </div>
  );
};

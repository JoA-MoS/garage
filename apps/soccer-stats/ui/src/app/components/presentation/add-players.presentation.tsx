import { TeamWithGames } from '../../services/teams-graphql.service';
import {
  Player,
  CreatePlayerInput,
} from '../../services/players-graphql.service';

interface AddPlayersPresentationProps {
  team: TeamWithGames;
  players: Player[];
  selectedPlayersWithJerseys: { playerId: string; jersey: number }[];
  playersLoading: boolean;
  createPlayerLoading: boolean;
  addPlayerLoading: boolean;
  createPlayerError?: string;
  addPlayerError?: string;
  onCreatePlayer: (playerData: CreatePlayerInput) => void;
  onPlayerSelection: (
    playerId: string,
    isSelected: boolean,
    jersey?: number
  ) => void;
  onJerseyChange?: (playerId: string, jersey: number) => void;
  onFinish: () => void;
  onBack: () => void;
  onSkip: () => void;
  isTabMode?: boolean;
}

export const AddPlayersPresentation = ({
  team,
  players,
  selectedPlayersWithJerseys,
  playersLoading,
  createPlayerLoading,
  addPlayerLoading,
  createPlayerError,
  addPlayerError,
  onCreatePlayer,
  onPlayerSelection,
  onJerseyChange,
  onFinish,
  onBack,
  onSkip,
  isTabMode = false,
}: AddPlayersPresentationProps) => {
  const isLoading = createPlayerLoading || addPlayerLoading;

  return (
    <div className={isTabMode ? '' : 'max-w-4xl mx-auto p-6'}>
      <div className={isTabMode ? '' : 'bg-white rounded-lg shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Add Players to {team.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Select existing players or create new ones for your team
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Step 3 of 3
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar - only show if not in tab mode */}
        {!isTabMode && (
          <div className="px-6 py-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">
                  Team Info
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-green-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">
                  Configuration
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-green-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">
                  Add Players
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={isTabMode ? 'space-y-6' : 'px-6 py-6'}>
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Add Players
            </h3>
            <p className="text-green-800 mb-4">
              Select players from the list below and assign jersey numbers.
            </p>
            <p className="text-sm text-green-600">
              Each player must have a unique jersey number for the team.
            </p>
          </div>

          {/* Player Selection */}
          {playersLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-gray-600">Loading players...</span>
            </div>
          ) : players.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-yellow-800 font-medium mb-2">
                No Players Available
              </h4>
              <p className="text-yellow-700 text-sm">
                There are no players in the system yet. You'll need to create
                players first.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">
                  Available Players ({players.length})
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {players.map((player) => {
                  const isSelected = selectedPlayersWithJerseys.some(
                    (selected) => selected.playerId === player.id
                  );
                  const selectedPlayer = selectedPlayersWithJerseys.find(
                    (selected) => selected.playerId === player.id
                  );
                  const jerseyNumber = selectedPlayer?.jersey || '';

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`player-${player.id}`}
                          checked={isSelected}
                          onChange={(e) =>
                            onPlayerSelection(
                              player.id,
                              e.target.checked,
                              jerseyNumber as number
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`player-${player.id}`}
                          className="ml-3 flex-1 cursor-pointer"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {player.name}
                          </div>
                          {player.position && (
                            <div className="text-xs text-gray-500">
                              Position: {player.position}
                            </div>
                          )}
                        </label>
                      </div>

                      {isSelected && (
                        <div className="ml-4 flex items-center">
                          <label
                            htmlFor={`jersey-${player.id}`}
                            className="text-xs text-gray-600 mr-2"
                          >
                            Jersey #:
                          </label>
                          <input
                            type="number"
                            id={`jersey-${player.id}`}
                            min="1"
                            max="99"
                            value={jerseyNumber}
                            onChange={(e) => {
                              const newJersey = parseInt(e.target.value) || 0;
                              if (onJerseyChange) {
                                onJerseyChange(player.id, newJersey);
                              }
                            }}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="##"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Messages */}
          {createPlayerError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="text-red-400">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Create Player Error
                  </h3>
                  <div className="mt-1 text-sm text-red-700">
                    {createPlayerError}
                  </div>
                </div>
              </div>
            </div>
          )}

          {addPlayerError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="text-red-400">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Add Player Error
                  </h3>
                  <div className="mt-1 text-sm text-red-700">
                    {addPlayerError}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div
            className={`flex items-center justify-between pt-6 mt-8 ${
              isTabMode ? '' : 'border-t border-gray-200'
            }`}
          >
            <button
              onClick={onBack}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isTabMode ? '← Previous' : '← Back to Configuration'}
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onSkip}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isTabMode ? 'Skip' : 'Skip for Now'}
              </button>
              <button
                onClick={onFinish}
                disabled={isLoading || selectedPlayersWithJerseys.length === 0}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addPlayerLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding Players...
                  </>
                ) : isTabMode ? (
                  `Complete (${selectedPlayersWithJerseys.length} selected)`
                ) : (
                  `Finish Setup (${selectedPlayersWithJerseys.length} selected)`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { TeamWithGames } from '../../services/teams-graphql.service';
import {
  Player,
  CreatePlayerInput,
} from '../../services/players-graphql.service';

interface AddPlayersPresentationProps {
  team: TeamWithGames;
  players: Player[];
  selectedPlayers: string[];
  playersLoading: boolean;
  createPlayerLoading: boolean;
  addPlayerLoading: boolean;
  createPlayerError?: string;
  addPlayerError?: string;
  onCreatePlayer: (playerData: CreatePlayerInput) => void;
  onPlayerSelection: (playerId: string, isSelected: boolean) => void;
  onFinish: () => void;
  onBack: () => void;
  onSkip: () => void;
  isTabMode?: boolean;
}

export const AddPlayersPresentation = ({
  team,
  players,
  selectedPlayers,
  playersLoading,
  createPlayerLoading,
  addPlayerLoading,
  createPlayerError,
  addPlayerError,
  onCreatePlayer,
  onPlayerSelection,
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
              Add players to your team or select from existing players.
            </p>
            <p className="text-sm text-green-600">
              This section will allow you to create new players or select
              existing ones for your team.
            </p>
          </div>

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
                disabled={isLoading || selectedPlayers.length === 0}
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
                  `Complete (${selectedPlayers.length} selected)`
                ) : (
                  `Finish Setup (${selectedPlayers.length} selected)`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

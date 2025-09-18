import { SelectedTeams } from '../smart/game-setup-wizard.smart';

interface GameReviewStepProps {
  selectedTeams: SelectedTeams;
  onStartGame: (gameData: Record<string, unknown>) => Promise<void>;
}

export const GameReviewStep = ({
  selectedTeams,
  onStartGame,
}: GameReviewStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Review & Start Game
        </h2>
        <p className="text-gray-600">
          Review your game setup and start the match
        </p>
      </div>

      {/* Game summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Game Summary</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-md">
            <span className="text-gray-600">Home Team:</span>
            <span className="font-medium text-gray-900">
              {selectedTeams.homeTeam?.name || 'Not selected'}
            </span>
          </div>

          <div className="flex items-center justify-center text-2xl font-bold text-gray-400">
            VS
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-md">
            <span className="text-gray-600">Away Team:</span>
            <span className="font-medium text-gray-900">
              {selectedTeams.awayTeam?.name || 'Not selected'}
            </span>
          </div>
        </div>
      </div>

      {/* Ready message */}
      <div className="text-center py-4">
        <p className="text-lg text-gray-700">
          <span role="img" aria-label="target">
            🎯
          </span>{' '}
          Ready to start your match!
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Click "Start Game" below to begin tracking events and statistics.
        </p>
      </div>
    </div>
  );
};

import { GameFormat, Game } from '../../services/games-graphql.service';
import { UITeam } from '../types/ui.types';

interface GameFormData {
  opponentTeamId: string;
  gameFormatId: string;
  duration: number;
  isHome: boolean;
}

interface TeamGamesPresentationProps {
  teamId: string;
  games: Game[];
  availableOpponents: UITeam[];
  gameFormats: GameFormat[];
  showCreateForm: boolean;
  gameForm: GameFormData;
  loading: boolean;
  createLoading: boolean;
  onCreateGame: () => void;
  onCancelCreate: () => void;
  onFormChange: (field: string, value: any) => void;
  onSubmitGame: () => void;
  onViewGame: (gameId: string) => void;
}

export const TeamGamesPresentation = ({
  teamId,
  games,
  availableOpponents,
  gameFormats,
  showCreateForm,
  gameForm,
  loading,
  createLoading,
  onCreateGame,
  onCancelCreate,
  onFormChange,
  onSubmitGame,
  onViewGame,
}: TeamGamesPresentationProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading games...</div>
      </div>
    );
  }

  const formatOptions = gameFormats
    .filter((format) => format.isActive)
    .map((format) => ({
      value: format.id,
      label: format.displayName,
    }));

  const getGameStatus = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return { text: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
      case 'IN_PROGRESS':
        return { text: 'Live', color: 'bg-green-100 text-green-800' };
      case 'PAUSED':
        return { text: 'Paused', color: 'bg-yellow-100 text-yellow-800' };
      case 'FINISHED':
        return { text: 'Finished', color: 'bg-gray-100 text-gray-800' };
      case 'CANCELLED':
        return { text: 'Cancelled', color: 'bg-red-100 text-red-800' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getOpponentTeam = (game: Game) => {
    return game.gameTeams.find((gt: any) => gt.team.id !== teamId)?.team;
  };

  const isHomeTeam = (game: Game) => {
    return (
      game.gameTeams.find((gt: any) => gt.team.id === teamId)?.isHome || false
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Games</h3>
        <button
          onClick={onCreateGame}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>⚽</span>
          <span>Create New Game</span>
        </button>
      </div>

      {/* Create Game Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Game</h3>

            <div className="space-y-4">
              {/* Opponent Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opponent Team
                </label>
                <select
                  value={gameForm.opponentTeamId}
                  onChange={(e) =>
                    onFormChange('opponentTeamId', e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select opponent...</option>
                  {availableOpponents.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Home/Away Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="venue"
                      checked={gameForm.isHome}
                      onChange={() => onFormChange('isHome', true)}
                      className="mr-2"
                    />
                    Home
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="venue"
                      checked={!gameForm.isHome}
                      onChange={() => onFormChange('isHome', false)}
                      className="mr-2"
                    />
                    Away
                  </label>
                </div>
              </div>

              {/* Game Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Game Format
                </label>
                <select
                  value={gameForm.gameFormatId}
                  onChange={(e) => onFormChange('gameFormatId', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select game format</option>
                  {formatOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={gameForm.duration}
                  onChange={(e) =>
                    onFormChange('duration', parseInt(e.target.value) || 90)
                  }
                  min="1"
                  max="120"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={onCancelCreate}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSubmitGame}
                disabled={!gameForm.opponentTeamId || createLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createLoading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Games List */}
      {games.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <span className="text-4xl">⚽</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Games Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first game to start tracking stats and managing lineups.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => {
            const opponent = getOpponentTeam(game);
            const isHome = isHomeTeam(game);
            const statusInfo = getGameStatus(game.status);

            return (
              <div
                key={game.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onViewGame(game.id)}
              >
                {/* Game Header */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                  >
                    {statusInfo.text}
                  </span>
                  <span className="text-sm text-gray-500">
                    {game.gameFormat?.displayName || 'Unknown Format'}
                  </span>
                </div>

                {/* Teams */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {isHome ? '🏠' : '✈️'}
                      </span>
                      <span className="text-sm">
                        {isHome ? 'vs' : 'at'} {opponent?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Game Info */}
                <div className="text-xs text-gray-500 space-y-1">
                  {game.startTime && (
                    <div>
                      Scheduled: {new Date(game.startTime).toLocaleString()}
                    </div>
                  )}
                  <div>
                    Created: {new Date(game.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewGame(game.id);
                    }}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {game.status === 'NOT_STARTED' ? 'Start Game' : 'View Game'}{' '}
                    →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

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
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading games...</div>
      </div>
    );
  }

  const formatOptions = gameFormats
    .filter((format) => (format as any).isActive !== false) // TODO: Fix when migrating to new architecture
    .map((format) => ({
      value: format.id,
      label: (format as any).displayName || format.name || 'Unknown Format', // TODO: Fix when migrating
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
    return game.gameTeams?.find((gt: any) => gt.team.id !== teamId)?.team;
  };

  const isHomeTeam = (game: Game) => {
    // TODO: Fix isHome property when migrating to new architecture
    const gameTeam = game.gameTeams?.find((gt: any) => gt.team.id === teamId);
    return (gameTeam as any)?.isHome || false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Games</h3>
        <button
          onClick={onCreateGame}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <span>⚽</span>
          <span>Create New Game</span>
        </button>
      </div>

      {/* Create Game Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Create New Game</h3>

            <div className="space-y-4">
              {/* Opponent Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Opponent Team
                </label>
                <select
                  value={gameForm.opponentTeamId}
                  onChange={(e) =>
                    onFormChange('opponentTeamId', e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Game Format
                </label>
                <select
                  value={gameForm.gameFormatId}
                  onChange={(e) => onFormChange('gameFormatId', e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={onCancelCreate}
                className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={onSubmitGame}
                disabled={!gameForm.opponentTeamId || createLoading}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createLoading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Games List */}
      {games.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-gray-500">
            <span className="text-4xl">⚽</span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            No Games Yet
          </h3>
          <p className="mb-6 text-gray-600">
            Create your first game to start tracking stats and managing lineups.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => {
            const opponent = getOpponentTeam(game);
            const isHome = isHomeTeam(game);
            const statusInfo = getGameStatus(
              (game as any).status || 'NOT_STARTED'
            ); // TODO: Fix when migrating

            return (
              <div
                key={game.id}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                onClick={() => onViewGame(game.id)}
              >
                {/* Game Header */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}
                  >
                    {statusInfo.text}
                  </span>
                  <span className="text-sm text-gray-500">
                    {(game.gameFormat as any)?.displayName ||
                      game.gameFormat?.name ||
                      'Unknown Format'}
                  </span>
                </div>

                {/* Teams */}
                <div className="mb-3 space-y-2">
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
                <div className="space-y-1 text-xs text-gray-500">
                  {(game as any).startTime && (
                    <div>
                      Scheduled:{' '}
                      {new Date((game as any).startTime).toLocaleString()}
                    </div>
                  )}
                  <div>
                    Created: {new Date(game.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewGame(game.id);
                    }}
                    className="w-full text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {(game as any).status === 'NOT_STARTED'
                      ? 'Start Game'
                      : 'View Game'}{' '}
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

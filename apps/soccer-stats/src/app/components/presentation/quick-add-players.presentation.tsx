import { Player } from '../../services/players-graphql.service';

interface QuickAddPlayersPresentationProps {
  players: Player[];
  selectedPlayersWithJerseys: { playerId: string; jersey: number }[];
  playersLoading: boolean;
  addPlayerLoading: boolean;
  playersError?: string;
  addPlayerError?: string;
  onPlayerSelection: (
    playerId: string,
    isSelected: boolean,
    jersey?: number
  ) => void;
  onJerseyChange: (playerId: string, jersey: number) => void;
  onAddPlayers: () => void;
  onClose: () => void;
}

export const QuickAddPlayersPresentation = ({
  players,
  selectedPlayersWithJerseys,
  playersLoading,
  addPlayerLoading,
  playersError,
  addPlayerError,
  onPlayerSelection,
  onJerseyChange,
  onAddPlayers,
  onClose,
}: QuickAddPlayersPresentationProps) => {
  const isLoading = playersLoading || addPlayerLoading;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Add Players to Team
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Error Messages */}
        {(playersError || addPlayerError) && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {playersError || addPlayerError}
          </div>
        )}

        {/* Loading State */}
        {playersLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading players...</span>
          </div>
        )}

        {/* Players List */}
        {!playersLoading && (
          <div className="mb-4">
            {players.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No players available. Create some players first.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
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
                        className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50 border-blue-300' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              onPlayerSelection(
                                player.id,
                                e.target.checked,
                                jerseyNumber as number
                              )
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={isLoading}
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {player.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {player.position}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center">
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
                                onJerseyChange(player.id, newJersey);
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
          </div>
        )}

        {/* Selected Count */}
        {selectedPlayersWithJerseys.length > 0 && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              {selectedPlayersWithJerseys.length} player
              {selectedPlayersWithJerseys.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onAddPlayers}
            disabled={isLoading || selectedPlayersWithJerseys.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addPlayerLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </div>
            ) : (
              `Add ${
                selectedPlayersWithJerseys.length > 0
                  ? selectedPlayersWithJerseys.length
                  : ''
              } Player${selectedPlayersWithJerseys.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import { memo } from 'react';

import type { UIPlayer } from '../../types';

export interface QuickAddPlayersProps {
  /** List of available players to select from */
  players: UIPlayer[];
  /** Currently selected players with their jersey numbers */
  selectedPlayersWithJerseys: { playerId: string; jersey: number }[];
  /** Whether players list is loading */
  playersLoading: boolean;
  /** Whether add operation is in progress */
  addPlayerLoading: boolean;
  /** Error message for players loading */
  playersError?: string;
  /** Error message for add operation */
  addPlayerError?: string;
  /** Callback when a player is selected/deselected */
  onPlayerSelection: (
    playerId: string,
    isSelected: boolean,
    jersey?: number,
  ) => void;
  /** Callback when jersey number changes */
  onJerseyChange: (playerId: string, jersey: number) => void;
  /** Callback to add selected players */
  onAddPlayers: () => void;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * QuickAddPlayers is a modal component for quickly selecting and adding
 * multiple players to a team with jersey number assignment.
 */
export const QuickAddPlayers = memo(function QuickAddPlayers({
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
}: QuickAddPlayersProps) {
  const isLoading = playersLoading || addPlayerLoading;

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative top-20 mx-auto w-11/12 max-w-md rounded-md border bg-white p-5 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Add Players to Team
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg
              className="h-6 w-6"
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
          <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
            {playersError || addPlayerError}
          </div>
        )}

        {/* Loading State */}
        {playersLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading players...</span>
          </div>
        )}

        {/* Players List */}
        {!playersLoading && (
          <div className="mb-4">
            {players.length === 0 ? (
              <p className="py-4 text-center text-gray-500">
                No players available. Create some players first.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {players.map((player) => {
                    const isSelected = selectedPlayersWithJerseys.some(
                      (selected) => selected.playerId === player.id,
                    );
                    const selectedPlayer = selectedPlayersWithJerseys.find(
                      (selected) => selected.playerId === player.id,
                    );
                    const jerseyNumber = selectedPlayer?.jersey || '';

                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 ${
                          isSelected ? 'border-blue-300 bg-blue-50' : ''
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
                                jerseyNumber as number,
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={isLoading}
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {player.name ||
                                `${player.firstName} ${player.lastName}`}
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
                              className="mr-2 text-xs text-gray-600"
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
                              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
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
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-2">
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
            className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onAddPlayers}
            disabled={isLoading || selectedPlayersWithJerseys.length === 0}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addPlayerLoading ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
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
});

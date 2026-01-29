import { useState } from 'react';
import { useMutation } from '@apollo/client/react';

import { LineupPlayer } from '@garage/soccer-stats/graphql-codegen';
import { fromPeriodSecond } from '@garage/soccer-stats/utils';

import {
  SWAP_POSITIONS,
  GET_GAME_BY_ID,
  GET_GAME_LINEUP,
} from '../../services/games-graphql.service';

interface PositionSwapModalProps {
  gameTeamId: string;
  gameId: string;
  teamName: string;
  teamColor: string;
  currentOnField: LineupPlayer[];
  period: string;
  periodSecond: number;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Get display name for a player
 */
function getPlayerDisplayName(player: LineupPlayer): string {
  if (player.playerName) {
    return player.playerName;
  }
  if (player.firstName || player.lastName) {
    return `${player.firstName || ''} ${player.lastName || ''}`.trim();
  }
  if (player.externalPlayerName) {
    return player.externalPlayerName;
  }
  return 'Unknown';
}

/**
 * Get jersey number display
 */
function getJerseyNumber(player: LineupPlayer): string | null {
  if (player.externalPlayerNumber) {
    return player.externalPlayerNumber;
  }
  return null;
}

export const PositionSwapModal = ({
  gameTeamId,
  gameId,
  teamName,
  teamColor,
  currentOnField,
  period,
  periodSecond,
  onClose,
  onSuccess,
}: PositionSwapModalProps) => {
  const [player1EventId, setPlayer1EventId] = useState('');
  const [player2EventId, setPlayer2EventId] = useState('');

  const [swapPositions, { loading }] = useMutation(SWAP_POSITIONS, {
    refetchQueries: [
      { query: GET_GAME_BY_ID, variables: { id: gameId } },
      { query: GET_GAME_LINEUP, variables: { gameTeamId } },
    ],
  });

  // Get selected players for display
  const player1 = currentOnField.find((p) => p.gameEventId === player1EventId);
  const player2 = currentOnField.find((p) => p.gameEventId === player2EventId);

  const handleSubmit = async () => {
    if (!player1EventId || !player2EventId) return;

    try {
      await swapPositions({
        variables: {
          input: {
            gameTeamId,
            player1EventId,
            player2EventId,
            period,
            periodSecond,
          },
        },
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to swap positions:', err);
    }
  };

  const handlePlayerClick = (eventId: string) => {
    if (!player1EventId) {
      setPlayer1EventId(eventId);
    } else if (player1EventId === eventId) {
      // Deselect player 1
      setPlayer1EventId('');
    } else if (!player2EventId) {
      setPlayer2EventId(eventId);
    } else if (player2EventId === eventId) {
      // Deselect player 2
      setPlayer2EventId('');
    } else {
      // Both selected, replace player 2
      setPlayer2EventId(eventId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: teamColor, color: '#fff' }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Swap Positions
            </h3>
            <p className="text-sm text-gray-500">
              {teamName} &bull; Period {period}{' '}
              {(() => {
                const { minute, second } = fromPeriodSecond(periodSecond);
                return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
              })()}
            </p>
          </div>
        </div>

        {/* Selected Players Preview */}
        {(player1 || player2) && (
          <div className="mb-4 rounded-lg bg-blue-50 p-3">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                {player1 ? (
                  <>
                    <div className="font-medium text-gray-900">
                      {getPlayerDisplayName(player1)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {player1.position || 'No position'}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400">Select player 1</div>
                )}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <div className="text-center">
                {player2 ? (
                  <>
                    <div className="font-medium text-gray-900">
                      {getPlayerDisplayName(player2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {player2.position || 'No position'}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400">Select player 2</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <p className="mb-3 text-sm text-gray-600">
          Select two players on the field to swap their positions.
        </p>

        {/* Player Selection */}
        <div>
          {currentOnField.length < 2 ? (
            <p className="text-sm italic text-gray-500">
              Need at least 2 players on field to swap
            </p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {currentOnField.map((player) => {
                const eventId = player.gameEventId;
                const jersey = getJerseyNumber(player);
                const name = getPlayerDisplayName(player);
                const isPlayer1 = player1EventId === eventId;
                const isPlayer2 = player2EventId === eventId;
                const isSelected = isPlayer1 || isPlayer2;

                return (
                  <button
                    key={eventId}
                    type="button"
                    onClick={() => handlePlayerClick(eventId)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isPlayer1
                        ? 'border-blue-500 bg-blue-50'
                        : isPlayer2
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {jersey && (
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          isPlayer1
                            ? 'bg-blue-200 text-blue-700'
                            : isPlayer2
                              ? 'bg-purple-200 text-purple-700'
                              : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {jersey}
                      </span>
                    )}
                    <div className="flex-1 text-left">
                      <span
                        className={`font-medium ${
                          isPlayer1
                            ? 'text-blue-700'
                            : isPlayer2
                              ? 'text-purple-700'
                              : 'text-gray-900'
                        }`}
                      >
                        {name}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {player.position || 'No position'}
                      </span>
                    </div>
                    {isSelected && (
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                          isPlayer1 ? 'bg-blue-500' : 'bg-purple-500'
                        }`}
                      >
                        {isPlayer1 ? '1' : '2'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!player1EventId || !player2EventId || loading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? 'Swapping...' : 'Swap Positions'}
          </button>
        </div>
      </div>
    </div>
  );
};

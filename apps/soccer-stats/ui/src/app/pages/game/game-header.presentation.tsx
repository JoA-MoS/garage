import {
  GameStatus,
  StatsTrackingLevel,
} from '@garage/soccer-stats/graphql-codegen';

import { StatsTrackingSelector } from '../../components/presentation/stats-tracking-selector.presentation';

export interface GameHeaderProps {
  gameName: string;
  status: GameStatus;
  gameFormatName: string;
  durationMinutes: number;
  statsTrackingLevel: StatsTrackingLevel;
  isPaused: boolean;
  isConnected: boolean;
  showGameMenu: boolean;
  showResetConfirm: boolean;
  clearEventsOnReset: boolean;
  updatingGame: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onTogglePause: () => void;
  onStatsTrackingChange: (level: StatsTrackingLevel) => void;
  onShowResetConfirm: (show: boolean) => void;
  onClearEventsChange: (clear: boolean) => void;
  onResetGame: () => void;
}

/**
 * Game Header - displays game title, status badge, live indicator, and dropdown menu.
 */
export function GameHeader({
  gameName,
  status,
  gameFormatName,
  durationMinutes,
  statsTrackingLevel,
  isPaused,
  isConnected,
  showGameMenu,
  showResetConfirm,
  clearEventsOnReset,
  updatingGame,
  onToggleMenu,
  onCloseMenu,
  onTogglePause,
  onStatsTrackingChange,
  onShowResetConfirm,
  onClearEventsChange,
  onResetGame,
}: GameHeaderProps) {
  const isActivePlay =
    status === GameStatus.FirstHalf ||
    status === GameStatus.SecondHalf ||
    status === GameStatus.InProgress;

  const getStatusBadgeClass = () => {
    if (status === GameStatus.Scheduled) return 'bg-gray-100 text-gray-800';
    if (isActivePlay) return 'bg-green-100 text-green-800';
    if (status === GameStatus.Halftime) return 'bg-yellow-100 text-yellow-800';
    if (status === GameStatus.Completed) return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = () => {
    if (status === GameStatus.FirstHalf || status === GameStatus.InProgress)
      return '1ST HALF';
    if (status === GameStatus.SecondHalf) return '2ND HALF';
    if (status === GameStatus.Halftime) return 'HALF TIME';
    return status.replace('_', ' ');
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {gameName || 'Game Details'}
          </h1>
          {/* Real-time sync indicator */}
          {isConnected && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
              title="Real-time sync active"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Live
            </span>
          )}
          {/* Status Badge */}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass()}`}
          >
            {isActivePlay && (
              <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-green-500" />
            )}
            {getStatusText()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            {gameFormatName} ({durationMinutes} min)
          </div>
          {/* Three-dot menu */}
          <div className="relative">
            <button
              onClick={onToggleMenu}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              type="button"
              title="Game options"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showGameMenu && (
              <>
                {/* Backdrop to close menu */}
                <div className="fixed inset-0 z-10" onClick={onCloseMenu} />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {/* Pause/Resume - only during active play */}
                  {isActivePlay && (
                    <button
                      onClick={onTogglePause}
                      disabled={updatingGame}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      type="button"
                    >
                      {isPaused ? (
                        <>
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Resume Clock
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Pause Clock
                        </>
                      )}
                    </button>
                  )}

                  {/* Stats Tracking Level */}
                  <div className="border-t border-gray-100 py-2">
                    <StatsTrackingSelector
                      value={statsTrackingLevel}
                      onChange={onStatsTrackingChange}
                      variant="compact"
                      disabled={updatingGame}
                      label="Stats Tracking"
                    />
                  </div>

                  {/* Reset Game */}
                  {!showResetConfirm ? (
                    <button
                      onClick={() => onShowResetConfirm(true)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      type="button"
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Reset Game
                    </button>
                  ) : (
                    <div className="space-y-2 px-4 py-2">
                      <p className="text-xs font-medium text-red-600">
                        Reset to scheduled?
                      </p>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={clearEventsOnReset}
                          onChange={(e) =>
                            onClearEventsChange(e.target.checked)
                          }
                          className="h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-xs text-gray-600">
                          Also clear all events
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={onResetGame}
                          disabled={updatingGame}
                          className="flex-1 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          type="button"
                        >
                          {updatingGame ? '...' : 'Reset'}
                        </button>
                        <button
                          onClick={() => {
                            onShowResetConfirm(false);
                            onClearEventsChange(false);
                          }}
                          className="flex-1 rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

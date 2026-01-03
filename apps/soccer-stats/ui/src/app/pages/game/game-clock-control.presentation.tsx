import { GameStatus } from '../../generated/graphql';

import { formatGameTime } from './game-utils';

export interface GameClockControlProps {
  status: GameStatus;
  elapsedSeconds: number;
  isPaused: boolean;
  updatingGame: boolean;
  showEndGameConfirm: boolean;
  firstHalfEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  secondHalfStart?: string | null;
  durationMinutes: number;
  onStartFirstHalf: () => void;
  onEndFirstHalf: () => void;
  onStartSecondHalf: () => void;
  onEndGame: () => void;
  onShowEndGameConfirm: (show: boolean) => void;
}

/**
 * Game Clock Control - displays the appropriate clock and control buttons based on game status.
 * This component is hidden when the sticky header is shown.
 */
export function GameClockControl({
  status,
  elapsedSeconds,
  isPaused,
  updatingGame,
  showEndGameConfirm,
  firstHalfEnd,
  actualStart,
  actualEnd,
  secondHalfStart,
  durationMinutes,
  onStartFirstHalf,
  onEndFirstHalf,
  onStartSecondHalf,
  onEndGame,
  onShowEndGameConfirm,
}: GameClockControlProps) {
  // Scheduled: Show Start 1st Half button
  if (status === GameStatus.Scheduled) {
    return (
      <div className="mb-6 flex justify-center">
        <button
          onClick={onStartFirstHalf}
          disabled={updatingGame}
          className="inline-flex items-center rounded-xl bg-green-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          {updatingGame ? (
            <>
              <span className="border-3 mr-3 h-6 w-6 animate-spin rounded-full border-white border-t-transparent" />
              Starting...
            </>
          ) : (
            <>
              <svg
                className="mr-3 h-6 w-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Start 1st Half
            </>
          )}
        </button>
      </div>
    );
  }

  // First Half / In Progress: Show clock and Half Time button
  if (status === GameStatus.FirstHalf || status === GameStatus.InProgress) {
    return (
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          1st Half
        </div>
        <div
          className={`font-mono text-6xl font-bold tabular-nums ${
            isPaused ? 'text-yellow-600' : 'text-gray-900'
          }`}
        >
          {formatGameTime(elapsedSeconds)}
        </div>
        {isPaused && (
          <div className="flex animate-pulse items-center gap-2 text-sm font-medium text-yellow-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            PAUSED
          </div>
        )}
        <button
          onClick={onEndFirstHalf}
          disabled={updatingGame}
          className="inline-flex items-center rounded-lg bg-yellow-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          {updatingGame ? 'Ending half...' : 'Half Time'}
        </button>
      </div>
    );
  }

  // Halftime: Show HALF TIME text and Start 2nd Half button
  if (status === GameStatus.Halftime) {
    const firstHalfDuration =
      firstHalfEnd && actualStart
        ? Math.floor(
            (new Date(firstHalfEnd).getTime() -
              new Date(actualStart).getTime()) /
              1000
          )
        : (durationMinutes / 2) * 60;

    return (
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="font-mono text-4xl font-bold text-yellow-600">
          HALF TIME
        </div>
        <div className="text-sm text-gray-500">
          1st half ended at {formatGameTime(firstHalfDuration)}
        </div>
        <button
          onClick={onStartSecondHalf}
          disabled={updatingGame}
          className="inline-flex items-center rounded-xl bg-green-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          {updatingGame ? (
            <>
              <span className="border-3 mr-3 h-6 w-6 animate-spin rounded-full border-white border-t-transparent" />
              Starting...
            </>
          ) : (
            <>
              <svg
                className="mr-3 h-6 w-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Start 2nd Half
            </>
          )}
        </button>
      </div>
    );
  }

  // Second Half: Show clock and End Game button with confirmation
  if (status === GameStatus.SecondHalf) {
    return (
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          2nd Half
        </div>
        <div
          className={`font-mono text-6xl font-bold tabular-nums ${
            isPaused ? 'text-yellow-600' : 'text-gray-900'
          }`}
        >
          {formatGameTime(elapsedSeconds)}
        </div>
        {isPaused && (
          <div className="flex animate-pulse items-center gap-2 text-sm font-medium text-yellow-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            PAUSED
          </div>
        )}
        <div className="flex items-center gap-3">
          {!showEndGameConfirm ? (
            <button
              onClick={() => onShowEndGameConfirm(true)}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              type="button"
            >
              <svg
                className="mr-1.5 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              End Game
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
              <span className="text-sm font-medium text-red-700">
                End game?
              </span>
              <button
                onClick={onEndGame}
                disabled={updatingGame}
                className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                type="button"
              >
                {updatingGame ? 'Ending...' : 'Yes'}
              </button>
              <button
                onClick={() => onShowEndGameConfirm(false)}
                className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
                type="button"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Completed: Show FINAL text and duration
  if (status === GameStatus.Completed) {
    const gameDuration =
      actualEnd && actualStart
        ? Math.floor(
            (new Date(actualEnd).getTime() - new Date(actualStart).getTime()) /
              1000
          )
        : 0;

    return (
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="font-mono text-4xl font-bold text-gray-400">FINAL</div>
        {actualEnd && secondHalfStart && (
          <div className="text-sm text-gray-500">
            Duration: {formatGameTime(gameDuration)}
          </div>
        )}
      </div>
    );
  }

  return null;
}

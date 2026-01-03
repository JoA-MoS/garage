/**
 * StickyScoreHeader - Compact header that sticks to top when scrolling
 *
 * Displays a condensed view of the game score and clock when the main
 * header scrolls out of view. Provides quick access to goal recording
 * and allows tapping to scroll back to the top.
 */

interface StickyScoreHeaderProps {
  /** Whether the sticky header should be visible */
  isVisible: boolean;
  /** Home team name */
  homeTeamName: string;
  /** Away team name */
  awayTeamName: string;
  /** Home team score */
  homeScore: number;
  /** Away team score */
  awayScore: number;
  /** Formatted game time (MM:SS) */
  gameTime: string;
  /** Current half indicator (1H, 2H, HT, etc.) */
  halfIndicator: string;
  /** Whether game is paused */
  isPaused: boolean;
  /** Whether game is in active play (goals can be recorded) */
  isActivePlay: boolean;
  /** Whether a goal is currently being recorded */
  isRecordingGoal: boolean;
  /** Handler for home team goal button */
  onHomeGoal: () => void;
  /** Handler for away team goal button */
  onAwayGoal: () => void;
  /** Handler for clicking the header (scrolls to top) */
  onHeaderClick: () => void;
}

export function StickyScoreHeader({
  isVisible,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  gameTime,
  halfIndicator,
  isPaused,
  isActivePlay,
  isRecordingGoal,
  onHomeGoal,
  onAwayGoal,
  onHeaderClick,
}: StickyScoreHeaderProps) {
  // Truncate team names for compact display
  const truncateName = (name: string, maxLength = 10) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 1) + '...';
  };

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="border-b border-gray-200 bg-white/95 shadow-md backdrop-blur-sm">
        {/* Score Row - Tappable to scroll to top */}
        <button
          onClick={onHeaderClick}
          className="flex w-full items-center justify-between px-4 py-2"
          type="button"
          aria-label="Scroll to top"
        >
          {/* Home Team */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm font-medium text-gray-900">
              {truncateName(homeTeamName)}
            </span>
            <span className="text-xl font-bold text-blue-600">{homeScore}</span>
          </div>

          {/* Clock */}
          <div className="flex flex-col items-center px-3">
            <span
              className={`font-mono text-lg font-bold tabular-nums ${
                isPaused ? 'text-yellow-600' : 'text-gray-900'
              }`}
            >
              {gameTime}
            </span>
            <span className="text-xs font-medium text-gray-500">
              {halfIndicator}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <span className="text-xl font-bold text-red-600">{awayScore}</span>
            <span className="truncate text-sm font-medium text-gray-900">
              {truncateName(awayTeamName)}
            </span>
          </div>
        </button>

        {/* Goal Buttons Row - Only shown during active play */}
        {isActivePlay && (
          <div className="flex border-t border-gray-100 px-4 pb-2">
            {/* Home Goal Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHomeGoal();
              }}
              disabled={isRecordingGoal}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 active:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Goal
            </button>

            {/* Spacer */}
            <div className="w-3" />

            {/* Away Goal Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAwayGoal();
              }}
              disabled={isRecordingGoal}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 active:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

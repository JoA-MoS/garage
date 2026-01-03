import { formatGameTime } from './game-utils';

export interface TeamInfo {
  name: string;
  score: number;
  color: 'blue' | 'red';
}

export interface ScoreDisplayProps {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  isActivePlay: boolean;
  recordingGoal: boolean;
  elapsedSeconds: number;
  isPaused: boolean;
  halfIndicator: string;
  highlightedScore: 'home' | 'away' | null;
  onGoalClick: (team: 'home' | 'away') => void;
  onSubClick: (team: 'home' | 'away') => void;
}

/**
 * Score Display - Shows the home team, center VS/clock, and away team scores.
 * Uses CSS scroll-state queries to morph between expanded and compact layouts.
 * The .team-name, .team-score, and .score-action-buttons classes are targeted
 * by @container scroll-state(stuck: top) in styles.css.
 */
export function ScoreDisplay({
  homeTeam,
  awayTeam,
  isActivePlay,
  recordingGoal,
  elapsedSeconds,
  isPaused,
  halfIndicator,
  highlightedScore,
  onGoalClick,
  onSubClick,
}: ScoreDisplayProps) {
  return (
    <div className="grid grid-cols-3 items-center gap-4">
      {/* Home Team */}
      <div className="flex flex-col items-center text-center">
        <div className="team-name text-xl font-semibold text-gray-900">
          {homeTeam.name}
        </div>
        <div
          className={`team-score mt-2 text-5xl font-bold text-blue-600 ${
            highlightedScore === 'home' ? 'score-highlight' : ''
          }`}
        >
          {homeTeam.score}
        </div>
        {isActivePlay && (
          <div className="score-action-buttons mt-2 flex justify-center gap-2">
            <button
              onClick={() => onGoalClick('home')}
              disabled={recordingGoal}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            <button
              onClick={() => onSubClick('home')}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Sub
            </button>
          </div>
        )}
      </div>

      {/* Center: VS (expanded) and Clock (stuck) - CSS toggles visibility */}
      <div className="flex flex-col items-center justify-center text-center">
        {/* VS text - hidden when stuck via CSS */}
        <div className="center-vs text-2xl font-bold text-gray-400">VS</div>
        {/* Clock display - shown when stuck via CSS */}
        <div className="center-clock hidden flex-col items-center">
          <div
            className={`font-mono font-bold tabular-nums ${
              isPaused ? 'text-yellow-600' : 'text-gray-900'
            }`}
          >
            {formatGameTime(elapsedSeconds)}
          </div>
          <div className="text-xs font-medium text-gray-500">
            {halfIndicator}
          </div>
        </div>
      </div>

      {/* Away Team */}
      <div className="flex flex-col items-center text-center">
        <div className="team-name text-xl font-semibold text-gray-900">
          {awayTeam.name}
        </div>
        <div
          className={`team-score mt-2 text-5xl font-bold text-red-600 ${
            highlightedScore === 'away' ? 'score-highlight' : ''
          }`}
        >
          {awayTeam.score}
        </div>
        {isActivePlay && (
          <div className="score-action-buttons mt-2 flex justify-center gap-2">
            <button
              onClick={() => onGoalClick('away')}
              disabled={recordingGoal}
              className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            <button
              onClick={() => onSubClick('away')}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Sub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

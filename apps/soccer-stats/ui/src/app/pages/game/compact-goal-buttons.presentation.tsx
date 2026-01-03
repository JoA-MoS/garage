export interface CompactGoalButtonsProps {
  recordingGoal: boolean;
  onGoalClick: (team: 'home' | 'away') => void;
}

/**
 * Compact Goal Buttons - simplified goal buttons shown in sticky header during active play.
 * Hidden by default via Tailwind's 'hidden' class, shown when stuck via CSS scroll-state query.
 * The .compact-goal-buttons class is targeted by @container scroll-state(stuck: top) in styles.css.
 */
export function CompactGoalButtons({
  recordingGoal,
  onGoalClick,
}: CompactGoalButtonsProps) {
  return (
    <div className="compact-goal-buttons mt-2 hidden gap-3 border-t border-gray-100 pt-2">
      <button
        onClick={() => onGoalClick('home')}
        disabled={recordingGoal}
        className="flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 active:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
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
        onClick={() => onGoalClick('away')}
        disabled={recordingGoal}
        className="flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 active:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}

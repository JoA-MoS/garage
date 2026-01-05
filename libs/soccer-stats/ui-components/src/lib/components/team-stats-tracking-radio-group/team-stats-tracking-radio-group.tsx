import { UIStatsTrackingLevel } from '../../types';

const STATS_TRACKING_OPTIONS = [
  { value: UIStatsTrackingLevel.Full, label: 'Full Stats' },
  { value: UIStatsTrackingLevel.ScorerOnly, label: 'Scorer Only' },
  { value: UIStatsTrackingLevel.GoalsOnly, label: 'Goals Only' },
] as const;

export interface TeamStatsTrackingRadioGroupProps {
  /** Whether this is the home or away team (determines color scheme) */
  teamType: 'home' | 'away';
  /** Team display name */
  teamName: string;
  /** Current stats tracking level (null means use game default) */
  currentLevel: UIStatsTrackingLevel | null | undefined;
  /** Callback when a level is selected */
  onSelect: (level: UIStatsTrackingLevel | null) => void;
  /** Whether the control is disabled */
  disabled: boolean;
}

/**
 * Radio button group for selecting a team's stats tracking level override.
 * Displays "Use game default" option plus all StatsTrackingLevel options.
 * Uses blue styling for home team, red for away team.
 */
export function TeamStatsTrackingRadioGroup({
  teamType,
  teamName,
  currentLevel,
  onSelect,
  disabled,
}: TeamStatsTrackingRadioGroupProps) {
  const isHome = teamType === 'home';

  const titleClass = isHome ? 'text-blue-700' : 'text-red-700';
  const selectedBgClass = isHome
    ? 'bg-blue-100 text-blue-900'
    : 'bg-red-100 text-red-900';
  const selectedBorderClass = isHome
    ? 'border-blue-500 bg-blue-500'
    : 'border-red-500 bg-red-500';

  const isUsingDefault = !currentLevel;

  return (
    <div className={teamType === 'home' ? 'mb-3 px-3 sm:px-4' : 'px-3 sm:px-4'}>
      <div className={`mb-1 text-sm font-medium sm:text-base ${titleClass}`}>
        {teamName}
      </div>
      <div className="space-y-1 sm:space-y-1.5">
        {/* Use game default option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          disabled={disabled}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors sm:gap-2.5 sm:px-3 sm:py-2 sm:text-sm ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } ${isUsingDefault ? selectedBgClass : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <div
            className={`flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full border sm:h-4 sm:w-4 ${
              isUsingDefault ? selectedBorderClass : 'border-gray-300 bg-white'
            }`}
          >
            {isUsingDefault && (
              <div className="h-1 w-1 rounded-full bg-white sm:h-1.5 sm:w-1.5" />
            )}
          </div>
          <span>Use game default</span>
        </button>

        {/* Tracking level options */}
        {STATS_TRACKING_OPTIONS.map(({ value, label }) => {
          const isSelected = currentLevel === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              disabled={disabled}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors sm:gap-2.5 sm:px-3 sm:py-2 sm:text-sm ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              } ${isSelected ? selectedBgClass : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <div
                className={`flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full border sm:h-4 sm:w-4 ${
                  isSelected ? selectedBorderClass : 'border-gray-300 bg-white'
                }`}
              >
                {isSelected && (
                  <div className="h-1 w-1 rounded-full bg-white sm:h-1.5 sm:w-1.5" />
                )}
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

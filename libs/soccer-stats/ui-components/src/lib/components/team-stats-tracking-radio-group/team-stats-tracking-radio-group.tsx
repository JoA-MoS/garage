import { UIStatsFeatures, UI_DEFAULT_STATS_FEATURES } from '../../types';
import { StatsFeatureToggles } from '../stats-feature-toggles/stats-feature-toggles';

export interface TeamStatsTrackingRadioGroupProps {
  /** Whether this is the home or away team (determines color scheme) */
  teamType: 'home' | 'away';
  /** Team display name */
  teamName: string;
  /** Current stats feature flags (null means use game default) */
  currentFeatures: UIStatsFeatures | null | undefined;
  /** Callback when features change (null = use game default) */
  onSelect: (features: UIStatsFeatures | null) => void;
  /** Whether the control is disabled */
  disabled: boolean;
}

/**
 * Stats tracking override control for a single team within a game.
 * Shows "Use game default" option, plus inline feature toggles when override is active.
 * Uses blue styling for home team, red for away team.
 */
export function TeamStatsTrackingRadioGroup({
  teamType,
  teamName,
  currentFeatures,
  onSelect,
  disabled,
}: TeamStatsTrackingRadioGroupProps) {
  const isHome = teamType === 'home';
  const isUsingDefault = !currentFeatures;

  const titleClass = isHome ? 'text-blue-700' : 'text-red-700';
  const selectedBgClass = isHome
    ? 'bg-blue-100 text-blue-900'
    : 'bg-red-100 text-red-900';
  const selectedBorderClass = isHome
    ? 'border-blue-500 bg-blue-500'
    : 'border-red-500 bg-red-500';

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

        {/* Custom override option */}
        <button
          type="button"
          onClick={() =>
            isUsingDefault ? onSelect(UI_DEFAULT_STATS_FEATURES) : undefined
          }
          disabled={disabled}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors sm:gap-2.5 sm:px-3 sm:py-2 sm:text-sm ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } ${!isUsingDefault ? selectedBgClass : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <div
            className={`flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full border sm:h-4 sm:w-4 ${
              !isUsingDefault ? selectedBorderClass : 'border-gray-300 bg-white'
            }`}
          >
            {!isUsingDefault && (
              <div className="h-1 w-1 rounded-full bg-white sm:h-1.5 sm:w-1.5" />
            )}
          </div>
          <span>Custom settings</span>
        </button>

        {/* Inline feature toggles when override is active */}
        {!isUsingDefault && (
          <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-3">
            <StatsFeatureToggles
              value={currentFeatures!}
              onChange={onSelect}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}

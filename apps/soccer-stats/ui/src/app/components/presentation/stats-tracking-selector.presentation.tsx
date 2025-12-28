import { StatsTrackingLevel } from '../../generated/graphql';

/**
 * Stats tracking option configuration.
 * Each option represents a feature level that could be monetized in the future.
 */
export interface StatsTrackingOption {
  value: StatsTrackingLevel;
  label: string;
  description: string;
  /** Future use: mark premium features */
  isPremium?: boolean;
}

/**
 * Future stat tracking features that are not yet implemented.
 */
interface FutureStatOption {
  id: string;
  label: string;
  description: string;
}

/**
 * All available stats tracking options.
 * This is the single source of truth for stats tracking levels.
 */
export const STATS_TRACKING_OPTIONS: StatsTrackingOption[] = [
  {
    value: StatsTrackingLevel.Full,
    label: 'Full Stats',
    description: 'Track scorer and assister for each goal',
    isPremium: false,
  },
  {
    value: StatsTrackingLevel.ScorerOnly,
    label: 'Scorer Only',
    description: 'Track only who scored, no assists',
    isPremium: false,
  },
  {
    value: StatsTrackingLevel.GoalsOnly,
    label: 'Goals Only',
    description: 'Track goals without player attribution',
    isPremium: false,
  },
];

/**
 * Future stats that will be implemented later.
 * Shown as disabled options to preview upcoming features.
 */
const FUTURE_STATS: FutureStatOption[] = [
  {
    id: 'saves',
    label: 'Goalkeeper Saves',
    description: 'Track saves by goalkeepers',
  },
  {
    id: 'shots',
    label: 'Shots on Goal',
    description: 'Track shots and shots on target',
  },
  {
    id: 'possession',
    label: 'Possession',
    description: 'Track team possession percentage',
  },
  {
    id: 'passes',
    label: 'Pass Tracking',
    description: 'Track completed and attempted passes',
  },
  {
    id: 'cards',
    label: 'Cards',
    description: 'Track yellow and red cards',
  },
  {
    id: 'fouls',
    label: 'Fouls',
    description: 'Track fouls committed and received',
  },
];

interface StatsTrackingSelectorProps {
  /** Currently selected tracking level */
  value: StatsTrackingLevel;
  /** Callback when selection changes */
  onChange: (level: StatsTrackingLevel) => void;
  /** Display variant: 'grid' for settings pages, 'compact' for menus */
  variant?: 'grid' | 'compact';
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional label text above the selector */
  label?: string;
  /** Optional description text */
  description?: string;
  /** Whether to show future stats section (only in grid variant) */
  showFutureStats?: boolean;
}

/**
 * Radio toggle component for stats options
 */
const RadioOption = ({
  selected,
  label,
  description,
  onClick,
  disabled,
  isPremium,
}: {
  selected: boolean;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  isPremium?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`
      flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all
      ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      ${
        selected
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }
    `}
  >
    {/* Radio circle */}
    <div
      className={`
        mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2
        ${
          selected
            ? 'border-purple-500 bg-purple-500'
            : 'border-gray-300 bg-white'
        }
      `}
    >
      {selected && <div className="h-2 w-2 rounded-full bg-white" />}
    </div>

    {/* Label and description */}
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span
          className={`font-medium ${
            selected ? 'text-purple-900' : 'text-gray-900'
          }`}
        >
          {label}
        </span>
        {isPremium && (
          <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
            PRO
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-gray-500">{description}</p>
    </div>
  </button>
);

/**
 * Disabled checkbox for future stats
 */
const FutureStatCheckbox = ({
  label,
  description,
}: {
  label: string;
  description: string;
}) => (
  <div className="flex items-start gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 opacity-60">
    {/* Disabled checkbox */}
    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-gray-300 bg-gray-100">
      {/* Empty - unchecked */}
    </div>

    {/* Label and description */}
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-500">{label}</span>
        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-500">
          Coming Soon
        </span>
      </div>
      <p className="mt-0.5 text-sm text-gray-400">{description}</p>
    </div>
  </div>
);

/**
 * Reusable stats tracking level selector component.
 * Used in Team Settings for defaults and in Game menu for per-game overrides.
 *
 * Designed with future monetization in mind - stats levels can become feature flags.
 */
export const StatsTrackingSelector = ({
  value,
  onChange,
  variant = 'grid',
  disabled = false,
  label,
  description,
  showFutureStats = true,
}: StatsTrackingSelectorProps) => {
  if (variant === 'compact') {
    // Compact variant - for dropdown menus
    return (
      <div className="space-y-2">
        {label && (
          <div className="text-sm font-medium text-gray-700">{label}</div>
        )}
        {description && (
          <div className="text-xs text-gray-500">{description}</div>
        )}
        <div className="space-y-1">
          {STATS_TRACKING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              type="button"
              className={`
                flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${
                  value === option.value
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {/* Mini radio indicator */}
              <div
                className={`
                  flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2
                  ${
                    value === option.value
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300 bg-white'
                  }
                `}
              >
                {value === option.value && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
              <span className="font-medium">{option.label}</span>
              {option.isPremium && (
                <span className="ml-auto rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Grid variant - for settings pages
  return (
    <div className="space-y-6">
      {label && <h4 className="text-sm font-medium text-gray-900">{label}</h4>}
      {description && <p className="text-sm text-gray-600">{description}</p>}

      {/* Active tracking levels */}
      <div>
        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Goal Tracking Mode
        </h5>
        <div className="space-y-2">
          {STATS_TRACKING_OPTIONS.map((option) => (
            <RadioOption
              key={option.value}
              selected={value === option.value}
              label={option.label}
              description={option.description}
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              isPremium={option.isPremium}
            />
          ))}
        </div>
      </div>

      {/* Future stats section */}
      {showFutureStats && (
        <div>
          <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Additional Stats (Coming Soon)
          </h5>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FUTURE_STATS.map((stat) => (
              <FutureStatCheckbox
                key={stat.id}
                label={stat.label}
                description={stat.description}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import {
  UIStatsFeatures,
  StatsFeatureToggles,
} from '@garage/soccer-stats/ui-components';

/**
 * Future stat tracking features that are not yet implemented.
 */
interface FutureStatOption {
  id: string;
  label: string;
  description: string;
}

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
    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-gray-300 bg-gray-100" />
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

interface StatsTrackingSelectorProps {
  /** Currently selected feature flags */
  value: UIStatsFeatures;
  /** Callback when any flag changes */
  onChange: (features: UIStatsFeatures) => void;
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
 * Stats tracking feature toggle selector component.
 * Used in Team Settings for defaults and in Game menu for per-game overrides.
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
  return (
    <div className={variant === 'compact' ? 'space-y-2 px-3' : 'space-y-4'}>
      {label && (
        <div
          className={
            variant === 'compact'
              ? 'text-sm font-medium text-gray-700'
              : 'text-sm font-medium text-gray-900'
          }
        >
          {label}
        </div>
      )}
      {description && (
        <p
          className={
            variant === 'compact'
              ? 'text-xs text-gray-500'
              : 'text-sm text-gray-600'
          }
        >
          {description}
        </p>
      )}

      <StatsFeatureToggles value={value} onChange={onChange} disabled={disabled} />

      {/* Future stats section (grid variant only) */}
      {variant === 'grid' && showFutureStats && (
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

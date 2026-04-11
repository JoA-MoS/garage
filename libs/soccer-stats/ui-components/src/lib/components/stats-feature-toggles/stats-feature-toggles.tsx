import { UIStatsFeatures, UI_DEFAULT_STATS_FEATURES } from '../../types';

export interface StatsFeatureTogglesProps {
  /** Current feature flags */
  value: UIStatsFeatures;
  /** Called whenever any flag changes */
  onChange: (features: UIStatsFeatures) => void;
  /** Disable all toggles */
  disabled?: boolean;
}

interface ToggleItemProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  indent?: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleItem({
  id,
  label,
  description,
  checked,
  disabled,
  indent = false,
  onChange,
}: ToggleItemProps) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
        indent ? 'ml-6' : ''
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
        checked && !disabled
          ? 'border-purple-400 bg-purple-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked
            ? 'border-purple-500 bg-purple-500'
            : 'border-gray-300 bg-white'
        }`}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 12 12"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 6l3 3 5-5"
            />
          </svg>
        )}
      </div>
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {/* Label */}
      <div className="flex-1">
        <span
          className={`font-medium ${checked ? 'text-purple-900' : 'text-gray-900'}`}
        >
          {label}
        </span>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
    </label>
  );
}

/**
 * Feature toggle panel for stats tracking configuration.
 *
 * Dependency rules are enforced automatically:
 * - Turning off Goals also turns off Scorer and Assists
 * - Turning off Scorer also turns off Assists
 * - Turning off Substitutions also turns off Positions
 */
export function StatsFeatureToggles({
  value,
  onChange,
  disabled = false,
}: StatsFeatureTogglesProps) {
  const update = (patch: Partial<UIStatsFeatures>) => {
    const next = { ...value, ...patch };

    // Enforce dependency rules
    if (!next.trackGoals) {
      next.trackScorer = false;
      next.trackAssists = false;
    }
    if (!next.trackScorer) {
      next.trackAssists = false;
    }
    if (!next.trackSubstitutions) {
      next.trackPositions = false;
    }

    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Goals group */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Goal Tracking
        </h5>
        <ToggleItem
          id="trackGoals"
          label="Track Goals"
          description="Record when goals are scored"
          checked={value.trackGoals}
          disabled={disabled}
          onChange={(checked) => update({ trackGoals: checked })}
        />
        <ToggleItem
          id="trackScorer"
          label="Track Scorer"
          description="Record who scored each goal"
          checked={value.trackScorer}
          disabled={disabled || !value.trackGoals}
          indent
          onChange={(checked) => update({ trackScorer: checked })}
        />
        <ToggleItem
          id="trackAssists"
          label="Track Assists"
          description="Record who assisted each goal"
          checked={value.trackAssists}
          disabled={disabled || !value.trackScorer}
          indent
          onChange={(checked) => update({ trackAssists: checked })}
        />
      </div>

      {/* Substitutions group */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Substitution Tracking
        </h5>
        <ToggleItem
          id="trackSubstitutions"
          label="Track Substitutions"
          description="Record who comes in and out (enables play time stats)"
          checked={value.trackSubstitutions}
          disabled={disabled}
          onChange={(checked) => update({ trackSubstitutions: checked })}
        />
        <ToggleItem
          id="trackPositions"
          label="Track Positions"
          description="Record which position each player occupies"
          checked={value.trackPositions}
          disabled={disabled || !value.trackSubstitutions}
          indent
          onChange={(checked) => update({ trackPositions: checked })}
        />
      </div>
    </div>
  );
}

export { UI_DEFAULT_STATS_FEATURES };

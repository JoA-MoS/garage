import { UICreateTeamInput } from '../types/ui.types';

import { TeamColorsPicker } from './color-picker-field.presentation';

interface TeamFormFieldsProps {
  /** Current form values */
  value: UICreateTeamInput;
  /** Callback when any field changes */
  onChange: (value: UICreateTeamInput) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * Reusable team form fields component.
 * Contains only the input fields - no wrapper or submit buttons.
 * Use this inside a form element and provide your own submit button.
 */
export const TeamFormFields = ({
  value,
  onChange,
  disabled = false,
  error,
}: TeamFormFieldsProps) => {
  const updateField = <K extends keyof UICreateTeamInput>(
    field: K,
    fieldValue: UICreateTeamInput[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Error</h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Name */}
      <div>
        <label
          htmlFor="teamName"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Team Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="teamName"
          required
          value={value.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your team name"
          disabled={disabled}
        />
        <p className="mt-1 text-sm text-gray-500">
          This will be displayed on jerseys and in game stats
        </p>
      </div>

      {/* Team Colors */}
      <TeamColorsPicker
        homePrimaryColor={value.homePrimaryColor}
        homeSecondaryColor={value.homeSecondaryColor}
        awayPrimaryColor={value.awayPrimaryColor}
        awaySecondaryColor={value.awaySecondaryColor}
        onHomePrimaryChange={(v) => updateField('homePrimaryColor', v)}
        onHomeSecondaryChange={(v) => updateField('homeSecondaryColor', v)}
        onAwayPrimaryChange={(v) => updateField('awayPrimaryColor', v)}
        onAwaySecondaryChange={(v) => updateField('awaySecondaryColor', v)}
        disabled={disabled}
      />

      {/* Team Logo */}
      <div>
        <label
          htmlFor="teamLogo"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Team Logo URL
        </label>
        <input
          type="url"
          id="teamLogo"
          value={value.logoUrl || ''}
          onChange={(e) => updateField('logoUrl', e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="https://example.com/logo.png"
          disabled={disabled}
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional: Link to your team logo image
        </p>
      </div>
    </div>
  );
};

/** Default values for a new team form */
export const DEFAULT_TEAM_FORM_VALUES: UICreateTeamInput = {
  name: '',
  homePrimaryColor: '#3b82f6',
  homeSecondaryColor: '#ffffff',
  awayPrimaryColor: '#ffffff',
  awaySecondaryColor: '#3b82f6',
  logoUrl: '',
};

/**
 * Creates form values from an existing team, handling legacy fields
 */
export const createTeamFormValues = (team: {
  name: string;
  homePrimaryColor?: string | null;
  homeSecondaryColor?: string | null;
  awayPrimaryColor?: string | null;
  awaySecondaryColor?: string | null;
  logoUrl?: string | null;
  logo?: string | null;
}): UICreateTeamInput => ({
  name: team.name,
  homePrimaryColor:
    team.homePrimaryColor || DEFAULT_TEAM_FORM_VALUES.homePrimaryColor,
  homeSecondaryColor:
    team.homeSecondaryColor || DEFAULT_TEAM_FORM_VALUES.homeSecondaryColor,
  awayPrimaryColor:
    team.awayPrimaryColor || DEFAULT_TEAM_FORM_VALUES.awayPrimaryColor,
  awaySecondaryColor:
    team.awaySecondaryColor || DEFAULT_TEAM_FORM_VALUES.awaySecondaryColor,
  logoUrl: team.logoUrl || team.logo || '',
});

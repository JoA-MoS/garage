import { memo } from 'react';

import type { UICreatePlayerInput } from '../../types';

/** Standard soccer positions for selection */
export const PLAYER_POSITIONS = [
  'Goalkeeper',
  'Right Back',
  'Center Back',
  'Left Back',
  'Defensive Midfielder',
  'Center Midfielder',
  'Attacking Midfielder',
  'Right Winger',
  'Left Winger',
  'Center Forward',
  'Striker',
] as const;

export interface CreatePlayerProps {
  /** Current form data */
  formData: UICreatePlayerInput;
  /** Whether form submission is in progress */
  loading: boolean;
  /** Error message to display */
  error?: string;
  /** Whether the form is valid for submission */
  isFormValid: boolean;
  /** Callback when a form field changes */
  onInputChange: (field: keyof UICreatePlayerInput, value: string) => void;
  /** Callback when form is submitted */
  onSubmit: (e: React.FormEvent) => void;
  /** Callback when cancel is clicked */
  onCancel: () => void;
}

/**
 * CreatePlayer is a form component for creating new players with
 * name, email, and optional position fields.
 */
export const CreatePlayer = memo(function CreatePlayer({
  formData,
  loading,
  error,
  isFormValid,
  onInputChange,
  onSubmit,
  onCancel,
}: CreatePlayerProps) {
  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-4 shadow-md sm:p-6 md:max-w-lg">
      <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
        Create New Player
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="player-firstName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                First Name *
              </label>
              <input
                id="player-firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => onInputChange('firstName', e.target.value)}
                placeholder="First name"
                disabled={loading}
                className="min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="player-lastName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Last Name *
              </label>
              <input
                id="player-lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => onInputChange('lastName', e.target.value)}
                placeholder="Last name"
                disabled={loading}
                className="min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="player-email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email *
            </label>
            <input
              id="player-email"
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              placeholder="Email address"
              disabled={loading}
              className="min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              required
            />
          </div>
        </div>

        {/* Position Select */}
        <div>
          <label
            htmlFor="player-position"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Preferred Position (Optional)
          </label>
          <select
            id="player-position"
            value={formData.position || ''}
            onChange={(e) => onInputChange('position', e.target.value)}
            disabled={loading}
            className="min-h-[44px] w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">Select a position</option>
            {PLAYER_POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:order-1"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="min-h-[44px] rounded-md bg-blue-600 px-6 py-2 text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:order-2"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </span>
            ) : (
              'Create Player'
            )}
          </button>
        </div>
      </form>
    </div>
  );
});

import { useState, useEffect } from 'react';
import { Link } from 'react-router';

import { UICreateTeamInput, UITeam } from '../types/ui.types';

import {
  TeamFormFields,
  DEFAULT_TEAM_FORM_VALUES,
  createTeamFormValues,
} from './team-form-fields.presentation';

interface CreateTeamPresentationProps {
  onSubmit: (teamData: UICreateTeamInput) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
  initialData?: UITeam;
  isTabMode?: boolean;
  onNext?: () => void;
}

export const CreateTeamPresentation = ({
  onSubmit,
  onCancel,
  loading,
  error,
  initialData,
  isTabMode = false,
  onNext,
}: CreateTeamPresentationProps) => {
  const [formData, setFormData] = useState<UICreateTeamInput>(
    initialData ? createTeamFormValues(initialData) : DEFAULT_TEAM_FORM_VALUES
  );

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData(createTeamFormValues(initialData));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      const teamData: UICreateTeamInput = {
        ...formData,
        name: formData.name.trim(),
        logoUrl: formData.logoUrl?.trim() || undefined,
      };
      onSubmit(teamData);

      // If in tab mode and this is creating a new team, move to next tab
      if (isTabMode && !initialData && onNext) {
        onNext();
      }
    }
  };

  return (
    <div className={isTabMode ? '' : 'mx-auto max-w-2xl p-6'}>
      <div className={isTabMode ? '' : 'rounded-lg bg-white shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {initialData ? 'Edit Team' : 'Create Your Team'}
                </h1>
                <p className="mt-1 text-gray-600">
                  {initialData
                    ? "Update your team's basic information"
                    : "Let's start by setting up your team's basic information"}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">
                  Step 1 of 3
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar - only show if not in tab mode */}
        {!isTabMode && (
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">
                  Team Info
                </span>
              </div>
              <div className="h-0.5 flex-1 bg-gray-200"></div>
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-400">
                  2
                </div>
                <span className="ml-2 text-sm text-gray-400">
                  Configuration
                </span>
              </div>
              <div className="h-0.5 flex-1 bg-gray-200"></div>
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-400">
                  3
                </div>
                <span className="ml-2 text-sm text-gray-400">Add Players</span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={isTabMode ? 'space-y-6' : 'px-6 py-6'}
        >
          <TeamFormFields
            value={formData}
            onChange={setFormData}
            disabled={loading}
            error={error}
          />

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <Link
              to="/teams"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="-ml-1 mr-3 h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {initialData ? 'Saving...' : 'Creating Team...'}
                </>
              ) : isTabMode ? (
                initialData ? (
                  'Save'
                ) : (
                  'Next'
                )
              ) : initialData ? (
                'Save Changes'
              ) : (
                'Continue to Configuration →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

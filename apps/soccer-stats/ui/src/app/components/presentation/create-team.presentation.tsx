import { useState, useEffect } from 'react';
import { Link } from 'react-router';

import { UICreateTeamInput, UITeam } from '../types/ui.types';

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
  // TODO: Implement getDefaultTeamColors when migrating to new architecture
  // const defaultColors = getDefaultTeamColors();
  const defaultColors = '#000000'; // Simplified for migration
  const [formData, setFormData] = useState<UICreateTeamInput>({
    name: initialData?.name || '',
    colors:
      typeof initialData?.colors === 'string'
        ? initialData.colors
        : defaultColors,
    logo: initialData?.logo || '',
  });

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        colors:
          typeof initialData.colors === 'string'
            ? initialData.colors
            : defaultColors,
        logo: initialData.logo || '',
      });
    }
  }, [initialData, defaultColors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      const teamData = {
        name: formData.name.trim(),
        colors: formData.colors,
        logo: formData.logo?.trim() || undefined,
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

        {/* Progress Bar */}
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
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Error creating team</h3>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className={isTabMode ? 'space-y-6' : 'space-y-6'}>
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
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your team name"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                This will be displayed on jerseys and in game stats
              </p>
            </div>

            {/* Team Colors */}
            <div>
              <label
                htmlFor="teamColors"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Team Colors (Optional)
              </label>
              <input
                type="text"
                id="teamColors"
                value={formData.colors || ''}
                onChange={(e) =>
                  setFormData({ ...formData, colors: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., #3b82f6,#1e40af or Blue,White"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter team colors separated by commas (hex codes or color names)
              </p>
            </div>

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
                value={formData.logo}
                onChange={(e) =>
                  setFormData({ ...formData, logo: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: Link to your team logo image
              </p>
            </div>
          </div>

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

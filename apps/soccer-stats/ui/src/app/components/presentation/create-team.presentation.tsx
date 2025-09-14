import { useState, useEffect } from 'react';
import { Link } from 'react-router';

import { UICreateTeamInput, UITeam } from '../types/ui.types';
import { getDefaultTeamColors } from '../utils/data-mapping.utils';

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
  const defaultColors = getDefaultTeamColors();
  const [formData, setFormData] = useState<UICreateTeamInput>({
    name: initialData?.name || '',
    colors: initialData?.colors || defaultColors,
    logo: initialData?.logo || '',
  });

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        colors: initialData.colors || defaultColors,
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
    <div className={isTabMode ? '' : 'max-w-2xl mx-auto p-6'}>
      <div className={isTabMode ? '' : 'bg-white rounded-lg shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {initialData ? 'Edit Team' : 'Create Your Team'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {initialData
                    ? "Update your team's basic information"
                    : "Let's start by setting up your team's basic information"}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Step 1 of 3
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {/* Progress Bar - only show if not in tab mode */}
        {!isTabMode && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">
                  Team Info
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm text-gray-400">
                  Configuration
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
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
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Error creating team</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className={isTabMode ? 'space-y-6' : 'space-y-6'}>
            {/* Team Name */}
            <div>
              <label
                htmlFor="teamName"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your team name"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be displayed on jerseys and in game stats
              </p>
            </div>

            {/* Team Colors */}
            <div>
              <label
                htmlFor="teamColors"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., #3b82f6,#1e40af or Blue,White"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter team colors separated by commas (hex codes or color names)
              </p>
            </div>

            {/* Team Logo */}
            <div>
              <label
                htmlFor="teamLogo"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/logo.png"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Link to your team logo image
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
            <Link
              to="/teams"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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

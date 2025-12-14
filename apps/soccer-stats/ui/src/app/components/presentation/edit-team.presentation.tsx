import { useState, useEffect } from 'react';
import { Link } from 'react-router';

import { UICreateTeamInput, UITeam } from '../types/ui.types';

interface EditTeamPresentationProps {
  initialTeamData: UITeam;
  onSubmit: (teamData: UICreateTeamInput) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}

export const EditTeamPresentation = ({
  initialTeamData,
  onSubmit,
  onCancel,
  loading,
  error,
}: EditTeamPresentationProps) => {
  const [formData, setFormData] = useState<UICreateTeamInput>({
    name: initialTeamData.name,
    colors: initialTeamData.colors,
    logo: initialTeamData.logo || '',
  });

  // Update form data when initial data changes
  useEffect(() => {
    setFormData({
      name: initialTeamData.name,
      colors: initialTeamData.colors,
      logo: initialTeamData.logo || '',
    });
  }, [initialTeamData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        colors: formData.colors,
        logo: formData.logo?.trim() || undefined,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Team</h1>
              <p className="text-gray-600 mt-1">
                Update your team's information and settings
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to="/teams"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back to Teams
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Team Name */}
            <div>
              <label
                htmlFor="teamName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Team Name *
              </label>
              <input
                type="text"
                id="teamName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your team name"
                required
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
                Team Logo URL (Optional)
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
                Optional: Add a URL to your team's logo image
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

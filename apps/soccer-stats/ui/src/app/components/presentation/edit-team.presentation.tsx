import { useState, useEffect } from 'react';
import { Link } from 'react-router';

import {
  createTeamFormValues,
  TeamFormFields,
  type UICreateTeamInput,
} from '@garage/soccer-stats/ui-components';

import { UITeam } from '../types/ui.types';

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
  const [formData, setFormData] = useState<UICreateTeamInput>(
    createTeamFormValues(initialTeamData),
  );

  // Update form data when initial data changes
  useEffect(() => {
    setFormData(createTeamFormValues(initialTeamData));
  }, [initialTeamData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        ...formData,
        name: formData.name.trim(),
        logoUrl: formData.logoUrl?.trim() || undefined,
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Team</h1>
              <p className="mt-1 text-gray-600">
                Update your team's information and settings
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to="/teams"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Teams
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <TeamFormFields
            value={formData}
            onChange={setFormData}
            disabled={loading}
            error={error}
          />

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

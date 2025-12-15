import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation } from '@apollo/client/react';

import { graphql } from '../generated/gql';
import { QuickCreateTeamMutation } from '../generated/graphql';
import { UICreateTeamInput } from '../components/types/ui.types';
import {
  TeamFormFields,
  DEFAULT_TEAM_FORM_VALUES,
} from '../components/presentation/team-form-fields.presentation';

const CREATE_TEAM_MUTATION = graphql(`
  mutation QuickCreateTeam($input: CreateTeamInput!) {
    createTeam(createTeamInput: $input) {
      id
      name
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
    }
  }
`);

export const CreateTeamPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UICreateTeamInput>(
    DEFAULT_TEAM_FORM_VALUES
  );
  const [error, setError] = useState<string | undefined>();

  const [createTeam, { loading }] = useMutation<QuickCreateTeamMutation>(
    CREATE_TEAM_MUTATION,
    {
      onCompleted: (data) => {
        // Navigate to the team's players page so they can start adding players
        navigate(`/teams/${data.createTeam.id}/players`);
      },
      onError: (err) => {
        setError(err.message);
      },
      refetchQueries: ['GetMyTeamsForList', 'DebugGetTeams'],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }

    setError(undefined);
    createTeam({
      variables: {
        input: {
          name: formData.name.trim(),
          homePrimaryColor: formData.homePrimaryColor,
          homeSecondaryColor: formData.homeSecondaryColor,
          awayPrimaryColor: formData.awayPrimaryColor,
          awaySecondaryColor: formData.awaySecondaryColor,
          logoUrl: formData.logoUrl?.trim() || undefined,
        },
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Create Team
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Set up your team's basic info. You can add players next.
              </p>
            </div>
            <Link
              to="/teams"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <TeamFormFields
            value={formData}
            onChange={setFormData}
            disabled={loading}
            error={error}
          />

          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              to="/teams"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

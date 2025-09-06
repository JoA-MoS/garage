import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useCallback } from 'react';

import {
  GET_TEAM_BY_ID,
  UPDATE_TEAM,
  TeamResponse,
  UpdateTeamResponse,
  GET_TEAMS,
} from '../../services/teams-graphql.service';
import { EditTeamPresentation } from '../presentation/edit-team.presentation';
import { UICreateTeamInput } from '../types/ui.types';
import {
  mapUICreateTeamToService,
  mapServiceTeamToUITeam,
} from '../utils/data-mapping.utils';

interface EditTeamSmartProps {
  teamId: string;
}

/**
 * Smart component for editing an existing team
 */
export const EditTeamSmart = ({ teamId }: EditTeamSmartProps) => {
  const navigate = useNavigate();

  const {
    data: teamData,
    loading: fetchLoading,
    error: fetchError,
  } = useQuery<TeamResponse>(GET_TEAM_BY_ID, {
    variables: { id: teamId },
    skip: !teamId,
  });

  const [updateTeam, { loading: updateLoading, error: updateError }] =
    useMutation<UpdateTeamResponse>(UPDATE_TEAM, {
      refetchQueries: [{ query: GET_TEAMS }],
      onCompleted: () => {
        // Navigate back to teams list after successful update
        navigate('/teams');
      },
    });

  const handleUpdateTeam = useCallback(
    async (uiTeamData: UICreateTeamInput) => {
      try {
        // Map UI data to service format
        const serviceTeamData = mapUICreateTeamToService(uiTeamData);
        await updateTeam({
          variables: {
            id: teamId,
            updateTeamInput: serviceTeamData,
          },
        });
      } catch (err) {
        console.error('Error updating team:', err);
      }
    },
    [updateTeam, teamId]
  );

  const handleCancel = useCallback(() => {
    navigate('/teams');
  }, [navigate]);

  // Show loading state
  if (fetchLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (fetchError || !teamData?.team) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">
            {fetchError?.message || 'Team not found'}
          </p>
          <button
            onClick={handleCancel}
            className="mt-3 text-red-600 hover:text-red-800 underline"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  // Convert service team to UI format for editing
  const uiTeam = mapServiceTeamToUITeam(teamData.team);

  return (
    <EditTeamPresentation
      initialTeamData={uiTeam}
      onSubmit={handleUpdateTeam}
      onCancel={handleCancel}
      loading={updateLoading}
      error={updateError?.message}
    />
  );
};

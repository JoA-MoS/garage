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
        // TODO: Implement mapUICreateTeamToService when migrating to new architecture
        // const serviceTeamData = mapUICreateTeamToService(uiTeamData);
        const serviceTeamData = uiTeamData as any; // Temporary fix
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
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="animate-pulse">
            <div className="mb-4 h-8 rounded bg-gray-200"></div>
            <div className="mb-2 h-4 rounded bg-gray-200"></div>
            <div className="h-4 w-2/3 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (fetchError || !teamData?.team) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            {fetchError?.message || 'Team not found'}
          </p>
          <button
            onClick={handleCancel}
            className="mt-3 text-red-600 underline hover:text-red-800"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  // Convert service team to UI format for editing
  // TODO: Implement mapServiceTeamToUITeam when migrating to new architecture
  // const uiTeam = mapServiceTeamToUITeam(teamData.team);
  const uiTeam = teamData.team as any; // Temporary fix

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

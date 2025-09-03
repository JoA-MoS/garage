import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useCallback } from 'react';

import {
  CREATE_TEAM,
  CreateTeamResponse,
  CreateTeamInput,
  GET_TEAMS,
} from '../../services/teams-graphql.service';
import { CreateTeamPresentation } from '../presentation/create-team.presentation';
import { UICreateTeamInput } from '../types/ui.types';
import { mapUICreateTeamToService } from '../utils/data-mapping.utils';

/**
 * Smart component for creating a new team
 */
export const CreateTeamSmart = () => {
  const navigate = useNavigate();

  const [createTeam, { loading, error }] = useMutation<
    CreateTeamResponse,
    { createTeamInput: CreateTeamInput }
  >(CREATE_TEAM, {
    refetchQueries: [{ query: GET_TEAMS }],
    onCompleted: (data) => {
      // Navigate to team configuration page after successful creation
      navigate(`/teams/${data.createTeam.id}/configure`);
    },
  });

  const handleCreateTeam = useCallback(
    async (uiTeamData: UICreateTeamInput) => {
      try {
        // Map UI data to service format
        const serviceTeamData = mapUICreateTeamToService(uiTeamData);
        await createTeam({
          variables: {
            createTeamInput: serviceTeamData,
          },
        });
      } catch (err) {
        console.error('Error creating team:', err);
      }
    },
    [createTeam]
  );

  const handleCancel = useCallback(() => {
    navigate('/teams');
  }, [navigate]);

  return (
    <CreateTeamPresentation
      onSubmit={handleCreateTeam}
      onCancel={handleCancel}
      loading={loading}
      error={error?.message}
    />
  );
};

import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useCallback } from 'react';

import { GET_TEAMS, TeamsResponse } from '../../services/teams-graphql.service';
import { TeamsListPresentation } from '../presentation/teams-list.presentation';
import { mapServiceTeamsToUITeams } from '../utils/data-mapping.utils';

interface TeamsListSmartProps {
  onCreateTeam?: () => void;
  onEditTeam?: (teamId: string) => void;
}

/**
 * Smart component that fetches teams data from GraphQL API
 * and handles business logic
 */
export const TeamsListSmart = ({
  onCreateTeam,
  onEditTeam,
}: TeamsListSmartProps) => {
  const navigate = useNavigate();

  const { data } = useQuery<TeamsResponse>(GET_TEAMS, {
    // Use cache-first policy for better performance
    fetchPolicy: 'cache-first',
  });

  const handleCreateTeam = useCallback(() => {
    if (onCreateTeam) {
      onCreateTeam();
    } else {
      navigate('/teams/manage');
    }
  }, [onCreateTeam, navigate]);

  const handleEditTeam = useCallback(
    (teamId: string) => {
      if (onEditTeam) {
        onEditTeam(teamId);
      } else {
        navigate(`/teams/${teamId}/manage`);
      }
    },
    [onEditTeam, navigate]
  );

  return (
    <TeamsListPresentation
      teams={mapServiceTeamsToUITeams(data?.teams || [])}
      onCreateTeam={handleCreateTeam}
      onEditTeam={handleEditTeam}
    />
  );
};

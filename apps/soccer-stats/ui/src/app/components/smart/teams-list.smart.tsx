import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useCallback } from 'react';

import { TeamsListPresentation } from '../presentation/teams-list.presentation';
import { graphql } from '../../generated';

interface TeamsListSmartProps {
  onCreateTeam?: () => void;
  onEditTeam?: (teamId: string) => void;
}

/**
 * Layer 2: Smart Component for Teams List
 * - Fetches teams data using Apollo Client
 * - Maps GraphQL data to UI-friendly format
 * - Handles loading/error states
 * and handles business logic
 */
// Define the query using the generated graphql function following The Guild's best practices
const GetTeamsQueryDocument = graphql(`
  query DebugGetTeams {
    teams {
      id
      name
      shortName
      description
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
      isActive
      isManaged
      sourceType

      createdAt
      updatedAt
    }
  }
`);

export const TeamsListSmart = ({
  onCreateTeam,
  onEditTeam,
}: TeamsListSmartProps) => {
  const navigate = useNavigate();

  // Use the generated document with useQuery following The Guild's best practices
  const { data } = useQuery(GetTeamsQueryDocument);

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
      teams={(data as any)?.teams || []} // TODO: Fix type when migrating to new architecture
      onCreateTeam={handleCreateTeam}
      onEditTeam={handleEditTeam}
    />
  );
};

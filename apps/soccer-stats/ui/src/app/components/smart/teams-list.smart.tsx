import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useCallback } from 'react';

import { TeamsList, type UITeam } from '@garage/soccer-stats/ui-components';
import { graphql } from '@garage/soccer-stats/graphql-codegen';

import { useUserProfile } from '../../hooks/use-user-profile';

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
// Query for all teams (used when not authenticated)
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

// Query for user's teams only (used when authenticated)
const GetMyTeamsQueryDocument = graphql(`
  query GetMyTeamsForList {
    myTeams {
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
      createdById
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
  const { isSignedIn, isLoaded } = useUserProfile();

  // Use myTeams query when authenticated, otherwise fall back to all teams
  const {
    data: myTeamsData,
    loading: myTeamsLoading,
    error: myTeamsError,
  } = useQuery(GetMyTeamsQueryDocument, {
    skip: !isLoaded || !isSignedIn,
  });

  const {
    data: allTeamsData,
    loading: allTeamsLoading,
    error: allTeamsError,
  } = useQuery(GetTeamsQueryDocument, {
    skip: !isLoaded || isSignedIn,
  });

  // Loading if auth state isn't loaded yet, or if the active query is loading
  const isLoading =
    !isLoaded || (isSignedIn ? myTeamsLoading : allTeamsLoading);

  // Check for errors
  const error = isSignedIn ? myTeamsError : allTeamsError;

  // Use authenticated user's teams if signed in, otherwise show all teams
  // Cast to UITeam[] since GraphQL returns compatible types with sourceType as string
  const teams: UITeam[] = (
    isSignedIn ? (myTeamsData?.myTeams ?? []) : (allTeamsData?.teams ?? [])
  ) as UITeam[];

  const handleCreateTeam = useCallback(() => {
    if (onCreateTeam) {
      onCreateTeam();
    } else {
      navigate('/teams/new');
    }
  }, [onCreateTeam, navigate]);

  const handleEditTeam = useCallback(
    (teamId: string) => {
      if (onEditTeam) {
        onEditTeam(teamId);
      } else {
        navigate(`/teams/${teamId}/settings`);
      }
    },
    [onEditTeam, navigate],
  );

  return (
    <TeamsList
      teams={teams}
      loading={isLoading}
      error={error?.message}
      onCreateTeam={handleCreateTeam}
      onEditTeam={handleEditTeam}
    />
  );
};

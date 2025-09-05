import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useCallback, useState } from 'react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
} from '../../services/teams-graphql.service';
import { TeamDetailPresentation } from '../presentation/team-detail.presentation';
import { mapServiceTeamToUITeam } from '../utils/data-mapping.utils';

import { TeamPlayersSmart } from './team-players.smart';
import { TeamGamesSmart } from './team-games.smart';

interface TeamDetailSmartProps {
  teamId: string;
}

type TabType = 'overview' | 'players' | 'games' | 'stats';

/**
 * Smart component for viewing team details with player management
 */
export const TeamDetailSmart = ({ teamId }: TeamDetailSmartProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data, loading, error, refetch } = useQuery<TeamResponse>(
    GET_TEAM_BY_ID,
    {
      variables: { id: teamId },
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    }
  );

  const handleGoBack = useCallback(() => {
    navigate('/teams');
  }, [navigate]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      // Navigate to the direct route for the tab
      if (tab !== 'overview') {
        navigate(`/teams/${teamId}/${tab}`);
      } else {
        navigate(`/teams/${teamId}/overview`);
      }
    },
    [navigate, teamId]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading team details...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center text-red-600 p-4">
        <div className="text-lg font-semibold">Error loading team</div>
        <div className="text-sm mt-2">{error.message}</div>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const team = data?.team ? mapServiceTeamToUITeam(data.team) : null;

  if (!team) {
    return (
      <div className="text-center p-4">
        <div className="text-lg">Team not found</div>
        <button
          onClick={handleGoBack}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <TeamDetailPresentation
      team={team}
      activeTab={activeTab}
      onGoBack={handleGoBack}
      onTabChange={handleTabChange}
      onRefresh={handleRefresh}
      isLoading={loading}
      playersComponent={<TeamPlayersSmart teamId={teamId} />}
      gamesComponent={<TeamGamesSmart teamId={teamId} />}
    />
  );
};

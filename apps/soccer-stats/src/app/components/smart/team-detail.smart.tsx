import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useCallback } from 'react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
} from '../../services/teams-graphql.service';
import { TeamDetailPresentation } from '../presentation/team-detail.presentation';
import { mapServiceTeamToUITeam } from '../utils/data-mapping.utils';

interface TeamDetailSmartProps {
  teamId: string;
}

/**
 * Smart component for viewing team details
 */
export const TeamDetailSmart = ({ teamId }: TeamDetailSmartProps) => {
  const navigate = useNavigate();

  const { data, loading, error } = useQuery<TeamResponse>(GET_TEAM_BY_ID, {
    variables: { id: teamId },
    skip: !teamId,
  });

  const handleEdit = useCallback(() => {
    navigate(`/teams/${teamId}/edit`);
  }, [navigate, teamId]);

  const handleBackToTeams = useCallback(() => {
    navigate('/teams');
  }, [navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
  if (error || !data?.team) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error?.message || 'Team not found'}</p>
          <button
            onClick={handleBackToTeams}
            className="mt-3 text-red-600 hover:text-red-800 underline"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  const uiTeam = mapServiceTeamToUITeam(data.team);

  return (
    <TeamDetailPresentation
      team={uiTeam}
      onEdit={handleEdit}
      onBack={handleBackToTeams}
    />
  );
};

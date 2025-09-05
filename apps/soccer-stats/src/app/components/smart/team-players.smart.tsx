import { useMutation, useQuery } from '@apollo/client/react';
import { useState, useCallback } from 'react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
} from '../../services/teams-graphql.service';
import { TeamPlayersPresentation } from '../presentation/team-players.presentation';

import { QuickAddPlayersSmart } from './quick-add-players.smart';

interface TeamPlayersSmartProps {
  teamId: string;
}

/**
 * Smart component for managing players on a team
 */
export const TeamPlayersSmart = ({ teamId }: TeamPlayersSmartProps) => {
  const [showAddPlayers, setShowAddPlayers] = useState(false);

  // Get team with players
  const {
    data: teamData,
    loading: teamLoading,
    error: teamError,
    refetch: refetchTeam,
  } = useQuery<TeamResponse>(GET_TEAM_BY_ID, {
    variables: { id: teamId },
    fetchPolicy: 'cache-first',
  });

  const handleAddPlayersClick = useCallback(() => {
    setShowAddPlayers(true);
  }, []);

  const handleCloseAddPlayers = useCallback(() => {
    setShowAddPlayers(false);
  }, []);

  const handleAddPlayersSuccess = useCallback(() => {
    // Refetch team data to show new players
    refetchTeam();
  }, [refetchTeam]);

  if (teamLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (teamError || !teamData?.team) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Team Not Found
          </h2>
          <p className="text-gray-600">
            {teamError?.message ||
              'The team you are looking for does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TeamPlayersPresentation
        team={teamData.team}
        onAddPlayers={handleAddPlayersClick}
      />

      {showAddPlayers && (
        <QuickAddPlayersSmart
          teamId={teamId}
          onClose={handleCloseAddPlayers}
          onSuccess={handleAddPlayersSuccess}
        />
      )}
    </>
  );
};

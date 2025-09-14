import { useMutation, useQuery } from '@apollo/client/react';
import { useState, useCallback } from 'react';

import {
  GET_PLAYERS,
  PlayersResponse,
} from '../../services/players-graphql.service';
import {
  ADD_PLAYER_TO_TEAM,
  AddPlayerToTeamResponse,
  AddPlayerToTeamInput,
  GET_TEAM_BY_ID,
} from '../../services/teams-graphql.service';
import { mapServicePlayersToUIPlayers } from '../utils/data-mapping.utils';
import { QuickAddPlayersPresentation } from '../presentation/quick-add-players.presentation';

interface QuickAddPlayersSmartProps {
  teamId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Smart component for quickly adding existing players to a team
 */
export const QuickAddPlayersSmart = ({
  teamId,
  onClose,
  onSuccess,
}: QuickAddPlayersSmartProps) => {
  const [selectedPlayersWithJerseys, setSelectedPlayersWithJerseys] = useState<
    { playerId: string; jersey: number }[]
  >([]);

  // Get all players
  const {
    data: playersData,
    loading: playersLoading,
    error: playersError,
  } = useQuery<PlayersResponse>(GET_PLAYERS, {
    fetchPolicy: 'cache-first',
  });

  // Add player to team mutation
  const [
    addPlayerToTeam,
    { loading: addPlayerLoading, error: addPlayerError },
  ] = useMutation<
    AddPlayerToTeamResponse,
    { addPlayerToTeamInput: AddPlayerToTeamInput }
  >(ADD_PLAYER_TO_TEAM, {
    refetchQueries: [{ query: GET_TEAM_BY_ID, variables: { id: teamId } }],
  });

  const handlePlayerToggle = useCallback(
    (playerId: string, isSelected: boolean, jersey?: number) => {
      setSelectedPlayersWithJerseys((prev) => {
        if (isSelected) {
          // Add player with jersey number
          const existingJerseys = prev.map((p) => p.jersey);
          const defaultJersey = jersey || Math.max(0, ...existingJerseys) + 1;
          return [...prev, { playerId, jersey: defaultJersey }];
        } else {
          // Remove player
          return prev.filter((item) => item.playerId !== playerId);
        }
      });
    },
    []
  );

  const handleJerseyChange = useCallback((playerId: string, jersey: number) => {
    setSelectedPlayersWithJerseys((prev) =>
      prev.map((item) =>
        item.playerId === playerId ? { ...item, jersey } : item
      )
    );
  }, []);

  const handleAddPlayers = useCallback(async () => {
    if (selectedPlayersWithJerseys.length === 0) {
      return;
    }

    try {
      // Add all selected players to the team with their jersey numbers
      await Promise.all(
        selectedPlayersWithJerseys.map(({ playerId, jersey }) =>
          addPlayerToTeam({
            variables: {
              addPlayerToTeamInput: {
                teamId,
                playerId,
                jersey,
              },
            },
          })
        )
      );

      // Reset selection
      setSelectedPlayersWithJerseys([]);

      // Call success callback
      onSuccess?.();

      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error adding players to team:', err);
    }
  }, [selectedPlayersWithJerseys, addPlayerToTeam, teamId, onSuccess, onClose]);

  return (
    <QuickAddPlayersPresentation
      players={mapServicePlayersToUIPlayers(playersData?.players || [])}
      selectedPlayersWithJerseys={selectedPlayersWithJerseys}
      playersLoading={playersLoading}
      addPlayerLoading={addPlayerLoading}
      playersError={playersError?.message}
      addPlayerError={addPlayerError?.message}
      onPlayerSelection={handlePlayerToggle}
      onJerseyChange={handleJerseyChange}
      onAddPlayers={handleAddPlayers}
      onClose={onClose}
    />
  );
};

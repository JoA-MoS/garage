import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useCallback, useState } from 'react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
  ADD_PLAYER_TO_TEAM,
  AddPlayerToTeamResponse,
  AddPlayerToTeamInput,
} from '../../services/teams-graphql.service';
import {
  GET_PLAYERS,
  CREATE_PLAYER,
  PlayersResponse,
  CreatePlayerResponse,
  CreatePlayerInput,
  Player,
} from '../../services/players-graphql.service';
import { UIPlayer, UICreatePlayerInput } from '../types/ui.types';
import {
  mapServicePlayersToUIPlayers,
  mapUICreatePlayerToService,
} from '../utils/data-mapping.utils';
import { AddPlayersPresentation } from '../presentation/add-players.presentation';

interface AddPlayersSmartProps {
  teamId: string;
}

/**
 * Smart component for adding players to a team
 */
export const AddPlayersSmart = ({ teamId }: AddPlayersSmartProps) => {
  const navigate = useNavigate();
  const [selectedPlayersWithJerseys, setSelectedPlayersWithJerseys] = useState<
    { playerId: string; jersey: number }[]
  >([]);

  // Get team data
  const {
    data: teamData,
    loading: teamLoading,
    error: teamError,
  } = useQuery<TeamResponse>(GET_TEAM_BY_ID, {
    variables: { id: teamId },
    fetchPolicy: 'cache-first',
  });

  // Get all players
  const { data: playersData, loading: playersLoading } =
    useQuery<PlayersResponse>(GET_PLAYERS, {
      fetchPolicy: 'cache-first',
    });

  // Create player mutation
  const [
    createPlayer,
    { loading: createPlayerLoading, error: createPlayerError },
  ] = useMutation<
    CreatePlayerResponse,
    { createPlayerInput: CreatePlayerInput }
  >(CREATE_PLAYER, {
    refetchQueries: [{ query: GET_PLAYERS }],
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

  const handleCreatePlayer = useCallback(
    async (playerData: UICreatePlayerInput) => {
      try {
        const serviceData = mapUICreatePlayerToService(playerData);
        const result = await createPlayer({
          variables: {
            createPlayerInput: serviceData,
          },
        });

        if (result.data) {
          // Automatically select the newly created player with a default jersey number
          const existingJerseys = selectedPlayersWithJerseys.map(
            (p) => p.jersey
          );
          const nextJerseyNumber = Math.max(0, ...existingJerseys) + 1;

          setSelectedPlayersWithJerseys((prev) => [
            ...prev,
            {
              playerId: result.data!.createPlayer.id,
              jersey: nextJerseyNumber,
            },
          ]);
        }
      } catch (err) {
        console.error('Error creating player:', err);
      }
    },
    [createPlayer]
  );

  const handlePlayerSelection = useCallback(
    (playerId: string, isSelected: boolean, jersey?: number) => {
      setSelectedPlayersWithJerseys((prev) => {
        if (isSelected) {
          // Add player with jersey number
          const existingJerseys = prev.map((p) => p.jersey);
          const defaultJersey = jersey || Math.max(0, ...existingJerseys) + 1;
          return [...prev, { playerId, jersey: defaultJersey }];
        } else {
          // Remove player
          return prev.filter((p) => p.playerId !== playerId);
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

  const handleFinish = useCallback(async () => {
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
                depthRank: 1,
                isActive: true,
              },
            },
          })
        )
      );

      // Navigate to teams page or team detail page
      navigate('/teams');
    } catch (err) {
      console.error('Error adding players to team:', err);
    }
  }, [selectedPlayersWithJerseys, addPlayerToTeam, teamId, navigate]);

  const handleBack = useCallback(() => {
    navigate(`/teams/${teamId}/configure`);
  }, [navigate, teamId]);

  const handleSkip = useCallback(() => {
    // Skip adding players and go directly to teams page
    navigate('/teams');
  }, [navigate]);

  if (teamLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (teamError || !teamData?.team) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Team Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              {teamError?.message ||
                'The team you are looking for does not exist.'}
            </p>
            <button
              onClick={() => navigate('/teams')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AddPlayersPresentation
      team={teamData.team}
      players={mapServicePlayersToUIPlayers(playersData?.players || [])}
      selectedPlayersWithJerseys={selectedPlayersWithJerseys}
      playersLoading={playersLoading}
      createPlayerLoading={createPlayerLoading}
      addPlayerLoading={addPlayerLoading}
      createPlayerError={createPlayerError?.message}
      addPlayerError={addPlayerError?.message}
      onCreatePlayer={handleCreatePlayer}
      onPlayerSelection={handlePlayerSelection}
      onJerseyChange={handleJerseyChange}
      onFinish={handleFinish}
      onBack={handleBack}
      onSkip={handleSkip}
    />
  );
};

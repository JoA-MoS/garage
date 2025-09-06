import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router';

import {
  CREATE_GAME,
  GET_GAMES,
  GET_GAME_FORMATS,
  CreateGameInput,
  CreateGameResponse,
  GameFormat,
  GamesResponse,
} from '../../services/games-graphql.service';
import { GET_TEAMS, TeamsResponse } from '../../services/teams-graphql.service';
import { TeamGamesPresentation } from '../presentation/team-games.presentation';
import { mapServiceTeamsToUITeams } from '../utils/data-mapping.utils';

interface TeamGamesSmartProps {
  teamId: string;
}

/**
 * Smart component that manages game creation and listing for a specific team
 */
export const TeamGamesSmart = ({ teamId }: TeamGamesSmartProps) => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [gameForm, setGameForm] = useState({
    opponentTeamId: '',
    gameFormatId: '',
    duration: 90,
    isHome: true,
  });

  // Fetch all teams for opponent selection
  const { data: teamsData, loading: teamsLoading } = useQuery<TeamsResponse>(
    GET_TEAMS,
    {
      fetchPolicy: 'cache-first',
    }
  );

  // Fetch available game formats
  const { data: gameFormatsData, loading: gameFormatsLoading } = useQuery<{
    gameFormats: GameFormat[];
  }>(GET_GAME_FORMATS, {
    fetchPolicy: 'cache-first',
  });

  // Fetch games where this team is involved
  const {
    data: gamesData,
    loading: gamesLoading,
    refetch: refetchGames,
  } = useQuery<GamesResponse>(GET_GAMES, {
    fetchPolicy: 'cache-and-network',
  });

  // Create game mutation
  const [createGame, { loading: createLoading }] =
    useMutation<CreateGameResponse>(CREATE_GAME, {
      onCompleted: (data: CreateGameResponse) => {
        // Reset form and close modal
        setGameForm({
          opponentTeamId: '',
          gameFormatId: '',
          duration: 90,
          isHome: true,
        });
        setShowCreateForm(false);

        // Refetch games list
        refetchGames();

        // Navigate to the created game
        navigate(`/game/${data.createGame.id}`);
      },
      onError: (error: any) => {
        console.error('Error creating game:', error);
      },
    });

  // Event handlers
  const handleCreateGame = useCallback(() => {
    setShowCreateForm(true);
  }, []);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setGameForm({
      opponentTeamId: '',
      gameFormatId: '',
      duration: 90,
      isHome: true,
    });
  }, []);

  const handleFormChange = useCallback((field: string, value: any) => {
    setGameForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmitGame = useCallback(async () => {
    if (!gameForm.opponentTeamId || !gameForm.gameFormatId) {
      return;
    }

    const createGameInput: CreateGameInput = {
      homeTeamId: gameForm.isHome ? teamId : gameForm.opponentTeamId,
      awayTeamId: gameForm.isHome ? gameForm.opponentTeamId : teamId,
      gameFormatId: gameForm.gameFormatId,
      duration: gameForm.duration,
    };

    await createGame({
      variables: { createGameInput },
    });
  }, [gameForm, teamId, createGame]);

  const handleViewGame = useCallback(
    (gameId: string) => {
      navigate(`/game/${gameId}`);
    },
    [navigate]
  );

  // Filter games for this team
  const teamGames =
    gamesData?.games?.filter((game: any) =>
      game.gameTeams.some((gt: any) => gt.team.id === teamId)
    ) || [];

  // Get available opponent teams (exclude current team)
  const availableOpponents = mapServiceTeamsToUITeams(
    teamsData?.teams?.filter((team: any) => team.id !== teamId) || []
  );

  return (
    <TeamGamesPresentation
      teamId={teamId}
      games={teamGames}
      availableOpponents={availableOpponents}
      gameFormats={gameFormatsData?.gameFormats || []}
      showCreateForm={showCreateForm}
      gameForm={gameForm}
      loading={gamesLoading || teamsLoading || gameFormatsLoading}
      createLoading={createLoading}
      onCreateGame={handleCreateGame}
      onCancelCreate={handleCancelCreate}
      onFormChange={handleFormChange}
      onSubmitGame={handleSubmitGame}
      onViewGame={handleViewGame}
    />
  );
};

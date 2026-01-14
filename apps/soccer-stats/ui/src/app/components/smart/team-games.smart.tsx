import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';

import {
  CREATE_GAME,
  CreateGameInput,
} from '../../services/games-graphql.service';
import { TeamGamesPresentation } from '../presentation/team-games.presentation';
import {
  type GameCardData,
  type OpponentTeamData,
  type GameFormatSelectData,
} from '../composition/team-games.composition';

// =============================================================================
// HELPER HOOKS - Extract fragment data at the top level
// =============================================================================

/**
 * Custom hook to transform game team fragments into presentation data.
 * Keeps useFragment calls at the component level (not inside callbacks).
 */
function useGameCardsData(gameTeams: readonly GameCardData[], teamId: string) {
  // useFragment is actually just a type-casting function, but we call it
  // at the top level to satisfy the linter's rules-of-hooks check
  return useMemo(() => {
    return gameTeams.map((gameTeamRef) => {
      // Cast to access the fragment data (useFragment is an identity function)
      const gameTeam = gameTeamRef as unknown as {
        id: string;
        teamType: string;
        finalScore?: number | null;
        game: {
          id: string;
          name?: string | null;
          status: string;
          scheduledStart?: string | null;
          venue?: string | null;
          createdAt: string;
          gameFormat: {
            id: string;
            name: string;
            playersPerTeam: number;
            durationMinutes: number;
          };
          gameTeams: readonly {
            id: string;
            teamType: string;
            finalScore?: number | null;
            team: {
              id: string;
              name: string;
              shortName?: string | null;
              homePrimaryColor?: string | null;
              homeSecondaryColor?: string | null;
            };
          }[];
        };
      };

      return {
        id: gameTeam.game.id,
        name: gameTeam.game.name,
        status: gameTeam.game.status,
        scheduledStart: gameTeam.game.scheduledStart,
        venue: gameTeam.game.venue,
        createdAt: gameTeam.game.createdAt,
        gameFormat: gameTeam.game.gameFormat,
        gameTeams: gameTeam.game.gameTeams,
        currentTeamType: gameTeam.teamType,
        currentTeamScore: gameTeam.finalScore,
      };
    });
  }, [gameTeams, teamId]);
}

/**
 * Custom hook to transform opponent team fragments.
 */
function useOpponentsData(
  opponents: readonly OpponentTeamData[],
  teamId: string,
) {
  return useMemo(() => {
    return opponents
      .map((opponentRef) => {
        const team = opponentRef as unknown as {
          id: string;
          name: string;
          shortName?: string | null;
        };
        return {
          id: team.id,
          name: team.name,
          shortName: team.shortName,
        };
      })
      .filter((team) => team.id !== teamId);
  }, [opponents, teamId]);
}

/**
 * Custom hook to transform game format fragments.
 */
function useGameFormatsData(gameFormats: readonly GameFormatSelectData[]) {
  return useMemo(() => {
    return gameFormats.map((formatRef) => {
      const format = formatRef as unknown as {
        id: string;
        name: string;
        playersPerTeam: number;
        durationMinutes: number;
      };
      return {
        id: format.id,
        name: format.name,
        playersPerTeam: format.playersPerTeam,
        durationMinutes: format.durationMinutes,
      };
    });
  }, [gameFormats]);
}

// =============================================================================
// TYPES
// =============================================================================

interface TeamGamesSmartProps {
  teamId: string;
  /** Game teams with fragment data - from composition query */
  gameTeams: readonly GameCardData[];
  /** Opponent teams for modal dropdown - lazy-loaded */
  opponents: readonly OpponentTeamData[];
  /** Game formats for modal dropdown - lazy-loaded */
  gameFormats: readonly GameFormatSelectData[];
  /** Loading state for main page data */
  loading: boolean;
  /** Loading state for modal data */
  modalLoading: boolean;
  /** Callback when modal should open - triggers lazy load */
  onOpenModal: () => void;
  /** Callback after game is created - triggers refetch */
  onGameCreated: () => void;
}

// =============================================================================
// SMART COMPONENT
// =============================================================================

/**
 * Smart component for team games page.
 *
 * Responsibilities:
 * - Manages form state for creating games
 * - Handles create game mutation
 * - Maps fragment data to presentation props
 *
 * Does NOT:
 * - Make any queries (receives fragment data from composition)
 */
export const TeamGamesSmart = ({
  teamId,
  gameTeams,
  opponents,
  gameFormats,
  loading,
  modalLoading,
  onOpenModal,
  onGameCreated,
}: TeamGamesSmartProps) => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [gameForm, setGameForm] = useState({
    opponentTeamId: '',
    gameFormatId: '',
    duration: 90,
    isHome: true,
  });

  // Create game mutation
  const [createGame, { loading: createLoading }] = useMutation(CREATE_GAME, {
    onCompleted: (data) => {
      // Reset form and close modal
      setGameForm({
        opponentTeamId: '',
        gameFormatId: '',
        duration: 90,
        isHome: true,
      });
      setShowCreateForm(false);

      // Trigger refetch via composition
      onGameCreated();

      // Navigate to the created game
      navigate(`/games/${data.createGame.id}`);
    },
    onError: (error) => {
      console.error('Error creating game:', error);
    },
  });

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleCreateGame = useCallback(() => {
    // Trigger lazy-load of modal data
    onOpenModal();
    setShowCreateForm(true);
  }, [onOpenModal]);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setGameForm({
      opponentTeamId: '',
      gameFormatId: '',
      duration: 90,
      isHome: true,
    });
  }, []);

  const handleFormChange = useCallback(
    (field: string, value: string | number | boolean) => {
      setGameForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

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
      navigate(`/games/${gameId}`);
    },
    [navigate],
  );

  // ==========================================================================
  // Data Transformation - Use custom hooks to transform fragment data
  // ==========================================================================

  const games = useGameCardsData(gameTeams, teamId);
  const availableOpponents = useOpponentsData(opponents, teamId);
  const availableFormats = useGameFormatsData(gameFormats);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <TeamGamesPresentation
      teamId={teamId}
      games={games}
      availableOpponents={availableOpponents}
      gameFormats={availableFormats}
      showCreateForm={showCreateForm}
      gameForm={gameForm}
      loading={loading}
      createLoading={createLoading || modalLoading}
      onCreateGame={handleCreateGame}
      onCancelCreate={handleCancelCreate}
      onFormChange={handleFormChange}
      onSubmitGame={handleSubmitGame}
      onViewGame={handleViewGame}
    />
  );
};

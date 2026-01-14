import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';

import { useFragment } from '@garage/soccer-stats/graphql-codegen';

import {
  CREATE_GAME,
  CreateGameInput,
} from '../../services/games-graphql.service';
import { TeamGamesPresentation } from '../presentation/team-games.presentation';
import {
  type GameCardData,
  type OpponentTeamData,
  type GameFormatSelectData,
  GameCardFragment,
  OpponentTeamFragment,
  GameFormatSelectFragment,
} from '../composition/team-games.composition';

// =============================================================================
// HELPER HOOKS - Extract fragment data using useFragment
// =============================================================================

/**
 * Custom hook to transform game team fragments into presentation data.
 * Uses useFragment for proper type-safe fragment masking.
 */
function useGameCardsData(gameTeams: readonly GameCardData[]) {
  // useFragment on the array gives us properly typed fragment data
  const unmaskedGameTeams = useFragment(GameCardFragment, gameTeams);

  return useMemo(() => {
    return unmaskedGameTeams.map((gameTeam) => ({
      id: gameTeam.game.id,
      name: gameTeam.game.name,
      status: gameTeam.game.status,
      scheduledStart: gameTeam.game.scheduledStart,
      venue: gameTeam.game.venue,
      createdAt: gameTeam.game.createdAt,
      gameFormat: gameTeam.game.gameFormat,
      gameTeams: gameTeam.game.gameTeams ?? [],
      currentTeamType: gameTeam.teamType,
      currentTeamScore: gameTeam.finalScore,
    }));
  }, [unmaskedGameTeams]);
}

/**
 * Custom hook to transform opponent team fragments.
 * Uses useFragment for proper type-safe fragment masking.
 */
function useOpponentsData(
  opponents: readonly OpponentTeamData[],
  teamId: string,
) {
  const unmaskedOpponents = useFragment(OpponentTeamFragment, opponents);

  return useMemo(() => {
    return unmaskedOpponents
      .map((team) => ({
        id: team.id,
        name: team.name,
        shortName: team.shortName,
      }))
      .filter((team) => team.id !== teamId);
  }, [unmaskedOpponents, teamId]);
}

/**
 * Custom hook to transform game format fragments.
 * Uses useFragment for proper type-safe fragment masking.
 */
function useGameFormatsData(gameFormats: readonly GameFormatSelectData[]) {
  const unmaskedFormats = useFragment(GameFormatSelectFragment, gameFormats);

  return useMemo(() => {
    return unmaskedFormats.map((format) => ({
      id: format.id,
      name: format.name,
      playersPerTeam: format.playersPerTeam,
      durationMinutes: format.durationMinutes,
    }));
  }, [unmaskedFormats]);
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
  /** Error message from modal data query */
  modalError?: string;
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
 * - Maps fragment data to presentation props using useFragment
 * - Manages validation and error states
 *
 * Does NOT:
 * - Make any queries (receives fragment data from composition)
 * - Mutations for data modification are handled here
 */
export const TeamGamesSmart = ({
  teamId,
  gameTeams,
  opponents,
  gameFormats,
  loading,
  modalLoading,
  modalError,
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
  const [formError, setFormError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Create game mutation
  const [createGame, { loading: createLoading }] = useMutation(CREATE_GAME, {
    onCompleted: (data) => {
      // Clear errors and reset form
      setFormError(null);
      setMutationError(null);
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
      setMutationError(
        error.message || 'Failed to create game. Please try again.',
      );
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
    setFormError(null);
    setMutationError(null);
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
    // Clear previous errors
    setFormError(null);
    setMutationError(null);

    // Validate required fields
    if (!gameForm.opponentTeamId) {
      setFormError('Please select an opponent team.');
      return;
    }
    if (!gameForm.gameFormatId) {
      setFormError('Please select a game format.');
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

  const games = useGameCardsData(gameTeams);
  const availableOpponents = useOpponentsData(opponents, teamId);
  const availableFormats = useGameFormatsData(gameFormats);

  // Combine all errors for display
  const error = modalError || formError || mutationError;

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
      error={error}
      onCreateGame={handleCreateGame}
      onCancelCreate={handleCancelCreate}
      onFormChange={handleFormChange}
      onSubmitGame={handleSubmitGame}
      onViewGame={handleViewGame}
    />
  );
};

import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';

import {
  CREATE_GAME,
  CreateGameInput,
  REMOVE_GAME,
  UPDATE_GAME,
} from '../../services/games-graphql.service';
import { TeamGamesPresentation } from '../presentation/team-games.presentation';

// =============================================================================
// HOOK IMPORTS - From colocated smart components (Strict Pattern)
// =============================================================================

// Import data transformation hooks from their colocated smart components
// Each smart component owns its fragment and provides a hook to transform it
import { useGameCardsData, type GameCardData } from './game-card.smart';
import {
  useOpponentsData,
  type OpponentTeamData,
} from './opponent-select.smart';
import {
  useGameFormatsData,
  type GameFormatSelectData,
} from './game-format-select.smart';

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
  /** Callback after game is deleted - triggers refetch */
  onGameDeleted: () => void;
  /** Callback after game format is updated - triggers refetch */
  onGameUpdated: () => void;
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
 * - Uses hooks from colocated smart components to transform fragment data
 * - Manages validation and error states
 *
 * Does NOT:
 * - Define any GraphQL fragments (those live in colocated smart components)
 * - Make any queries (receives fragment data from composition)
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
  onGameDeleted,
  onGameUpdated,
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
  const [deleteConfirmGameId, setDeleteConfirmGameId] = useState<string | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editGameId, setEditGameId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ gameFormatId: '', duration: 90 });
  const [editError, setEditError] = useState<string | null>(null);

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

  // Update game format mutation
  const [updateGame, { loading: editLoading }] = useMutation(UPDATE_GAME, {
    onCompleted: () => {
      setEditError(null);
      setEditGameId(null);
      onGameUpdated();
    },
    onError: (error) => {
      console.error('Error updating game:', error);
      setEditError(error.message || 'Failed to update game. Please try again.');
    },
  });

  // Delete game mutation
  const [removeGame, { loading: deleteLoading }] = useMutation(REMOVE_GAME, {
    onCompleted: () => {
      setDeleteConfirmGameId(null);
      setDeleteError(null);
      onGameDeleted();
    },
    onError: (error) => {
      console.error('Error deleting game:', error);
      setDeleteError(
        error.message || 'Failed to delete game. Please try again.',
      );
    },
  });

  // ==========================================================================
  // Data Transformation - Use hooks from colocated smart components
  // ==========================================================================

  // Each hook uses useFragment internally to unmask and transform the data
  const games = useGameCardsData(gameTeams);
  const availableOpponents = useOpponentsData(opponents, teamId);
  const availableFormats = useGameFormatsData(gameFormats);

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

  const handleRequestDeleteGame = useCallback((gameId: string) => {
    setDeleteError(null);
    setDeleteConfirmGameId(gameId);
  }, []);

  const handleCancelDeleteGame = useCallback(() => {
    setDeleteConfirmGameId(null);
    setDeleteError(null);
  }, []);

  const handleConfirmDeleteGame = useCallback(() => {
    if (!deleteConfirmGameId) return;
    removeGame({ variables: { id: deleteConfirmGameId } });
  }, [deleteConfirmGameId, removeGame]);

  const handleRequestEditGame = useCallback(
    (gameId: string) => {
      const game = games.find((g) => g.id === gameId);
      if (!game) return;
      // Trigger lazy-load of modal data (game format options)
      onOpenModal();
      setEditError(null);
      setEditForm({
        gameFormatId: game.format.id,
        duration: game.format.durationMinutes,
      });
      setEditGameId(gameId);
    },
    [games, onOpenModal],
  );

  const handleCancelEditGame = useCallback(() => {
    setEditGameId(null);
    setEditError(null);
  }, []);

  const handleEditFormChange = useCallback(
    (field: 'gameFormatId' | 'duration', value: string | number) => {
      setEditForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleSubmitEditGame = useCallback(() => {
    if (!editGameId) return;
    updateGame({
      variables: {
        id: editGameId,
        updateGameInput: {
          gameFormatId: editForm.gameFormatId,
          duration: editForm.duration,
        },
      },
    });
  }, [editGameId, editForm, updateGame]);

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
      deleteConfirmGameId={deleteConfirmGameId}
      deleteLoading={deleteLoading}
      deleteError={deleteError}
      onRequestDeleteGame={handleRequestDeleteGame}
      onCancelDeleteGame={handleCancelDeleteGame}
      onConfirmDeleteGame={handleConfirmDeleteGame}
      editGameId={editGameId}
      editForm={editForm}
      editLoading={editLoading}
      editError={editError}
      onRequestEditGame={handleRequestEditGame}
      onCancelEditGame={handleCancelEditGame}
      onEditFormChange={handleEditFormChange}
      onSubmitEditGame={handleSubmitEditGame}
    />
  );
};

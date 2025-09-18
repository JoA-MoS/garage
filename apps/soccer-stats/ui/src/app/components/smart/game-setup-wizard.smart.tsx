import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@apollo/client/react';

import {
  GET_MANAGED_TEAMS,
  CREATE_UNMANAGED_TEAM,
  ManagedTeamsResponse,
  CreateUnmanagedTeamResponse,
  CreateUnmanagedTeamVariables,
  Team,
} from '../../services/teams-graphql.service';
import {
  GET_PLAYERS,
  CREATE_PLAYER,
  ADD_PLAYER_TO_TEAM,
  PlayersResponse,
  CreatePlayerResponse,
  CreatePlayerInput,
  AddPlayerToTeamResponse,
  AddPlayerToTeamInput,
} from '../../services/players-graphql.service';
import { GameSetupWizardPresentation } from '../presentation/game-setup-wizard.presentation';

interface GameSetupWizardSmartProps {
  onComplete?: (gameId: string) => void;
}

export type GameSetupStep = 'teams' | 'players' | 'game-details' | 'review';

export interface SelectedTeams {
  homeTeam: Team | null;
  awayTeam: Team | null;
}

export const GameSetupWizardSmart = ({
  onComplete,
}: GameSetupWizardSmartProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<GameSetupStep>('teams');
  const [selectedTeams, setSelectedTeams] = useState<SelectedTeams>({
    homeTeam: null,
    awayTeam: null,
  });

  // GraphQL operations
  const { data: managedTeamsData, loading: loadingManagedTeams } =
    useQuery<ManagedTeamsResponse>(GET_MANAGED_TEAMS);

  const {
    data: playersData,
    loading: loadingPlayers,
    refetch: refetchPlayers,
  } = useQuery<PlayersResponse>(GET_PLAYERS);

  const [createUnmanagedTeam, { loading: creatingUnmanagedTeam }] = useMutation<
    CreateUnmanagedTeamResponse,
    CreateUnmanagedTeamVariables
  >(CREATE_UNMANAGED_TEAM);

  const [createPlayer, { loading: creatingPlayer }] = useMutation<
    CreatePlayerResponse,
    { createPlayerInput: CreatePlayerInput }
  >(CREATE_PLAYER);

  const [addPlayerToTeam, { loading: addingPlayerToTeam }] = useMutation<
    AddPlayerToTeamResponse,
    { addPlayerToTeamInput: AddPlayerToTeamInput }
  >(ADD_PLAYER_TO_TEAM);

  // Navigation handlers
  const handleNextStep = useCallback(() => {
    const stepOrder: GameSetupStep[] = [
      'teams',
      'players',
      'game-details',
      'review',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  }, [currentStep]);

  const handlePreviousStep = useCallback(() => {
    const stepOrder: GameSetupStep[] = [
      'teams',
      'players',
      'game-details',
      'review',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep]);

  // Team selection handlers
  const handleSelectManagedTeam = useCallback(
    (team: Team, side: 'home' | 'away') => {
      setSelectedTeams((prev) => ({
        ...prev,
        [side === 'home' ? 'homeTeam' : 'awayTeam']: team,
      }));
    },
    []
  );

  const handleCreateOpponentTeam = useCallback(
    async (teamName: string, shortName?: string) => {
      try {
        const { data } = await createUnmanagedTeam({
          variables: {
            name: teamName,
            shortName,
          },
        });

        if (data?.createUnmanagedTeam) {
          // Auto-assign as away team (opponent)
          setSelectedTeams((prev) => ({
            ...prev,
            awayTeam: data.createUnmanagedTeam,
          }));
        }
      } catch (error) {
        console.error('Failed to create unmanaged team:', error);
        throw error;
      }
    },
    [createUnmanagedTeam]
  );

  // Player management handlers
  const handleCreatePlayer = useCallback(
    async (playerData: {
      firstName: string;
      lastName: string;
      jerseyNumber: number;
    }) => {
      try {
        // Generate required fields for game setup
        const timestamp = Date.now();
        const tempEmail = `${playerData.firstName.toLowerCase()}.${playerData.lastName.toLowerCase()}.${timestamp}@temp.local`;
        const tempPassword = `temp_${timestamp}`;

        // Create the player first
        const { data } = await createPlayer({
          variables: {
            createPlayerInput: {
              firstName: playerData.firstName,
              lastName: playerData.lastName,
              email: tempEmail,
              passwordHash: tempPassword, // In a real app, this would be properly hashed
            },
          },
        });

        if (data?.createPlayer) {
          // Refetch players to update the list
          await refetchPlayers();
        }

        return data?.createPlayer;
      } catch (error) {
        console.error('Failed to create player:', error);
        throw error;
      }
    },
    [createPlayer, refetchPlayers]
  );

  const handleAddPlayerToTeam = useCallback(
    async (playerId: string, teamId: string, jerseyNumber: number) => {
      try {
        const { data } = await addPlayerToTeam({
          variables: {
            addPlayerToTeamInput: {
              playerId,
              teamId,
              jersey: jerseyNumber,
              isActive: true,
            },
          },
        });

        if (data?.addPlayerToTeam) {
          // Refetch players to update team assignments
          await refetchPlayers();
        }
      } catch (error) {
        console.error('Failed to add player to team:', error);
        throw error;
      }
    },
    [addPlayerToTeam, refetchPlayers]
  );

  // Create player and add to team in one operation
  const handleCreatePlayerForTeam = useCallback(
    async (
      teamId: string,
      firstName: string,
      lastName: string,
      jerseyNumber: number
    ) => {
      try {
        // Create player with simplified data
        const player = await handleCreatePlayer({
          firstName,
          lastName,
          jerseyNumber,
        });

        if (player) {
          // Add to team with jersey number
          await handleAddPlayerToTeam(player.id, teamId, jerseyNumber);
        }
      } catch (error) {
        console.error('Failed to create player for team:', error);
        throw error;
      }
    },
    [handleCreatePlayer, handleAddPlayerToTeam]
  );

  // Game completion handler
  const handleCompleteGame = useCallback(
    async (gameData: Record<string, unknown>) => {
      try {
        // TODO: Implement createGame mutation
        const gameId = Date.now().toString(); // Temporary ID generation

        if (onComplete) {
          onComplete(gameId);
        } else {
          navigate(`/game/${gameId}`);
        }
      } catch (error) {
        console.error('Failed to create game:', error);
        throw error;
      }
    },
    [navigate, onComplete]
  );

  // Validation
  const canProceedFromTeams = Boolean(
    selectedTeams.homeTeam && selectedTeams.awayTeam
  );
  const isLoading =
    loadingManagedTeams ||
    creatingUnmanagedTeam ||
    loadingPlayers ||
    creatingPlayer ||
    addingPlayerToTeam;

  return (
    <GameSetupWizardPresentation
      currentStep={currentStep}
      selectedTeams={selectedTeams}
      managedTeams={managedTeamsData?.managedTeams || []}
      availablePlayers={playersData?.players || []}
      isLoading={isLoading}
      canProceedFromTeams={canProceedFromTeams}
      onNextStep={handleNextStep}
      onPreviousStep={handlePreviousStep}
      onSelectManagedTeam={handleSelectManagedTeam}
      onCreateOpponentTeam={handleCreateOpponentTeam}
      onCreatePlayerForTeam={handleCreatePlayerForTeam}
      onCompleteGame={handleCompleteGame}
    />
  );
};

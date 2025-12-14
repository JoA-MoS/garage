import { useState, useEffect } from 'react';

import {
  GameConfig,
  Team,
  Goal,
  SubstitutionRecommendation,
} from '../../types';
import { GameStatsService } from '../../services/game-stats.service';
import { useGameHistory } from '../../hooks/use-game-history';
import { formatTime } from '../../utils';
import {
  testHomeTeam,
  testAwayTeam,
  testGameConfig,
  testHomeTeamSmall,
  testAwayTeamSmall,
  testGameConfigSmall,
  testHomeTeam9v9,
  testAwayTeam9v9,
  testGameConfig9v9,
  testHomeTeam7v7,
  testAwayTeam7v7,
  testGameConfig7v7,
} from '../../data/test-data';

/**
 * Smart component that manages all game state and provides data to presentation components
 * In the future, this will be updated to use actual services instead of test data
 */

export interface GameData {
  gameConfig: GameConfig;
  homeTeam: Team;
  awayTeam: Team;
  gameStarted: boolean;
  gameTime: number;
  isGameRunning: boolean;
  activeTab: string;
  showGoalModal: boolean;
  goalTeam: 'home' | 'away';
  selectedScorer: string;
  selectedAssist: string;
}

export interface GameActions {
  // Team management
  handleTeamChange: (team: 'home' | 'away', updatedTeam: Team) => void;

  // Game configuration
  loadTestData: (size?: 'full' | 'small' | '9v9' | '7v7') => void;
  clearTeams: () => void;
  addPosition: () => void;
  removePosition: (index: number) => void;
  updatePosition: (index: number, value: string) => void;
  setGameConfig: (config: GameConfig) => void;

  // Game control
  startGame: () => void;
  resetGame: () => void;
  saveAndNewGame: () => Promise<string | null>;
  toggleGame: () => void;

  // Navigation
  setActiveTab: (tab: string) => void;

  // Goal management
  openGoalModal: (team: 'home' | 'away') => void;
  closeGoalModal: () => void;
  recordGoal: (scorerId: number, assistId: number | null) => void;
  recordOpponentGoal: (scorerJersey: number, assistJersey?: number) => void;
  updatePlayerStat: (
    playerId: number,
    stat:
      | 'goals'
      | 'assists'
      | 'yellow_card'
      | 'red_card'
      | 'foul_committed'
      | 'foul_received'
      | 'shot_on_target'
      | 'shot_off_target'
      | 'save'
  ) => void;
  setSelectedScorer: (scorer: string) => void;
  setSelectedAssist: (assist: string) => void;

  // Substitutions
  substitutePlayer: (playerOutId: number, playerInId: number) => void;
}

export interface DerivedGameData {
  homeScore: number;
  awayScore: number;
  currentTeam: Team;
  playersOnField: any[];
  playersOnBench: any[];
  substitutionRecommendations: SubstitutionRecommendation[];
  availablePlayers: any[];
}

export const useGameManager = () => {
  // Game history hook
  const { saveCurrentGame } = useGameHistory();

  // Default game configuration
  const defaultGameConfig: GameConfig = testGameConfig;

  // State management
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig);
  const [homeTeam, setHomeTeam] = useState<Team>(testHomeTeam);
  const [awayTeam, setAwayTeam] = useState<Team>(testAwayTeam);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('lineup');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTeam, setGoalTeam] = useState<'home' | 'away'>('home');
  const [selectedScorer, setSelectedScorer] = useState('');
  const [selectedAssist, setSelectedAssist] = useState('');

  // Team management
  const handleTeamChange = (team: 'home' | 'away', updatedTeam: Team) => {
    if (team === 'home') {
      setHomeTeam(updatedTeam);
    } else {
      setAwayTeam(updatedTeam);
    }
  };

  // Load different test data sets
  const loadTestData = (size: 'full' | 'small' | '9v9' | '7v7' = 'full') => {
    if (size === 'full') {
      setHomeTeam(testHomeTeam);
      setAwayTeam(testAwayTeam);
      setGameConfig(testGameConfig);
    } else if (size === 'small') {
      setHomeTeam(testHomeTeamSmall);
      setAwayTeam(testAwayTeamSmall);
      setGameConfig(testGameConfigSmall);
    } else if (size === '9v9') {
      setHomeTeam(testHomeTeam9v9);
      setAwayTeam(testAwayTeam9v9);
      setGameConfig(testGameConfig9v9);
    } else if (size === '7v7') {
      setHomeTeam(testHomeTeam7v7);
      setAwayTeam(testAwayTeam7v7);
      setGameConfig(testGameConfig7v7);
    }
    // Reset game state
    setGameStarted(false);
    setGameTime(0);
    setIsGameRunning(false);
    setActiveTab('lineup');
  };

  const clearTeams = () => {
    setHomeTeam({
      name: 'Home Team',
      players: [],
      goals: [],
      statEvents: [],
      isDetailedTracking: true,
    });
    setAwayTeam({
      name: 'Away Team',
      players: [],
      goals: [],
      statEvents: [],
      isDetailedTracking: false,
    });
    setGameConfig({
      playersPerTeam: 11,
      playersOnField: 11,
      positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
      homeTeamName: 'Home Team',
      awayTeamName: 'Away Team',
      homeTeamDetailedTracking: true,
      awayTeamDetailedTracking: false,
    });
    setGameStarted(false);
    setGameTime(0);
    setIsGameRunning(false);
    setActiveTab('config');
  };

  // Position management
  const addPosition = () => {
    const newConfig = {
      ...gameConfig,
      positions: [...gameConfig.positions, 'New Position'],
    };
    setGameConfig(newConfig);
  };

  const removePosition = (index: number) => {
    if (gameConfig.positions.length > 1) {
      const newConfig = {
        ...gameConfig,
        positions: gameConfig.positions.filter((_, i) => i !== index),
      };
      setGameConfig(newConfig);
    }
  };

  const updatePosition = (index: number, value: string) => {
    const newPositions = [...gameConfig.positions];
    newPositions[index] = value;
    const newConfig = { ...gameConfig, positions: newPositions };
    setGameConfig(newConfig);
  };

  // Game management
  const startGame = () => {
    setGameStarted(true);
    setIsGameRunning(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameTime(0);
    setIsGameRunning(false);
    setActiveTab('home');
  };

  const MIN_GAME_TIME_FOR_SAVE = 60;

  const saveAndNewGame = async (): Promise<string | null> => {
    try {
      // Only save if game has been started and has some time
      if (!gameStarted || gameTime < MIN_GAME_TIME_FOR_SAVE) {
        // Just reset if game hasn't really started
        resetGame();
        return null;
      }

      // Save the current game
      const gameId = saveCurrentGame(
        homeTeam,
        awayTeam,
        gameConfig.homeTeamName,
        gameConfig.awayTeamName,
        gameTime,
        [...homeTeam.goals, ...awayTeam.goals] // Combine all goals
      );

      // Reset for new game
      resetGame();

      return gameId;
    } catch (error) {
      console.error('Failed to save game:', error);
      // Still reset even if save failed
      resetGame();
      throw error;
    }
  };

  const toggleGame = () => {
    setIsGameRunning(!isGameRunning);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameRunning) {
      interval = setInterval(() => {
        setGameTime((prev) => prev + 1);
        // Update play time for both teams
        setHomeTeam((prevTeam) => ({
          ...prevTeam,
          players: prevTeam.players.map((player) =>
            player.isOnField
              ? { ...player, playTime: player.playTime + 1 }
              : player
          ),
        }));
        setAwayTeam((prevTeam) => ({
          ...prevTeam,
          players: prevTeam.players.map((player) =>
            player.isOnField
              ? { ...player, playTime: player.playTime + 1 }
              : player
          ),
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameRunning]);

  // Goal management
  const openGoalModal = (team: 'home' | 'away') => {
    setGoalTeam(team);
    setShowGoalModal(true);
    setSelectedScorer('');
    setSelectedAssist('');
  };

  const closeGoalModal = () => {
    setShowGoalModal(false);
  };

  /**
   * Records a goal and automatically adds a shot on target for the scorer
   * (following standard soccer statistics where goals count as shots on target)
   */
  const recordGoal = (scorerId: number, assistId: number | null) => {
    const newGoal = GameStatsService.createGoal(
      scorerId,
      assistId || undefined,
      gameTime
    );

    // Create shot on target stat event for the scorer (goals are shots on target)
    const shotOnTargetEvent = GameStatsService.createStatEvent(
      scorerId,
      'shot_on_target',
      gameTime
    );

    if (goalTeam === 'home') {
      setHomeTeam((prevTeam) => ({
        ...prevTeam,
        goals: [...prevTeam.goals, newGoal],
        statEvents: [...prevTeam.statEvents, shotOnTargetEvent],
      }));
    } else {
      setAwayTeam((prevTeam) => ({
        ...prevTeam,
        goals: [...prevTeam.goals, newGoal],
        statEvents: [...prevTeam.statEvents, shotOnTargetEvent],
      }));
    }

    setShowGoalModal(false);
  };

  const recordOpponentGoal = (scorerJersey: number, assistJersey?: number) => {
    const newGoal = GameStatsService.createOpponentGoal(
      scorerJersey,
      assistJersey,
      gameTime
    );

    if (goalTeam === 'home') {
      setHomeTeam((prevTeam) => ({
        ...prevTeam,
        goals: [...prevTeam.goals, newGoal],
      }));
    } else {
      setAwayTeam((prevTeam) => ({
        ...prevTeam,
        goals: [...prevTeam.goals, newGoal],
      }));
    }

    setShowGoalModal(false);
  };

  const updatePlayerStat = (
    playerId: number,
    stat:
      | 'goals'
      | 'assists'
      | 'yellow_card'
      | 'red_card'
      | 'foul_committed'
      | 'foul_received'
      | 'shot_on_target'
      | 'shot_off_target'
      | 'save'
  ) => {
    const isHomePlayer = homeTeam.players.some((p) => p.id === playerId);

    if (stat === 'goals') {
      // For goals, we create a goal record
      const newGoal = GameStatsService.createGoal(
        playerId,
        undefined,
        gameTime
      );

      if (isHomePlayer) {
        setHomeTeam((prevTeam) => ({
          ...prevTeam,
          goals: [...prevTeam.goals, newGoal],
        }));
      } else {
        setAwayTeam((prevTeam) => ({
          ...prevTeam,
          goals: [...prevTeam.goals, newGoal],
        }));
      }
    } else if (stat === 'assists') {
      // For assists, we would need to associate with an existing goal
      // This is a limitation of the quick stat buttons - better to use the goal modal
      console.log('Assist tracking requires goal association - use goal modal');
    } else {
      // For all other stats, create a stat event
      const newStatEvent = GameStatsService.createStatEvent(
        playerId,
        stat,
        gameTime
      );

      if (isHomePlayer) {
        setHomeTeam((prevTeam) => ({
          ...prevTeam,
          statEvents: [...prevTeam.statEvents, newStatEvent],
        }));
      } else {
        setAwayTeam((prevTeam) => ({
          ...prevTeam,
          statEvents: [...prevTeam.statEvents, newStatEvent],
        }));
      }
    }
  };

  // Substitution management
  const substitutePlayer = (playerOutId: number, playerInId: number) => {
    // Determine which team the players belong to
    const isHomeTeam = homeTeam.players.some((p) => p.id === playerOutId);

    if (isHomeTeam) {
      setHomeTeam((prevTeam) => ({
        ...prevTeam,
        players: prevTeam.players.map((player) => {
          if (player.id === playerOutId) {
            return { ...player, isOnField: false };
          }
          if (player.id === playerInId) {
            return { ...player, isOnField: true };
          }
          return player;
        }),
      }));
    } else {
      setAwayTeam((prevTeam) => ({
        ...prevTeam,
        players: prevTeam.players.map((player) => {
          if (player.id === playerOutId) {
            return { ...player, isOnField: false };
          }
          if (player.id === playerInId) {
            return { ...player, isOnField: true };
          }
          return player;
        }),
      }));
    }
  };

  // Smart substitution recommendations for current team
  const getSubstitutionRecommendations = (
    team: Team
  ): SubstitutionRecommendation[] => {
    const playersOnField = team.players.filter((p) => p.isOnField);
    const playersOnBench = team.players.filter((p) => !p.isOnField);
    const recommendations: SubstitutionRecommendation[] = [];

    // Find tired players (high play time)
    const avgPlayTime =
      playersOnField.reduce((sum, p) => sum + p.playTime, 0) /
      playersOnField.length;
    const tiredPlayers = playersOnField.filter(
      (p) => p.playTime > avgPlayTime * 1.3
    );

    tiredPlayers.forEach((tiredPlayer) => {
      const replacement = playersOnBench
        .filter((p) => p.position === tiredPlayer.position)
        .sort((a, b) => a.playTime - b.playTime)[0];

      if (replacement) {
        recommendations.push({
          playerOut: tiredPlayer,
          playerIn: replacement,
          reason: `Rest tired player - ${formatTime(
            tiredPlayer.playTime
          )} played`,
        });
      }
    });

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  };

  // Initialize empty teams on mount
  useEffect(() => {
    if (homeTeam.players.length === 0 && awayTeam.players.length === 0) {
      setHomeTeam({
        name: gameConfig.homeTeamName,
        players: [],
        goals: [],
        statEvents: [],
        isDetailedTracking: gameConfig.homeTeamDetailedTracking,
      });
      setAwayTeam({
        name: gameConfig.awayTeamName,
        players: [],
        goals: [],
        statEvents: [],
        isDetailedTracking: gameConfig.awayTeamDetailedTracking,
      });
    }
  }, [
    homeTeam.players.length,
    awayTeam.players.length,
    gameConfig.homeTeamName,
    gameConfig.awayTeamName,
  ]);

  // Computed values
  const getCurrentTeam = () => (activeTab === 'home' ? homeTeam : awayTeam);
  const currentTeam = getCurrentTeam();
  const substitutionRecommendations =
    getSubstitutionRecommendations(currentTeam);
  const availablePlayers =
    goalTeam === 'home'
      ? homeTeam.players.filter((p) => p.isOnField)
      : awayTeam.players.filter((p) => p.isOnField);
  const playersOnField = currentTeam.players.filter((p) => p.isOnField);
  const playersOnBench = currentTeam.players.filter((p) => !p.isOnField);
  const homeScore = GameStatsService.getTeamScore(homeTeam);
  const awayScore = GameStatsService.getTeamScore(awayTeam);

  // Return state and actions
  const gameData: GameData = {
    gameConfig,
    homeTeam,
    awayTeam,
    gameStarted,
    gameTime,
    isGameRunning,
    activeTab,
    showGoalModal,
    goalTeam,
    selectedScorer,
    selectedAssist,
  };

  const gameActions: GameActions = {
    handleTeamChange,
    loadTestData,
    clearTeams,
    addPosition,
    removePosition,
    updatePosition,
    setGameConfig,
    startGame,
    resetGame,
    saveAndNewGame,
    toggleGame,
    setActiveTab,
    openGoalModal,
    closeGoalModal,
    recordGoal,
    recordOpponentGoal,
    updatePlayerStat,
    setSelectedScorer,
    setSelectedAssist,
    substitutePlayer,
  };

  const derivedData: DerivedGameData = {
    homeScore,
    awayScore,
    currentTeam,
    playersOnField,
    playersOnBench,
    substitutionRecommendations,
    availablePlayers,
  };

  return {
    gameData,
    gameActions,
    derivedData,
    defaultGameConfig,
  };
};

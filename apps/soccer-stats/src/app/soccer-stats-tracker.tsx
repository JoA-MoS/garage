import { useState, useEffect } from 'react';

import { GameConfig, SubstitutionRecommendation, Team } from './types';
import { formatTime } from './utils';
import { ConfigTab } from './components/ConfigTab';
import { GameHeader } from './components/GameHeader';
import { GoalModal } from './components/GoalModal';
import { LineupTab } from './components/LineupTab';
import { StatsTab } from './components/StatsTab';
import { SubstitutionsTab } from './components/SubstitutionsTab';

const SoccerStatsTracker = () => {
  // Default configuration
  const defaultGameConfig: GameConfig = {
    playersPerTeam: 11,
    playersOnField: 11,
    positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    homeTeamName: 'Home Team',
    awayTeamName: 'Away Team',
  };

  // State management
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig);
  const [homeTeam, setHomeTeam] = useState<Team>({
    name: 'Home Team',
    players: [],
    score: 0,
  });
  const [awayTeam, setAwayTeam] = useState<Team>({
    name: 'Away Team',
    players: [],
    score: 0,
  });
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

  const recordGoal = (scorerId: number, assistId: number | null) => {
    if (goalTeam === 'home') {
      setHomeTeam((prevTeam) => ({
        ...prevTeam,
        score: prevTeam.score + 1,
        players: prevTeam.players.map((player) => {
          if (player.id === scorerId) {
            return { ...player, goals: player.goals + 1 };
          }
          if (assistId && player.id === assistId) {
            return { ...player, assists: player.assists + 1 };
          }
          return player;
        }),
      }));
    } else {
      setAwayTeam((prevTeam) => ({
        ...prevTeam,
        score: prevTeam.score + 1,
        players: prevTeam.players.map((player) => {
          if (player.id === scorerId) {
            return { ...player, goals: player.goals + 1 };
          }
          if (assistId && player.id === assistId) {
            return { ...player, assists: player.assists + 1 };
          }
          return player;
        }),
      }));
    }

    setShowGoalModal(false);
  };

  const updatePlayerStat = (playerId: number, stat: 'goals' | 'assists') => {
    // Determine which team the player belongs to
    const isHomePlayer = homeTeam.players.some((p) => p.id === playerId);

    if (isHomePlayer) {
      setHomeTeam((prevTeam) => ({
        ...prevTeam,
        players: prevTeam.players.map((player) =>
          player.id === playerId
            ? { ...player, [stat]: player[stat] + 1 }
            : player
        ),
      }));
    } else {
      setAwayTeam((prevTeam) => ({
        ...prevTeam,
        players: prevTeam.players.map((player) =>
          player.id === playerId
            ? { ...player, [stat]: player[stat] + 1 }
            : player
        ),
      }));
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

  // Get current team based on active tab
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

  // Initialize empty teams on mount
  useEffect(() => {
    if (homeTeam.players.length === 0 && awayTeam.players.length === 0) {
      setHomeTeam({
        name: gameConfig.homeTeamName,
        score: 0,
        players: [],
      });
      setAwayTeam({
        name: gameConfig.awayTeamName,
        score: 0,
        players: [],
      });
    }
  }, [
    homeTeam.players.length,
    awayTeam.players.length,
    gameConfig.homeTeamName,
    gameConfig.awayTeamName,
  ]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {!gameStarted ? (
        <ConfigTab
          gameConfig={gameConfig}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          addPosition={addPosition}
          removePosition={removePosition}
          updatePosition={updatePosition}
          setGameConfig={setGameConfig}
          onTeamChange={handleTeamChange}
          startGame={startGame}
          defaultGameConfig={defaultGameConfig}
        />
      ) : (
        <>
          <GameHeader
            homeTeamName={gameConfig.homeTeamName}
            awayTeamName={gameConfig.awayTeamName}
            homeScore={homeTeam.score}
            awayScore={awayTeam.score}
            gameTime={gameTime}
            isGameRunning={isGameRunning}
            onToggleGame={() => setIsGameRunning(!isGameRunning)}
            onGoalClick={openGoalModal}
            onResetGame={resetGame}
          />

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'home'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {gameConfig.homeTeamName} Team
            </button>
            <button
              onClick={() => setActiveTab('away')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'away'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {gameConfig.awayTeamName} Team
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'stats'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Statistics
            </button>
          </div>

          {/* Tab Content */}
          {(activeTab === 'home' || activeTab === 'away') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LineupTab
                  playersOnField={playersOnField}
                  playersOnBench={playersOnBench}
                  onStatUpdate={updatePlayerStat}
                />
              </div>
              <div>
                <SubstitutionsTab
                  playersOnField={playersOnField}
                  playersOnBench={playersOnBench}
                  onSubstitute={substitutePlayer}
                  substitutionRecommendations={substitutionRecommendations}
                />
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <StatsTab
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              gameTime={gameTime}
            />
          )}

          {/* Goal Modal */}
          {showGoalModal && (
            <GoalModal
              goalTeam={goalTeam}
              onClose={() => setShowGoalModal(false)}
              onRecordGoal={recordGoal}
              availablePlayers={availablePlayers}
              homeTeamName={gameConfig.homeTeamName}
              awayTeamName={gameConfig.awayTeamName}
              selectedScorer={selectedScorer}
              setSelectedScorer={setSelectedScorer}
              selectedAssist={selectedAssist}
              setSelectedAssist={setSelectedAssist}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SoccerStatsTracker;

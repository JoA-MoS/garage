import { useNavigate } from 'react-router-dom';

import { ConfigTab } from '../components/config-tab';
import { useGameContext } from '../context/game.context';

/**
 * New game setup page - team configuration and game setup
 */
export const NewGamePage = () => {
  const navigate = useNavigate();
  const { gameData, gameActions, defaultGameConfig } = useGameContext();

  const { gameConfig, homeTeam, awayTeam } = gameData;

  const {
    handleTeamChange,
    loadTestData,
    clearTeams,
    addPosition,
    removePosition,
    updatePosition,
    setGameConfig,
    startGame,
  } = gameActions;

  const handleStartGame = () => {
    startGame();
    // Navigate to the game page with a generated game ID
    const gameId = Date.now().toString(); // Simple ID generation for now
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Setup New Game</h1>
          <p className="text-gray-600 mt-2">
            Configure teams and game settings before starting
          </p>
        </div>

        <ConfigTab
          gameConfig={gameConfig}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          addPosition={addPosition}
          removePosition={removePosition}
          updatePosition={updatePosition}
          setGameConfig={setGameConfig}
          onTeamChange={handleTeamChange}
          startGame={handleStartGame}
          defaultGameConfig={defaultGameConfig}
          loadTestData={loadTestData}
          clearTeams={clearTeams}
        />
      </div>
    </div>
  );
};

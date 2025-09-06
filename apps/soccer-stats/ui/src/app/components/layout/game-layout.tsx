import { Outlet, useParams } from 'react-router';

import { GameHeaderSmart } from '../smart/game-header.smart';
import { GameNavigationSmart } from '../smart/game-navigation.smart';
import { useGameContext } from '../../context/game.context';

/**
 * Layout component for game-specific pages
 * Provides game header and tab navigation
 */
export const GameLayout = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { gameData, gameActions } = useGameContext();

  const { gameConfig, homeTeam, awayTeam, gameTime, isGameRunning } = gameData;

  const { toggleGame, openGoalModal, resetGame, saveAndNewGame } = gameActions;

  return (
    <div className="max-w-6xl mx-auto">
      <GameHeaderSmart
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeTeamName={gameConfig.homeTeamName}
        awayTeamName={gameConfig.awayTeamName}
        gameTime={gameTime}
        isGameRunning={isGameRunning}
        onToggleGame={toggleGame}
        onGoalClick={openGoalModal}
        onResetGame={resetGame}
        onSaveAndNewGame={saveAndNewGame}
      />

      <GameNavigationSmart
        homeTeamName={gameConfig.homeTeamName}
        awayTeamName={gameConfig.awayTeamName}
      />

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
};

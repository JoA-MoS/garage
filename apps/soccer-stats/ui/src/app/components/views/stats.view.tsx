import { StatsTabSmart } from '../smart/stats-tab.smart';
import { useGameContext } from '../../context/game.context';

/**
 * Game statistics view
 */
export const StatsView = () => {
  const { gameData } = useGameContext();

  const { homeTeam, awayTeam, gameTime } = gameData;

  return (
    <StatsTabSmart
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      gameTime={gameTime}
    />
  );
};

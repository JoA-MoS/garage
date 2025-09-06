import { RosterViewSmart } from '../smart/roster-view.smart';
import { useGameContext } from '../../context/game.context';

/**
 * Combined roster view for both teams
 */
export const RosterView = () => {
  const { gameData } = useGameContext();

  const { homeTeam, awayTeam, gameConfig } = gameData;

  return (
    <RosterViewSmart
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      homeTeamName={gameConfig.homeTeamName}
      awayTeamName={gameConfig.awayTeamName}
    />
  );
};

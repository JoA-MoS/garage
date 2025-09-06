import { LineupTabSmart } from '../smart/lineup-tab.smart';
import { SubstitutionsTabSmart } from '../smart/substitutions-tab.smart';
import { useGameContext } from '../../context/game.context';

/**
 * Home team lineup view
 */
export const HomeLineupView = () => {
  const { gameData, gameActions } = useGameContext();

  const { homeTeam, gameTime } = gameData;
  const { updatePlayerStat, substitutePlayer } = gameActions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <LineupTabSmart
          team={homeTeam}
          onStatUpdate={updatePlayerStat}
          showPhase1Stats={true}
        />
      </div>
      <div>
        <SubstitutionsTabSmart
          team={homeTeam}
          gameTime={gameTime}
          onSubstitute={substitutePlayer}
        />
      </div>
    </div>
  );
};

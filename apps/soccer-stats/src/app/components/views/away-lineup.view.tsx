import { LineupTabSmart } from '../smart/lineup-tab.smart';
import { SubstitutionsTabSmart } from '../smart/substitutions-tab.smart';
import { useGameContext } from '../../context/game.context';

/**
 * Away team lineup view
 */
export const AwayLineupView = () => {
  const { gameData, gameActions } = useGameContext();

  const { awayTeam, gameTime } = gameData;
  const { updatePlayerStat, substitutePlayer } = gameActions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <LineupTabSmart
          team={awayTeam}
          onStatUpdate={updatePlayerStat}
          showPhase1Stats={true}
        />
      </div>
      <div>
        <SubstitutionsTabSmart
          team={awayTeam}
          gameTime={gameTime}
          onSubstitute={substitutePlayer}
        />
      </div>
    </div>
  );
};

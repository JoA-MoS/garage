import { formatTime } from '../../utils';

export interface GameOverviewProps {
  /** Total goals scored in the game */
  totalGoals: number;
  /** Total assists in the game */
  totalAssists: number;
  /** Game time in seconds */
  gameTime: number;
  /** Percentage of goals with assists */
  assistRate: number;
}

/**
 * Overview card showing game statistics summary.
 * Displays total goals, assists, game time, and assist rate.
 */
export const GameOverview = ({
  totalGoals,
  totalAssists,
  gameTime,
  assistRate,
}: GameOverviewProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-4 text-lg font-semibold">Game Overview</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalGoals}</div>
          <div className="text-sm text-gray-600">Total Goals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {totalAssists}
          </div>
          <div className="text-sm text-gray-600">Total Assists</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatTime(gameTime)}
          </div>
          <div className="text-sm text-gray-600">Game Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{assistRate}%</div>
          <div className="text-sm text-gray-600">Assist Rate</div>
        </div>
      </div>
    </div>
  );
};

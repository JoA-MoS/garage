import { formatTime } from '../../utils';

interface GameOverviewPresentationProps {
  totalGoals: number;
  totalAssists: number;
  gameTime: number;
  assistRate: number;
}

export const GameOverviewPresentation = ({
  totalGoals,
  totalAssists,
  gameTime,
  assistRate,
}: GameOverviewPresentationProps) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Game Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

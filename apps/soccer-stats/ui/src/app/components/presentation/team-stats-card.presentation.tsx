import { Team } from '../../types';

interface TeamStatsCardPresentationProps {
  team: Team;
  teamType: 'home' | 'away';
  goals: number;
  assists: number;
  playersOnField: number;
}

export const TeamStatsCardPresentation = ({
  team,
  teamType,
  goals,
  assists,
  playersOnField,
}: TeamStatsCardPresentationProps) => {
  const headerColorClass =
    teamType === 'home' ? 'text-blue-700' : 'text-red-700';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className={`text-lg font-semibold mb-4 ${headerColorClass}`}>
        {team.name} Statistics
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Goals:</span>
          <span className="font-semibold text-blue-600">{goals}</span>
        </div>
        <div className="flex justify-between">
          <span>Assists:</span>
          <span className="font-semibold text-purple-600">{assists}</span>
        </div>
        <div className="flex justify-between">
          <span>Players on Field:</span>
          <span className="font-semibold">{playersOnField}</span>
        </div>
      </div>
    </div>
  );
};

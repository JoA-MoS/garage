import { Player } from '../../types';
import { formatTime } from '../../utils';

interface PlayerStatsTablePresentationProps {
  allPlayers: Array<{
    player: Player;
    team: 'home' | 'away';
    teamName: string;
    goals: number;
    assists: number;
  }>;
}

export const PlayerStatsTablePresentation = ({
  allPlayers,
}: PlayerStatsTablePresentationProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">All Player Statistics</h3>
      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Team</th>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Player</th>
              <th className="px-4 py-2 text-left">Position</th>
              <th className="px-4 py-2 text-left">Play Time</th>
              <th className="px-4 py-2 text-left">Goals</th>
              <th className="px-4 py-2 text-left">Assists</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {allPlayers.map(({ player, team, teamName, goals, assists }) => (
              <tr key={`${team}-${player.id}`} className="border-t">
                <td className="px-4 py-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      team === 'home' ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                  ></span>
                  {teamName}
                </td>
                <td className="px-4 py-2 font-mono">{player.jersey}</td>
                <td className="px-4 py-2 font-medium">{player.name}</td>
                <td className="px-4 py-2">{player.position}</td>
                <td className="px-4 py-2 font-mono">
                  {formatTime(player.playTime)}
                </td>
                <td className="px-4 py-2 font-semibold text-blue-600">
                  {goals}
                </td>
                <td className="px-4 py-2 font-semibold text-purple-600">
                  {assists}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      player.isOnField
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {player.isOnField ? 'On Field' : 'Bench'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import {
  GameOverview,
  TeamStatsCard,
} from '@garage/soccer-stats/ui-components';

import { Player, Team } from '../../types';

interface StatsTabPresentationProps {
  homeTeam: Team;
  awayTeam: Team;
  gameTime: number;
  homeGoals: number;
  awayGoals: number;
  homeAssists: number;
  awayAssists: number;
  totalGoals: number;
  totalAssists: number;
  assistRate: number;
  allPlayers: Array<{
    player: Player;
    team: 'home' | 'away';
    teamName: string;
    goals: number;
    assists: number;
  }>;
}

// Format time as MM:SS
const formatTime = (playTime: number): string => {
  const minutes = Math.floor(playTime / 60);
  const seconds = playTime % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const StatsTabPresentation = ({
  homeTeam,
  awayTeam,
  gameTime,
  homeGoals,
  awayGoals,
  homeAssists,
  awayAssists,
  totalGoals,
  totalAssists,
  assistRate,
  allPlayers,
}: StatsTabPresentationProps) => {
  const homePlayersOnField = homeTeam.players.filter((p) => p.isOnField).length;
  const awayPlayersOnField = awayTeam.players.filter((p) => p.isOnField).length;

  return (
    <div className="space-y-6">
      {/* Game Overview */}
      <GameOverview
        totalGoals={totalGoals}
        totalAssists={totalAssists}
        gameTime={gameTime}
        assistRate={assistRate}
      />

      {/* Team Statistics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TeamStatsCard
          team={homeTeam}
          teamType="home"
          goals={homeGoals}
          assists={homeAssists}
          playersOnField={homePlayersOnField}
        />
        <TeamStatsCard
          team={awayTeam}
          teamType="away"
          goals={awayGoals}
          assists={awayAssists}
          playersOnField={awayPlayersOnField}
        />
      </div>

      {/* All Players Table - Inline rendering for legacy data structure */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">All Player Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full rounded-lg border border-gray-200 bg-white">
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
                      className={`mr-2 inline-block h-3 w-3 rounded-full ${
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
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
    </div>
  );
};

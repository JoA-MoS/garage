import { Team } from '../types';
import { formatTime } from '../utils';
import { GameStatsService } from '../services/game-stats.service';

interface StatsTabProps {
  homeTeam: Team;
  awayTeam: Team;
  gameTime: number;
}

export const StatsTab = ({ homeTeam, awayTeam, gameTime }: StatsTabProps) => {
  const allPlayers = [...homeTeam.players, ...awayTeam.players];

  // Helper function to determine which team a player belongs to
  const getPlayerTeam = (playerId: number): 'home' | 'away' => {
    return homeTeam.players.some((p) => p.id === playerId) ? 'home' : 'away';
  };

  // Helper function to get the team object for a player
  const getPlayerTeamObject = (playerId: number) => {
    return getPlayerTeam(playerId) === 'home' ? homeTeam : awayTeam;
  };

  // Calculate total goals and assists from all players
  const totalGoals =
    homeTeam.players.reduce(
      (sum, p) => sum + GameStatsService.getPlayerGoals(p.id, homeTeam),
      0
    ) +
    awayTeam.players.reduce(
      (sum, p) => sum + GameStatsService.getPlayerGoals(p.id, awayTeam),
      0
    );
  const totalAssists =
    homeTeam.players.reduce(
      (sum, p) => sum + GameStatsService.getPlayerAssists(p.id, homeTeam),
      0
    ) +
    awayTeam.players.reduce(
      (sum, p) => sum + GameStatsService.getPlayerAssists(p.id, awayTeam),
      0
    );

  const homeGoals = GameStatsService.getTeamScore(homeTeam);
  const awayGoals = GameStatsService.getTeamScore(awayTeam);

  const homeAssists = homeTeam.players.reduce(
    (sum, p) => sum + GameStatsService.getPlayerAssists(p.id, homeTeam),
    0
  );
  const awayAssists = awayTeam.players.reduce(
    (sum, p) => sum + GameStatsService.getPlayerAssists(p.id, awayTeam),
    0
  );

  return (
    <div className="space-y-6">
      {/* Game Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Game Time</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatTime(gameTime)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Total Goals</h3>
          <p className="text-2xl font-bold text-green-600">{totalGoals}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 mb-2">Total Assists</h3>
          <p className="text-2xl font-bold text-purple-600">{totalAssists}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800 mb-2">Score</h3>
          <p className="text-2xl font-bold text-orange-600">
            {GameStatsService.getTeamScore(homeTeam)} -{' '}
            {GameStatsService.getTeamScore(awayTeam)}
          </p>
        </div>
      </div>

      {/* Team Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-blue-700">
            {homeTeam.name} Statistics
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Goals:</span>
              <span className="font-semibold text-blue-600">{homeGoals}</span>
            </div>
            <div className="flex justify-between">
              <span>Assists:</span>
              <span className="font-semibold text-purple-600">
                {homeAssists}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Players on Field:</span>
              <span className="font-semibold">
                {homeTeam.players.filter((p) => p.isOnField).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-red-700">
            {awayTeam.name} Statistics
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Goals:</span>
              <span className="font-semibold text-blue-600">{awayGoals}</span>
            </div>
            <div className="flex justify-between">
              <span>Assists:</span>
              <span className="font-semibold text-purple-600">
                {awayAssists}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Players on Field:</span>
              <span className="font-semibold">
                {awayTeam.players.filter((p) => p.isOnField).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* All Players Table */}
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
              {allPlayers
                .sort(
                  (a, b) =>
                    getPlayerTeam(a.id).localeCompare(getPlayerTeam(b.id)) ||
                    a.jersey - b.jersey
                )
                .map((player) => {
                  const playerTeam = getPlayerTeam(player.id);
                  const teamObject = getPlayerTeamObject(player.id);
                  return (
                    <tr key={`${playerTeam}-${player.id}`} className="border-t">
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block w-3 h-3 rounded-full mr-2 ${
                            playerTeam === 'home' ? 'bg-blue-500' : 'bg-red-500'
                          }`}
                        ></span>
                        {playerTeam === 'home' ? homeTeam.name : awayTeam.name}
                      </td>
                      <td className="px-4 py-2 font-mono">{player.jersey}</td>
                      <td className="px-4 py-2 font-medium">{player.name}</td>
                      <td className="px-4 py-2">{player.position}</td>
                      <td className="px-4 py-2 font-mono">
                        {formatTime(player.playTime)}
                      </td>
                      <td className="px-4 py-2 font-semibold text-blue-600">
                        {GameStatsService.getPlayerGoals(player.id, teamObject)}
                      </td>
                      <td className="px-4 py-2 font-semibold text-purple-600">
                        {GameStatsService.getPlayerAssists(
                          player.id,
                          teamObject
                        )}
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
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

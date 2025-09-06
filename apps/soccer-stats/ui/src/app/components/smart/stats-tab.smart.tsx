import { Team } from '../../types';
import { GameStatsService } from '../../services/game-stats.service';
import { StatsTabPresentation } from '../presentation/stats-tab.presentation';

interface StatsTabSmartProps {
  homeTeam: Team;
  awayTeam: Team;
  gameTime: number;
}

export const StatsTabSmart = ({
  homeTeam,
  awayTeam,
  gameTime,
}: StatsTabSmartProps) => {
  const allPlayers = [...homeTeam.players, ...awayTeam.players];

  // Helper function to determine which team a player belongs to
  const getPlayerTeam = (playerId: number): 'home' | 'away' => {
    return homeTeam.players.some((p) => p.id === playerId) ? 'home' : 'away';
  };

  // Helper function to get the team object for a player
  const getPlayerTeamObject = (playerId: number) => {
    return getPlayerTeam(playerId) === 'home' ? homeTeam : awayTeam;
  };

  // Calculate statistics
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

  const totalGoals = homeGoals + awayGoals;
  const totalAssists = homeAssists + awayAssists;
  const assistRate =
    totalGoals > 0 ? Math.round((totalAssists / totalGoals) * 100) : 0;

  // Prepare player data with computed stats
  const allPlayersWithStats = allPlayers
    .sort(
      (a, b) =>
        getPlayerTeam(a.id).localeCompare(getPlayerTeam(b.id)) ||
        a.jersey - b.jersey
    )
    .map((player) => {
      const playerTeam = getPlayerTeam(player.id);
      const teamObject = getPlayerTeamObject(player.id);
      return {
        player,
        team: playerTeam,
        teamName: playerTeam === 'home' ? homeTeam.name : awayTeam.name,
        goals: GameStatsService.getPlayerGoals(player.id, teamObject),
        assists: GameStatsService.getPlayerAssists(player.id, teamObject),
      };
    });

  return (
    <StatsTabPresentation
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      gameTime={gameTime}
      homeGoals={homeGoals}
      awayGoals={awayGoals}
      homeAssists={homeAssists}
      awayAssists={awayAssists}
      totalGoals={totalGoals}
      totalAssists={totalAssists}
      assistRate={assistRate}
      allPlayers={allPlayersWithStats}
    />
  );
};

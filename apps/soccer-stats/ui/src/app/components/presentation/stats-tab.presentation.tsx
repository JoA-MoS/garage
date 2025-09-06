import { Player, Team } from '../../types';

import { GameOverviewPresentation } from './game-overview.presentation';
import { TeamStatsCardPresentation } from './team-stats-card.presentation';
import { PlayerStatsTablePresentation } from './player-stats-table.presentation';

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
      <GameOverviewPresentation
        totalGoals={totalGoals}
        totalAssists={totalAssists}
        gameTime={gameTime}
        assistRate={assistRate}
      />

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamStatsCardPresentation
          team={homeTeam}
          teamType="home"
          goals={homeGoals}
          assists={homeAssists}
          playersOnField={homePlayersOnField}
        />
        <TeamStatsCardPresentation
          team={awayTeam}
          teamType="away"
          goals={awayGoals}
          assists={awayAssists}
          playersOnField={awayPlayersOnField}
        />
      </div>

      {/* All Players Table */}
      <PlayerStatsTablePresentation allPlayers={allPlayers} />
    </div>
  );
};

import { TeamStatsPresentation } from '../presentation/team-stats.presentation';

interface TeamStatsSmartProps {
  team: {
    name: string;
    teamPlayers?: Array<{ isActive: boolean }>;
    gameTeams?: Array<{ finalScore?: number }>;
  } | null;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export const TeamStatsSmart = ({
  team,
  isLoading = false,
  error,
  onRetry,
}: TeamStatsSmartProps) => {
  if (!team) {
    return (
      <TeamStatsPresentation
        teamName="Unknown Team"
        playerCount={0}
        gamesPlayed={0}
        wins={0}
        draws={0}
        losses={0}
        winRate={0}
        goalsScored={0}
        assists={0}
        playTimeHours={0}
        redCards={0}
        activePlayerCount={0}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
      />
    );
  }

  // Calculate player count from teamPlayers
  const playerCount = team.teamPlayers?.length || 0;
  const activePlayerCount =
    team.teamPlayers?.filter((player) => player.isActive)?.length || 0;

  // Calculate basic game statistics
  const gameStats = team.gameTeams?.reduce(
    (stats, gameTeam) => {
      const finalScore = gameTeam.finalScore || 0;
      const isWin = finalScore > 0; // Simplified win logic - will need opponent data for accurate calculation
      const isLoss = finalScore < 0; // Simplified loss logic

      return {
        gamesPlayed: stats.gamesPlayed + 1,
        wins: isWin ? stats.wins + 1 : stats.wins,
        draws: stats.draws, // TODO: Implement draw logic when opponent scores are available
        losses: isLoss ? stats.losses + 1 : stats.losses,
      };
    },
    { gamesPlayed: 0, wins: 0, draws: 0, losses: 0 }
  ) || { gamesPlayed: 0, wins: 0, draws: 0, losses: 0 };

  // Calculate win rate
  const winRate =
    gameStats.gamesPlayed > 0
      ? Math.round((gameStats.wins / gameStats.gamesPlayed) * 100)
      : 0;

  // For now, set placeholder values for detailed statistics
  // These will be calculated when game events and detailed player stats are available
  const teamPerformanceStats = {
    goalsScored: 0, // TODO: Calculate from game events
    assists: 0, // TODO: Calculate from game events
    redCards: 0, // TODO: Calculate from game events
    playTimeHours: 0, // TODO: Calculate from actual play time data
  };

  // TODO: Calculate top performers from detailed player statistics
  const topScorerName = undefined;
  const topAssisterName = undefined;
  const mostMinutesPlayerName = undefined;

  return (
    <TeamStatsPresentation
      teamName={team.name}
      playerCount={playerCount}
      gamesPlayed={gameStats.gamesPlayed}
      wins={gameStats.wins}
      draws={gameStats.draws}
      losses={gameStats.losses}
      winRate={winRate}
      goalsScored={teamPerformanceStats.goalsScored}
      assists={teamPerformanceStats.assists}
      playTimeHours={teamPerformanceStats.playTimeHours}
      redCards={teamPerformanceStats.redCards}
      activePlayerCount={activePlayerCount}
      topScorerName={topScorerName}
      topAssisterName={topAssisterName}
      mostMinutesPlayerName={mostMinutesPlayerName}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
};

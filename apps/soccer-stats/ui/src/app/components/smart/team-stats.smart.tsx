import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { TeamStats } from '@garage/soccer-stats/ui-components';
import type { PlayerStatRow } from '@garage/soccer-stats/ui-components';

import type {
  TeamStatsResponseData,
  PlayerGameStatsRowData,
} from '../../services/team-stats-graphql.service';

interface TeamStatsSmartProps {
  data: TeamStatsResponseData;
  startDate?: string;
  endDate?: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onClearDateRange: () => void;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

function mapPlayerStats(
  players: PlayerGameStatsRowData[],
): PlayerStatRow[] {
  return players.map((p) => ({
    playerId: p.playerId ?? undefined,
    playerName: p.playerName ?? undefined,
    externalPlayerName: p.externalPlayerName ?? undefined,
    externalPlayerNumber: p.externalPlayerNumber ?? undefined,
    goals: p.goals,
    assists: p.assists,
    yellowCards: p.yellowCards,
    redCards: p.redCards,
    totalMinutes: p.totalMinutes,
    totalSeconds: p.totalSeconds,
    gamesPlayed: p.gamesPlayed,
  }));
}

export const TeamStatsSmart = ({
  data,
  startDate,
  endDate,
  onDateRangeChange,
  onClearDateRange,
  isLoading = false,
  error,
  onRetry,
}: TeamStatsSmartProps) => {
  const navigate = useNavigate();

  const handleGameClick = useCallback(
    (gameId: string, gameTeamId?: string) => {
      if (gameTeamId) {
        navigate(`/teams/${data.teamId}/games/${gameTeamId}/stats`);
      } else {
        navigate(`/games/${gameId}/stats`);
      }
    },
    [navigate, data.teamId],
  );

  const playerStats = mapPlayerStats(data.playerStats);

  // Determine top performers
  const topScorer = [...playerStats]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)[0];
  const topAssister = [...playerStats]
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists)[0];
  const mostMinutes = [...playerStats].sort(
    (a, b) =>
      b.totalMinutes * 60 + b.totalSeconds - (a.totalMinutes * 60 + a.totalSeconds),
  )[0];

  const gameBreakdown = data.gameBreakdown.map((game) => ({
    gameId: game.gameId,
    gameTeamId: game.gameTeamId,
    gameName: game.gameName ?? undefined,
    gameDate: game.gameDate ?? undefined,
    opponentName: game.opponentName ?? undefined,
    teamScore: game.teamScore ?? null,
    opponentScore: game.opponentScore ?? null,
    result: game.result,
    totalGoals: game.totalGoals,
    totalAssists: game.totalAssists,
    playerStats: mapPlayerStats(game.playerStats),
  }));

  const { aggregateStats } = data;

  // Calculate total play time in hours for display
  const totalPlayTimeMinutes = playerStats.reduce(
    (sum, p) => sum + p.totalMinutes,
    0,
  );

  return (
    <TeamStats
      teamName={data.teamName}
      gamesPlayed={aggregateStats.gamesPlayed}
      wins={aggregateStats.wins}
      draws={aggregateStats.draws}
      losses={aggregateStats.losses}
      winRate={aggregateStats.winRate}
      goalsFor={aggregateStats.goalsFor}
      goalsAgainst={aggregateStats.goalsAgainst}
      goalDifference={aggregateStats.goalDifference}
      totalAssists={aggregateStats.totalAssists}
      totalYellowCards={aggregateStats.totalYellowCards}
      totalRedCards={aggregateStats.totalRedCards}
      playerCount={playerStats.length}
      activePlayerCount={playerStats.filter((p) => p.gamesPlayed > 0).length}
      playerStats={playerStats}
      gameBreakdown={gameBreakdown}
      topScorerName={
        topScorer
          ? `${topScorer.playerName ?? topScorer.externalPlayerName ?? 'Unknown'} (${topScorer.goals})`
          : undefined
      }
      topAssisterName={
        topAssister
          ? `${topAssister.playerName ?? topAssister.externalPlayerName ?? 'Unknown'} (${topAssister.assists})`
          : undefined
      }
      mostMinutesPlayerName={
        mostMinutes && mostMinutes.totalMinutes > 0
          ? `${mostMinutes.playerName ?? mostMinutes.externalPlayerName ?? 'Unknown'} (${Math.round(totalPlayTimeMinutes > 0 ? mostMinutes.totalMinutes : 0)}m)`
          : undefined
      }
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={onDateRangeChange}
      onClearDateRange={onClearDateRange}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onGameClick={handleGameClick}
    />
  );
};

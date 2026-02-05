import { useMemo, memo } from 'react';

import {
  PlayerStatsTablePresentation,
  ColumnKey,
} from '../presentation/player-stats-table.presentation';

// Type for player with nested stats from game query
interface PlayerWithStats {
  gameEventId: string;
  playerId?: string | null;
  playerName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  position?: string | null;
  isOnField: boolean;
  stats?: {
    totalSeconds: number;
    positionTimes: Array<{
      position: string;
      minutes: number;
      seconds: number;
    }>;
    goals: number;
    assists: number;
    lastEntryPeriodSecond?: number | null;
    currentPosition?: string | null;
  } | null;
}

interface GameStatsProps {
  teamName: string;
  teamColor?: string;
  players: PlayerWithStats[];
  /**
   * Current elapsed period seconds for live time calculation.
   * This is PERIOD-RELATIVE: computed by parent using useSyncedGameTime hook.
   * Used to calculate live time for on-field players:
   *   liveTime = bankedTime + (elapsedSeconds - lastEntryPeriodSecond)
   * Undefined if game is not actively playing (halftime, not started, etc.)
   */
  elapsedSeconds?: number;
  isLoading?: boolean;
}

// Columns to show for game-level stats
const GAME_STATS_COLUMNS: ColumnKey[] = [
  'player',
  'time',
  'positions',
  'goals',
  'assists',
];

export const GameStats = memo(function GameStats({
  teamName,
  teamColor,
  players,
  elapsedSeconds,
  isLoading,
}: GameStatsProps) {
  // Transform players with nested stats to flat stats format for presentation
  // Deduplicate by playerId/externalPlayerName to avoid React key warnings
  const stats = useMemo(() => {
    const seen = new Set<string>();
    return players
      .filter((p) => p.stats) // Only include players with stats
      .filter((player) => {
        // Deduplicate by player identifier
        const key =
          player.playerId || player.externalPlayerName || player.gameEventId;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((player) => {
        const s = player.stats!;
        return {
          playerId: player.playerId,
          playerName: player.playerName,
          externalPlayerName: player.externalPlayerName,
          externalPlayerNumber: player.externalPlayerNumber,
          totalMinutes: Math.floor(s.totalSeconds / 60),
          totalSeconds: s.totalSeconds % 60,
          positionTimes: s.positionTimes,
          goals: s.goals,
          assists: s.assists,
          gamesPlayed: 1, // Single game context
          isOnField: player.isOnField, // Use player-level isOnField (single source of truth)
          lastEntryGameSeconds: s.lastEntryPeriodSecond,
          currentPosition: s.currentPosition,
        };
      });
  }, [players]);

  return (
    <PlayerStatsTablePresentation
      stats={stats}
      columns={GAME_STATS_COLUMNS}
      title={`${teamName} Player Statistics`}
      emptyMessage="No player statistics for this game yet"
      isLoading={isLoading}
      teamColor={teamColor}
      defaultSort={{ column: 'time', direction: 'desc' }}
      elapsedSeconds={elapsedSeconds}
    />
  );
});

import { useMemo, useState, useEffect, memo } from 'react';

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
  } | null;
}

interface GameStatsProps {
  teamName: string;
  teamColor?: string;
  players: PlayerWithStats[];
  /** Server timestamp from game query for time interpolation */
  serverTimestamp?: number | null;
  /** Current period second for real-time display */
  currentPeriodSecond?: number | null;
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
  serverTimestamp,
  currentPeriodSecond,
  isLoading,
}: GameStatsProps) {
  // Transform players with nested stats to flat stats format for presentation
  const stats = useMemo(() => {
    return players
      .filter((p) => p.stats) // Only include players with stats
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
        };
      });
  }, [players]);

  // Tick counter for real-time updates
  const [tickCount, setTickCount] = useState(0);

  // Calculate initial elapsed seconds since server timestamp
  const initialElapsed = useMemo(() => {
    if (!serverTimestamp) return 0;
    return Math.floor((Date.now() - serverTimestamp) / 1000);
  }, [serverTimestamp]);

  // Reset tick count when server timestamp changes
  useEffect(() => {
    setTickCount(0);
  }, [serverTimestamp]);

  // Tick the clock every second when game is active
  useEffect(() => {
    if (currentPeriodSecond === null || currentPeriodSecond === undefined) {
      return;
    }

    const interval = setInterval(() => {
      setTickCount((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPeriodSecond, serverTimestamp]);

  // Current elapsed period seconds for live time calculation.
  // This is PERIOD-RELATIVE: currentPeriodSecond from server + client-side ticks since fetch.
  // Used to calculate live time for on-field players:
  //   liveTime = bankedTime + (elapsedSeconds - lastEntryPeriodSecond)
  // Note: This is NOT the game clock display time (which adds halfDuration for period 2).
  const elapsedSeconds = useMemo(() => {
    if (currentPeriodSecond === null || currentPeriodSecond === undefined) {
      return undefined;
    }
    return currentPeriodSecond + initialElapsed + tickCount;
  }, [currentPeriodSecond, initialElapsed, tickCount]);

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

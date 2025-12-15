import { useQuery } from '@apollo/client/react';
import { useEffect, useRef, useState, useMemo, memo } from 'react';

import { GET_PLAYER_STATS } from '../../services/games-graphql.service';
import {
  PlayerStatsTablePresentation,
  ColumnKey,
} from '../presentation/player-stats-table.presentation';

interface GameStatsProps {
  gameId: string;
  teamId: string;
  teamName: string;
  teamColor?: string;
  elapsedSeconds?: number;
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
  gameId,
  teamId,
  teamName,
  teamColor,
  elapsedSeconds,
}: GameStatsProps) {
  // Track the elapsed seconds at the time the query data was received
  const [queryTimeElapsedSeconds, setQueryTimeElapsedSeconds] =
    useState<number>(0);

  const { data, loading, error } = useQuery(GET_PLAYER_STATS, {
    variables: {
      input: {
        teamId,
        gameId,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  // Create a stable key from the data to detect when stats actually change
  // We use totalSeconds sum as a fingerprint since that's what changes during play
  const dataFingerprint = useMemo(() => {
    if (!data?.playerStats) return '';
    return data.playerStats
      .map(
        (s) =>
          `${s.playerId || s.externalPlayerName}:${s.totalMinutes}:${
            s.totalSeconds
          }`
      )
      .join(',');
  }, [data]);

  // Track the previous fingerprint
  const prevFingerprintRef = useRef<string>('');

  // Update query time when data actually changes (new stats values)
  useEffect(() => {
    if (
      dataFingerprint &&
      dataFingerprint !== prevFingerprintRef.current &&
      elapsedSeconds !== undefined
    ) {
      setQueryTimeElapsedSeconds(elapsedSeconds);
      prevFingerprintRef.current = dataFingerprint;
    }
  }, [dataFingerprint, elapsedSeconds]);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 py-8 text-center text-red-500">
        Error loading statistics: {error.message}
      </div>
    );
  }

  return (
    <PlayerStatsTablePresentation
      stats={data?.playerStats || []}
      columns={GAME_STATS_COLUMNS}
      title={`${teamName} Player Statistics`}
      emptyMessage="No player statistics for this game yet"
      isLoading={loading}
      teamColor={teamColor}
      defaultSort={{ column: 'time', direction: 'desc' }}
      elapsedSeconds={elapsedSeconds}
      queryTimeElapsedSeconds={queryTimeElapsedSeconds}
    />
  );
});

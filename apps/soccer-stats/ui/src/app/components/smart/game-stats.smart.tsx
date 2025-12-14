import { useQuery } from '@apollo/client/react';

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
}

// Columns to show for game-level stats
const GAME_STATS_COLUMNS: ColumnKey[] = [
  'player',
  'time',
  'positions',
  'goals',
  'assists',
];

export const GameStats = ({
  gameId,
  teamId,
  teamName,
  teamColor,
}: GameStatsProps) => {
  const { data, loading, error } = useQuery(GET_PLAYER_STATS, {
    variables: {
      input: {
        teamId,
        gameId,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

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
    />
  );
};

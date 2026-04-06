import { memo, useState } from 'react';

export interface PlayerStatRow {
  playerId?: string;
  playerName?: string;
  externalPlayerName?: string;
  externalPlayerNumber?: string;
  goals: number;
  unassistedGoals: number;
  assists: number;
  totalMinutes: number;
  totalSeconds: number;
  gamesPlayed: number;
}

export type SortField =
  | 'name'
  | 'goals'
  | 'unassistedGoals'
  | 'assists'
  | 'playTime'
  | 'gamesPlayed';

export interface PlayerStatsTableProps {
  players: PlayerStatRow[];
  showGamesPlayed?: boolean;
  compact?: boolean;
}

function formatPlayTime(minutes: number, seconds: number): string {
  if (minutes === 0 && seconds === 0) return '-';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getDisplayName(player: PlayerStatRow): string {
  if (player.playerName) return player.playerName;
  if (player.externalPlayerName) {
    const num = player.externalPlayerNumber
      ? ` #${player.externalPlayerNumber}`
      : '';
    return `${player.externalPlayerName}${num}`;
  }
  return 'Unknown';
}

function getSortValue(
  player: PlayerStatRow,
  field: SortField,
): string | number {
  switch (field) {
    case 'name':
      return getDisplayName(player).toLowerCase();
    case 'goals':
      return player.goals;
    case 'unassistedGoals':
      return player.unassistedGoals;
    case 'assists':
      return player.assists;
    case 'playTime':
      return player.totalMinutes * 60 + player.totalSeconds;
    case 'gamesPlayed':
      return player.gamesPlayed;
  }
}

export const PlayerStatsTable = memo(function PlayerStatsTable({
  players,
  showGamesPlayed = true,
  compact = false,
}: PlayerStatsTableProps) {
  const [sortField, setSortField] = useState<SortField>('playTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aVal = getSortValue(a, sortField);
    const bVal = getSortValue(b, sortField);
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    return ((aVal as number) - (bVal as number)) * modifier;
  });

  const SortHeader = ({
    field,
    label,
    className = '',
  }: {
    field: SortField;
    label: string;
    className?: string;
  }) => (
    <th
      className={`cursor-pointer select-none px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 transition-colors sm:px-3 sm:py-3 lg:hover:text-gray-700 ${className}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-blue-600">
            {sortDirection === 'asc' ? '\u2191' : '\u2193'}
          </span>
        )}
      </span>
    </th>
  );

  if (players.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No player statistics available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <SortHeader field="name" label="Player" className="min-w-[120px]" />
            {showGamesPlayed && <SortHeader field="gamesPlayed" label="GP" />}
            <SortHeader field="playTime" label="Time" />
            <SortHeader field="goals" label="G" />
            <SortHeader field="unassistedGoals" label="UG" />
            <SortHeader field="assists" label="A" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedPlayers.map((player, index) => {
            const displayName = getDisplayName(player);
            const isExternal = !player.playerId;
            return (
              <tr
                key={player.playerId ?? player.externalPlayerName ?? index}
                className="transition-colors lg:hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-2 py-2 sm:px-3 sm:py-3">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-medium ${
                        isExternal ? 'italic text-gray-500' : 'text-gray-900'
                      }`}
                    >
                      {displayName}
                    </span>
                  </div>
                </td>
                {showGamesPlayed && (
                  <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-700 sm:px-3 sm:py-3">
                    {player.gamesPlayed}
                  </td>
                )}
                <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-700 sm:px-3 sm:py-3">
                  {formatPlayTime(player.totalMinutes, player.totalSeconds)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-blue-600 sm:px-3 sm:py-3">
                  {player.goals || '-'}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-blue-400 sm:px-3 sm:py-3">
                  {player.unassistedGoals || '-'}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-green-600 sm:px-3 sm:py-3">
                  {player.assists || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Totals row */}
        <tfoot className="bg-gray-50">
          <tr className="font-semibold">
            <td className="px-2 py-2 text-sm text-gray-900 sm:px-3 sm:py-3">
              Team Total
            </td>
            {showGamesPlayed && <td className="px-2 py-2 sm:px-3 sm:py-3" />}
            <td className="px-2 py-2 text-sm text-gray-700 sm:px-3 sm:py-3">
              {formatPlayTime(
                players.reduce((sum, p) => sum + p.totalMinutes, 0),
                0,
              )}
            </td>
            <td className="px-2 py-2 text-sm text-blue-600 sm:px-3 sm:py-3">
              {players.reduce((sum, p) => sum + p.goals, 0)}
            </td>
            <td className="px-2 py-2 text-sm text-blue-400 sm:px-3 sm:py-3">
              {players.reduce((sum, p) => sum + p.unassistedGoals, 0)}
            </td>
            <td className="px-2 py-2 text-sm text-green-600 sm:px-3 sm:py-3">
              {players.reduce((sum, p) => sum + p.assists, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

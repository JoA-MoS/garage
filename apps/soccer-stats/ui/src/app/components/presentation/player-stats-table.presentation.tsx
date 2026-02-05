import { useState, useMemo } from 'react';

import type { PlayerFullStats } from '@garage/soccer-stats/graphql-codegen';

// Column keys that can be shown/hidden
export type ColumnKey =
  | 'player'
  | 'time'
  | 'positions'
  | 'goals'
  | 'assists'
  | 'gamesPlayed'
  | 'avgTime';

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: ColumnKey;
  direction: SortDirection;
}

interface PlayerStatsTablePresentationProps {
  stats: PlayerFullStats[];
  columns: ColumnKey[];
  sortable?: boolean;
  defaultSort?: SortConfig;
  title?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  teamColor?: string;
  /** Current period seconds (for calculating on-field player live time) */
  elapsedSeconds?: number;
}

// Format time as MM:SS
const formatTime = (minutes: number, seconds: number): string => {
  const totalSeconds = minutes * 60 + seconds;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get player display name
const getPlayerName = (stat: PlayerFullStats): string => {
  if (stat.playerName) return stat.playerName;
  if (stat.externalPlayerName) return stat.externalPlayerName;
  return 'Unknown Player';
};

// Get player jersey number
const getJerseyNumber = (stat: PlayerFullStats): string | null => {
  return stat.externalPlayerNumber || null;
};

// Calculate current stint seconds for on-field players.
// Returns the seconds of the current stint, or 0 if not on field.
const calculateCurrentStint = (
  stat: PlayerFullStats,
  elapsedSeconds?: number,
): number => {
  if (
    stat.isOnField &&
    elapsedSeconds !== undefined &&
    elapsedSeconds > 0 &&
    stat.lastEntryGameSeconds !== undefined &&
    stat.lastEntryGameSeconds !== null
  ) {
    return Math.max(0, elapsedSeconds - stat.lastEntryGameSeconds);
  }
  return 0;
};

// Calculate live time for on-field players.
//
// Time is PERIOD-RELATIVE (each period starts at 0):
// - Backend returns "banked" time = sum of (SUB_OUT.periodSecond - SUB_IN.periodSecond) for closed stints
// - For on-field players, we add current stint: (elapsedPeriodSecond - lastEntryPeriodSecond)
//
// This correctly handles stoppage time:
// - Period 1 might go to 1920 sec (32 min with stoppage), all captured as banked time
// - Period 2 starts fresh at 0, player gets new SUB_IN at periodSecond=0
// - Total play time = period1_banked + period2_banked + current_stint
const calculateDisplayTime = (
  stat: PlayerFullStats,
  elapsedSeconds?: number,
): { totalSeconds: number; isLive: boolean } => {
  const baseSeconds = stat.totalMinutes * 60 + stat.totalSeconds;
  const currentStint = calculateCurrentStint(stat, elapsedSeconds);

  if (currentStint > 0) {
    return {
      totalSeconds: baseSeconds + currentStint,
      isLive: true,
    };
  }

  return {
    totalSeconds: baseSeconds,
    isLive: false,
  };
};

// Calculate live position times for display.
// Adds current stint to the player's current position if they're on field.
// If the current position isn't in positionTimes yet (player just subbed in),
// we add it as a new entry with only the live time.
const calculateLivePositionTimes = (
  stat: PlayerFullStats,
  elapsedSeconds?: number,
): Array<{
  position: string;
  minutes: number;
  seconds: number;
  isLive: boolean;
}> => {
  const currentStint = calculateCurrentStint(stat, elapsedSeconds);
  const currentPosition = stat.currentPosition;

  // Map existing position times, adding live time to current position if it exists
  const result = stat.positionTimes.map((pt) => {
    const baseSeconds = pt.minutes * 60 + pt.seconds;

    // Add current stint to the current position
    if (
      currentStint > 0 &&
      currentPosition &&
      pt.position === currentPosition
    ) {
      const totalSeconds = baseSeconds + currentStint;
      return {
        position: pt.position,
        minutes: Math.floor(totalSeconds / 60),
        seconds: totalSeconds % 60,
        isLive: true,
      };
    }

    return {
      position: pt.position,
      minutes: pt.minutes,
      seconds: pt.seconds,
      isLive: false,
    };
  });

  // If current position isn't in the list yet (player just subbed in, no banked time),
  // add it as a new entry with only the live stint time
  if (
    currentStint > 0 &&
    currentPosition &&
    !stat.positionTimes.some((pt) => pt.position === currentPosition)
  ) {
    result.push({
      position: currentPosition,
      minutes: Math.floor(currentStint / 60),
      seconds: currentStint % 60,
      isLive: true,
    });
  }

  return result;
};

export const PlayerStatsTablePresentation = ({
  stats,
  columns,
  sortable = true,
  defaultSort = { column: 'time', direction: 'desc' },
  title,
  emptyMessage = 'No player statistics available',
  isLoading = false,
  teamColor,
  elapsedSeconds,
}: PlayerStatsTablePresentationProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(defaultSort);

  const handleSort = (column: ColumnKey) => {
    if (!sortable) return;
    setSortConfig((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const sortedStats = useMemo(() => {
    const sorted = [...stats];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.column) {
        case 'player':
          comparison = getPlayerName(a).localeCompare(getPlayerName(b));
          break;
        case 'time': {
          // Use calculateDisplayTime to include live time for on-field players
          const aTime = calculateDisplayTime(a, elapsedSeconds).totalSeconds;
          const bTime = calculateDisplayTime(b, elapsedSeconds).totalSeconds;
          comparison = aTime - bTime;
          break;
        }
        case 'avgTime': {
          // Average time uses banked time only (no live calculation)
          const aTime =
            a.gamesPlayed > 0
              ? (a.totalMinutes * 60 + a.totalSeconds) / a.gamesPlayed
              : a.totalMinutes * 60 + a.totalSeconds;
          const bTime =
            b.gamesPlayed > 0
              ? (b.totalMinutes * 60 + b.totalSeconds) / b.gamesPlayed
              : b.totalMinutes * 60 + b.totalSeconds;
          comparison = aTime - bTime;
          break;
        }
        case 'goals':
          comparison = a.goals - b.goals;
          break;
        case 'assists':
          comparison = a.assists - b.assists;
          break;
        case 'gamesPlayed':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [stats, sortConfig, elapsedSeconds]);

  const getSortIcon = (column: ColumnKey) => {
    if (!sortable) return null;
    if (sortConfig.column !== column) {
      return <span className="ml-1 text-gray-300">↕</span>;
    }
    return (
      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
    );
  };

  const headerClass = (column: ColumnKey) =>
    `px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
      sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
    }`;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {title && (
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        )}
        <div className="animate-pulse space-y-2">
          <div className="h-10 rounded bg-gray-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="space-y-2">
        {title && (
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        )}
        <div className="rounded-lg bg-gray-50 py-8 text-center text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && (
        <h3
          className="text-lg font-semibold"
          style={teamColor ? { color: teamColor } : undefined}
        >
          {title}
        </h3>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.includes('player') && (
                <th
                  className={headerClass('player')}
                  onClick={() => handleSort('player')}
                >
                  Player {getSortIcon('player')}
                </th>
              )}
              {columns.includes('time') && (
                <th
                  className={headerClass('time')}
                  onClick={() => handleSort('time')}
                >
                  Time {getSortIcon('time')}
                </th>
              )}
              {columns.includes('avgTime') && (
                <th
                  className={headerClass('avgTime')}
                  onClick={() => handleSort('avgTime')}
                >
                  Avg Time {getSortIcon('avgTime')}
                </th>
              )}
              {columns.includes('positions') && (
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Positions
                </th>
              )}
              {columns.includes('goals') && (
                <th
                  className={headerClass('goals')}
                  onClick={() => handleSort('goals')}
                >
                  Goals {getSortIcon('goals')}
                </th>
              )}
              {columns.includes('assists') && (
                <th
                  className={headerClass('assists')}
                  onClick={() => handleSort('assists')}
                >
                  Assists {getSortIcon('assists')}
                </th>
              )}
              {columns.includes('gamesPlayed') && (
                <th
                  className={headerClass('gamesPlayed')}
                  onClick={() => handleSort('gamesPlayed')}
                >
                  Games {getSortIcon('gamesPlayed')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedStats.map((stat, index) => {
              const jerseyNumber = getJerseyNumber(stat);
              const playerKey = stat.playerId || `external-${index}`;

              // Calculate average time per game for avgTime column
              const avgMinutes =
                stat.gamesPlayed > 0
                  ? Math.floor(
                      (stat.totalMinutes * 60 + stat.totalSeconds) /
                        stat.gamesPlayed /
                        60,
                    )
                  : 0;
              const avgSeconds =
                stat.gamesPlayed > 0
                  ? Math.floor(
                      ((stat.totalMinutes * 60 + stat.totalSeconds) /
                        stat.gamesPlayed) %
                        60,
                    )
                  : 0;

              return (
                <tr key={playerKey} className="hover:bg-gray-50">
                  {columns.includes('player') && (
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-2">
                        {jerseyNumber && (
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{
                              backgroundColor: teamColor || '#6B7280',
                            }}
                          >
                            {jerseyNumber}
                          </span>
                        )}
                        <span className="font-medium text-gray-900">
                          {getPlayerName(stat)}
                        </span>
                      </div>
                    </td>
                  )}
                  {columns.includes('time') && (
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-sm text-gray-700">
                      {(() => {
                        const { totalSeconds, isLive } = calculateDisplayTime(
                          stat,
                          elapsedSeconds,
                        );
                        const mins = Math.floor(totalSeconds / 60);
                        const secs = totalSeconds % 60;
                        return (
                          <span className="inline-flex items-center gap-1.5">
                            {formatTime(mins, secs)}
                            {isLive && (
                              <span
                                className="inline-flex h-2 w-2 animate-pulse rounded-full bg-green-500"
                                title="On field"
                              ></span>
                            )}
                          </span>
                        );
                      })()}
                    </td>
                  )}
                  {columns.includes('avgTime') && (
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-sm text-gray-700">
                      {formatTime(avgMinutes, avgSeconds)}
                    </td>
                  )}
                  {columns.includes('positions') && (
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {calculateLivePositionTimes(stat, elapsedSeconds).map(
                          (pt) => (
                            <span
                              key={pt.position}
                              className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                              title={`${formatTime(pt.minutes, pt.seconds)}`}
                            >
                              {pt.position}
                              <span
                                className={`ml-1 ${pt.isLive ? 'text-green-600' : 'text-gray-500'}`}
                              >
                                {formatTime(pt.minutes, pt.seconds)}
                                {pt.isLive && (
                                  <span
                                    className="ml-1 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"
                                    title="Currently playing this position"
                                  ></span>
                                )}
                              </span>
                            </span>
                          ),
                        )}
                      </div>
                    </td>
                  )}
                  {columns.includes('goals') && (
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`font-semibold ${
                          stat.goals > 0 ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        {stat.goals}
                      </span>
                    </td>
                  )}
                  {columns.includes('assists') && (
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`font-semibold ${
                          stat.assists > 0 ? 'text-purple-600' : 'text-gray-400'
                        }`}
                      >
                        {stat.assists}
                      </span>
                    </td>
                  )}
                  {columns.includes('gamesPlayed') && (
                    <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                      {stat.gamesPlayed}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

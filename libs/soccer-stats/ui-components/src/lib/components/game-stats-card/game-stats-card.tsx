import { memo, useState } from 'react';

import { PlayerStatsTable } from '../player-stats-table';
import type { PlayerStatRow } from '../player-stats-table';

export interface GameStatsCardProps {
  gameId: string;
  gameTeamId?: string;
  gameName?: string;
  gameDate?: string;
  opponentName?: string;
  teamScore?: number | null;
  opponentScore?: number | null;
  result: string; // 'W', 'D', 'L', or 'N/A'
  totalGoals: number;
  totalAssists: number;
  playerStats: PlayerStatRow[];
  onGameClick?: (gameId: string, gameTeamId?: string) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getResultBadgeClasses(result: string): string {
  switch (result) {
    case 'W':
      return 'bg-green-100 text-green-800';
    case 'D':
      return 'bg-yellow-100 text-yellow-800';
    case 'L':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getResultLabel(result: string): string {
  switch (result) {
    case 'W':
      return 'Win';
    case 'D':
      return 'Draw';
    case 'L':
      return 'Loss';
    default:
      return 'TBD';
  }
}

export const GameStatsCard = memo(function GameStatsCard({
  gameId,
  gameTeamId,
  gameName,
  gameDate,
  opponentName,
  teamScore,
  opponentScore,
  result,
  totalGoals,
  totalAssists,
  playerStats,
  onGameClick,
}: GameStatsCardProps) {
  const [expanded, setExpanded] = useState(false);

  const scoreDisplay =
    teamScore !== null &&
    teamScore !== undefined &&
    opponentScore !== null &&
    opponentScore !== undefined
      ? `${teamScore} - ${opponentScore}`
      : null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Game header - always visible. Uses a div layout instead of a button to
          allow a nested "View" button without invalid HTML (button-in-button). */}
      <div className="flex w-full items-center justify-between p-3 sm:p-4 lg:hover:bg-gray-50">
        {/* Expand toggle — takes up most of the row */}
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left sm:gap-3"
          onClick={() => setExpanded(!expanded)}
        >
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getResultBadgeClasses(result)}`}
          >
            {getResultLabel(result)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-gray-900 sm:text-base">
                {opponentName ? `vs ${opponentName}` : gameName || 'Game'}
              </span>
            </div>
            <div className="text-xs text-gray-500">{formatDate(gameDate)}</div>
          </div>
        </button>

        {/* Right side: score, stats, view link, chevron */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {onGameClick && (
            <button
              type="button"
              className="shrink-0 text-xs text-blue-600 lg:hover:text-blue-800"
              onClick={() => onGameClick(gameId, gameTeamId)}
            >
              View
            </button>
          )}
          {scoreDisplay && (
            <span className="text-lg font-bold text-gray-900 sm:text-xl">
              {scoreDisplay}
            </span>
          )}
          <div className="hidden gap-3 text-center text-xs sm:flex">
            <div>
              <div className="font-semibold text-blue-600">{totalGoals}</div>
              <div className="text-gray-500">Goals</div>
            </div>
            <div>
              <div className="font-semibold text-green-600">{totalAssists}</div>
              <div className="text-gray-500">Assists</div>
            </div>
          </div>
          <button
            type="button"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1"
          >
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded player stats */}
      {expanded && (
        <div className="border-t border-gray-200">
          <PlayerStatsTable
            players={playerStats}
            showGamesPlayed={false}
            compact
          />
        </div>
      )}
    </div>
  );
});

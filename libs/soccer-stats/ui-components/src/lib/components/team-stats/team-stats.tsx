import { memo, useState } from 'react';

import { PlayerStatsTable } from '../player-stats-table';
import type { PlayerStatRow } from '../player-stats-table';
import { GameStatsCard } from '../game-stats-card';
import type { GameStatsCardProps } from '../game-stats-card';

export interface TeamStatsProps {
  teamName: string;
  // Aggregate stats
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  totalAssists: number;
  totalYellowCards: number;
  totalRedCards: number;
  playerCount: number;
  activePlayerCount: number;
  // Player breakdown
  playerStats: PlayerStatRow[];
  // Game breakdown
  gameBreakdown: Omit<GameStatsCardProps, 'onGameClick'>[];
  // Top performers
  topScorerName?: string;
  topAssisterName?: string;
  mostMinutesPlayerName?: string;
  // Date range
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onClearDateRange?: () => void;
  // State
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  onGameClick?: (gameId: string, gameTeamId?: string) => void;
}

type StatsTab = 'overview' | 'players' | 'games';

export const TeamStats = memo(function TeamStats({
  teamName,
  gamesPlayed,
  wins,
  draws,
  losses,
  winRate,
  goalsFor,
  goalsAgainst,
  goalDifference,
  totalAssists,
  totalYellowCards,
  totalRedCards,
  playerStats,
  gameBreakdown,
  topScorerName,
  topAssisterName,
  mostMinutesPlayerName,
  startDate,
  endDate,
  onDateRangeChange,
  onClearDateRange,
  isLoading = false,
  error,
  onRetry,
  onGameClick,
}: TeamStatsProps) {
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');
  const [localStartDate, setLocalStartDate] = useState(startDate ?? '');
  const [localEndDate, setLocalEndDate] = useState(endDate ?? '');

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 sm:p-6 md:p-8">
        <div className="text-lg font-semibold">Error loading statistics</div>
        <div className="mt-2 text-sm">{error}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 min-h-[44px] rounded bg-blue-600 px-4 py-3 text-white transition-colors active:scale-95 sm:py-2 lg:hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  const handleApplyDateRange = () => {
    if (localStartDate && localEndDate && onDateRangeChange) {
      onDateRangeChange(localStartDate, localEndDate);
    }
  };

  const handleClearDateRange = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    onClearDateRange?.();
  };

  const tabs: { key: StatsTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'players', label: 'Players' },
    { key: 'games', label: 'Game Log' },
  ];

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {teamName} Statistics
        </h2>
        {isLoading && (
          <span className="animate-pulse text-sm text-gray-500">
            Updating...
          </span>
        )}
      </div>

      {/* Date Range Filter */}
      {onDateRangeChange && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <div className="flex-1">
              <label
                htmlFor="stats-start-date"
                className="block text-xs font-medium text-gray-700"
              >
                From
              </label>
              <input
                id="stats-start-date"
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="stats-end-date"
                className="block text-xs font-medium text-gray-700"
              >
                To
              </label>
              <input
                id="stats-end-date"
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplyDateRange}
                disabled={!localStartDate || !localEndDate}
                className="min-h-[38px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 sm:py-2 lg:hover:bg-blue-700"
              >
                Apply
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={handleClearDateRange}
                  className="min-h-[38px] rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors lg:hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {startDate && endDate && (
            <p className="mt-2 text-xs text-gray-500">
              Showing stats from{' '}
              {new Date(startDate).toLocaleDateString()} to{' '}
              {new Date(endDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 lg:hover:border-gray-300 lg:hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            <StatCard label="Games" value={gamesPlayed} />
            <StatCard label="Wins" value={wins} color="green" />
            <StatCard label="Draws" value={draws} color="yellow" />
            <StatCard label="Losses" value={losses} color="red" />
            <StatCard label="Win Rate" value={`${winRate}%`} />
            <StatCard
              label="Goal Diff"
              value={goalDifference >= 0 ? `+${goalDifference}` : `${goalDifference}`}
              color={goalDifference > 0 ? 'green' : goalDifference < 0 ? 'red' : undefined}
            />
          </div>

          {/* Performance Section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
              <h4 className="mb-3 text-base font-semibold text-gray-900 sm:text-lg">
                Scoring
              </h4>
              <div className="space-y-2">
                <StatRow label="Goals For" value={goalsFor} color="blue" />
                <StatRow label="Goals Against" value={goalsAgainst} color="gray" />
                <StatRow label="Assists" value={totalAssists} color="green" />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
              <h4 className="mb-3 text-base font-semibold text-gray-900 sm:text-lg">
                Discipline & Leaders
              </h4>
              <div className="space-y-2">
                <StatRow label="Yellow Cards" value={totalYellowCards} color="yellow" />
                <StatRow label="Red Cards" value={totalRedCards} color="red" />
                <div className="border-t border-gray-100 pt-2">
                  <StatRow
                    label="Top Scorer"
                    value={topScorerName ?? '-'}
                    isText
                  />
                  <StatRow
                    label="Top Assister"
                    value={topAssisterName ?? '-'}
                    isText
                  />
                  <StatRow
                    label="Most Minutes"
                    value={mostMinutesPlayerName ?? '-'}
                    isText
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'players' && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <PlayerStatsTable players={playerStats} showGamesPlayed />
        </div>
      )}

      {activeTab === 'games' && (
        <div className="space-y-3">
          {gameBreakdown.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No games found for the selected period
            </div>
          ) : (
            gameBreakdown.map((game) => (
              <GameStatsCard
                key={game.gameId}
                {...game}
                onGameClick={onGameClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

// Helper sub-components

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };
  const textColor = color ? colorClasses[color] : 'text-gray-900';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center sm:p-4">
      <div className={`text-xl font-bold sm:text-2xl ${textColor}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 sm:text-sm">{label}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
  isText = false,
}: {
  label: string;
  value: string | number;
  color?: string;
  isText?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600',
  };
  const valueColor = isText
    ? 'text-gray-900'
    : color
      ? colorClasses[color] ?? 'text-gray-900'
      : 'text-gray-900';

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}

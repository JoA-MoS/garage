import { memo, useEffect, useState } from 'react';

import { PlayerStatsTable } from '../player-stats-table';
import type { PlayerStatRow } from '../player-stats-table';
import { GameStatsCard } from '../game-stats-card';
import type { GameStatsCardProps } from '../game-stats-card';

type SquadMetric = {
  squad: string;
  goalsFor: number;
  goalsAgainst: number;
};

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
  topScoringSquad?: string;
  topScoringSquadGoalsFor: number;
  topDefensiveSquad?: string;
  topDefensiveSquadGoalsAgainst: number;
  topScoringSquads: SquadMetric[];
  topDefensiveSquads: SquadMetric[];
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
  topUnassistedScorerName?: string;
  topScorers: string[];
  topAssisters: string[];
  topMinutesLeaders: string[];
  topComboPlayers: string[];
  topUnassistedScorers: string[];
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
  onPlayerClick?: (playerId: string) => void;
  onExportCsv?: () => void;
  onExportExcel?: () => void;
}

type StatsTab = 'overview' | 'players' | 'games';

// Parse YYYY-MM-DD date strings without timezone conversion to avoid off-by-one
// day errors in timezones ahead of UTC.
function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

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
  topScoringSquad,
  topScoringSquadGoalsFor,
  topDefensiveSquad,
  topDefensiveSquadGoalsAgainst,
  topScoringSquads,
  topDefensiveSquads,
  playerStats,
  gameBreakdown,
  topScorerName,
  topAssisterName,
  mostMinutesPlayerName,
  topUnassistedScorerName,
  topScorers,
  topAssisters,
  topMinutesLeaders,
  topComboPlayers,
  topUnassistedScorers,
  startDate,
  endDate,
  onDateRangeChange,
  onClearDateRange,
  isLoading = false,
  error,
  onRetry,
  onGameClick,
  onPlayerClick,
  onExportCsv,
  onExportExcel,
}: TeamStatsProps) {
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');
  const [localStartDate, setLocalStartDate] = useState(startDate ?? '');
  const [localEndDate, setLocalEndDate] = useState(endDate ?? '');

  // Sync local date state if the parent clears or changes the range externally
  useEffect(() => {
    setLocalStartDate(startDate ?? '');
    setLocalEndDate(endDate ?? '');
  }, [startDate, endDate]);

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
        <div className="flex items-center gap-2">
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="min-h-[38px] rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors sm:text-sm lg:hover:bg-gray-50"
            >
              Export CSV
            </button>
          )}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="min-h-[38px] rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors sm:text-sm lg:hover:bg-blue-700"
            >
              Export Excel
            </button>
          )}
          {isLoading && (
            <span className="animate-pulse text-sm text-gray-500">
              Updating...
            </span>
          )}
        </div>
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
                className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 lg:hover:bg-blue-700"
              >
                Apply
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={handleClearDateRange}
                  className="min-h-[44px] rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors lg:hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {startDate && endDate && (
            <p className="mt-2 text-xs text-gray-500">
              Showing stats from {formatDateLabel(startDate)} to{' '}
              {formatDateLabel(endDate)}
            </p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav role="tablist" className="-mb-px flex space-x-4 sm:space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
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
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            <StatCard label="Games" value={gamesPlayed} />
            <StatCard label="Wins" value={wins} color="green" />
            <StatCard label="Draws" value={draws} color="yellow" />
            <StatCard label="Losses" value={losses} color="red" />
            <StatCard label="Win Rate" value={`${winRate}%`} />
            <StatCard
              label="Goal Diff"
              value={
                goalDifference >= 0 ? `+${goalDifference}` : `${goalDifference}`
              }
              color={
                goalDifference > 0
                  ? 'green'
                  : goalDifference < 0
                    ? 'red'
                    : undefined
              }
            />
          </div>

          {/* Scoring bar */}
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">Scoring</span>
            <span className="text-sm">
              <span className="font-medium text-blue-600">{goalsFor}</span>{' '}
              <span className="text-gray-400">GF</span>
            </span>
            <span className="text-sm">
              <span className="font-medium text-gray-600">{goalsAgainst}</span>{' '}
              <span className="text-gray-400">GA</span>
            </span>
            <span className="text-sm">
              <span className="font-medium text-green-600">{totalAssists}</span>{' '}
              <span className="text-gray-400">Assists</span>
            </span>
          </div>

          {/* Leaders grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <LeaderCard
              title="Top Scorers"
              items={topScorers}
              emptyText="No scorers yet"
            />
            <LeaderCard
              title="Unassisted Goals"
              items={topUnassistedScorers}
              emptyText="No unassisted goals"
            />
            <LeaderCard
              title="Top Assists"
              items={topAssisters}
              emptyText="No assists yet"
            />
            <LeaderCard
              title="Goal-Assist Combos"
              items={topComboPlayers}
              emptyText="No combos yet"
            />
          </div>

          {/* Squad performance */}
          {(topScoringSquads.length > 0 || topDefensiveSquads.length > 0) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {topScoringSquads.length > 0 && (
                <SquadCard
                  title="Best Attacking Squads"
                  squads={topScoringSquads}
                  statKey="goalsFor"
                  statLabel="GF"
                />
              )}
              {topDefensiveSquads.length > 0 && (
                <SquadCard
                  title="Best Defensive Squads"
                  squads={topDefensiveSquads}
                  statKey="goalsAgainst"
                  statLabel="GA"
                />
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'players' && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <PlayerStatsTable
            players={playerStats}
            showGamesPlayed
            onPlayerClick={onPlayerClick}
          />
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

function rankEmoji(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}.`;
}

function LeaderCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-gray-400">{emptyText}</div>
      ) : (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div
              key={`${title}-${item}-${index}`}
              className="flex items-center gap-2 text-sm"
            >
              <span className="w-5 text-center">{rankEmoji(index)}</span>
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SquadCard({
  title,
  squads,
  statKey,
  statLabel,
}: {
  title: string;
  squads: SquadMetric[];
  statKey: 'goalsFor' | 'goalsAgainst';
  statLabel: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="space-y-3">
        {squads.map((squad, index) => {
          const players = squad.squad
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
          return (
            <div key={`${squad.squad}-${index}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-center">{rankEmoji(index)}</span>
                <span className="text-sm font-semibold text-gray-800">
                  {squad[statKey]}{' '}
                  <span className="font-normal text-gray-400">{statLabel}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pl-7">
                {players.map((player) => (
                  <span
                    key={player}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {player}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';
import { fromPeriodSecond } from '@garage/soccer-stats/utils';

import { SubstitutionPanelPresentationProps, QueuedItem } from './types';

/**
 * Get player ID for matching - handles both internal and external players
 */
const getPlayerId = (player: GqlRosterPlayer) =>
  player.playerId || player.externalPlayerName || '';

/**
 * Get display name for a player
 */
function getPlayerDisplayName(player: GqlRosterPlayer): string {
  if (player.playerName) return player.playerName;
  if (player.firstName || player.lastName) {
    return `${player.firstName || ''} ${player.lastName || ''}`.trim();
  }
  if (player.externalPlayerName) return player.externalPlayerName;
  return 'Unknown';
}

/**
 * Get jersey number display
 */
function getJerseyNumber(player: GqlRosterPlayer): string | null {
  return player.externalPlayerNumber || null;
}

/**
 * Presentation component for the inline substitution panel
 */
export const SubstitutionPanelPresentation = ({
  panelState,
  onPanelStateChange,
  teamName,
  teamColor,
  onFieldPlayers,
  benchPlayers,
  playTimeByPlayer,
  selection,
  onFieldPlayerClick,
  onBenchPlayerClick,
  onClearSelection,
  queue,
  onRemoveFromQueue,
  onConfirmAll,
  onRequestRemoval,
  isExecuting,
  executionProgress,
  error,
  period,
  periodSecond,
}: SubstitutionPanelPresentationProps) => {
  const { minute, second } = fromPeriodSecond(periodSecond);
  const timeDisplay = `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

  // Render collapsed bar
  if (panelState === 'collapsed') {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg"
        onClick={() => onPanelStateChange('bench-view')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onPanelStateChange('bench-view')}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="flex min-h-[44px] items-center justify-between px-4 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: teamColor }}
            />
            <span className="font-medium text-gray-900">Substitutions</span>
          </div>
          {queue.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {queue.length}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render bench-view or expanded panel
  const isExpanded = panelState === 'expanded';
  const panelHeight = isExpanded ? 'max-h-[60vh]' : 'max-h-[40vh]';
  const hasActiveSelection = selection.direction !== null;

  return (
    <>
      {/* Background overlay - clicking clears selection (only for field-first) */}
      {/* For bench-first, we want field clicks to complete the substitution */}
      {selection.direction === 'field-first' && (
        <div
          className="fixed inset-0 z-30"
          onClick={onClearSelection}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col overflow-hidden border-t border-gray-200 bg-white shadow-lg ${panelHeight}`}
      >
        {/* Drag handle indicator - clickable to collapse */}
        <button
          type="button"
          onClick={() => onPanelStateChange('collapsed')}
          className="flex w-full cursor-pointer justify-center py-2"
          aria-label="Collapse panel"
        >
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </button>

        {/* Header */}
        <div
          className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-4 pb-3 pt-1"
          onClick={() =>
            onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === 'Enter' &&
            onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')
          }
        >
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: teamColor }}
            />
            <span className="font-medium text-gray-900">{teamName}</span>
            <span className="text-sm text-gray-500">
              P{period} {timeDisplay}
            </span>
          </div>
        </div>

        {/* Selection header */}
        {selection.direction && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
            {selection.direction === 'field-first' && selection.fieldPlayer && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Replacing:{' '}
                  <span className="font-medium text-red-600">
                    {getPlayerDisplayName(selection.fieldPlayer)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
            {selection.direction === 'bench-first' && selection.benchPlayer && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Bringing in:{' '}
                  <span className="font-medium text-green-600">
                    {getPlayerDisplayName(selection.benchPlayer)}
                  </span>
                  <span className="text-gray-500">
                    {' '}
                    — tap player to replace
                  </span>
                </span>
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Queued items (shown in expanded view or when has items) */}
          {(isExpanded || queue.length > 0) && queue.length > 0 && (
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="mb-2 text-xs font-medium uppercase text-gray-500">
                Queued ({queue.length})
              </div>
              <div className="space-y-2">
                {queue.map((item) => (
                  <QueuedItemRow
                    key={item.id}
                    item={item}
                    onRemove={() => onRemoveFromQueue(item.id)}
                    disabled={isExecuting}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Player selection with tabs when field-first (can sub or swap) */}
          <PlayerSelectionTabs
            selection={selection}
            benchPlayers={benchPlayers}
            onFieldPlayers={onFieldPlayers}
            playTimeByPlayer={playTimeByPlayer}
            onBenchPlayerClick={onBenchPlayerClick}
            onFieldPlayerClick={onFieldPlayerClick}
            isExecuting={isExecuting}
          />

          {/* Execution progress */}
          {isExecuting && (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-gray-600">
                Processing... ({executionProgress}/{queue.length})
              </p>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mx-4 my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isExecuting && (
          <div className="space-y-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
            {/* Confirm button */}
            {queue.length > 0 && (
              <button
                type="button"
                onClick={onConfirmAll}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Confirm All ({queue.length})
              </button>
            )}

            {/* Remove from field - shown when a field player is selected */}
            {selection.direction === 'field-first' && selection.fieldPlayer && (
              <button
                type="button"
                onClick={() => onRequestRemoval(selection.fieldPlayer!)}
                className="w-full rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Remove from Field (No Sub)
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

/**
 * Row component for a queued item
 */
function QueuedItemRow({
  item,
  onRemove,
  disabled,
}: {
  item: QueuedItem;
  onRemove: () => void;
  disabled: boolean;
}) {
  if (item.type === 'removal') {
    return (
      <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-xs font-medium text-red-600">
            R
          </span>
          <span className="text-red-600">
            {getPlayerDisplayName(item.playerOut)}
          </span>
          <span className="text-gray-400">off</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          aria-label="Remove from queue"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }

  if (item.type === 'substitution') {
    return (
      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-600">
            S
          </span>
          <span className="text-red-600">
            {getPlayerDisplayName(item.playerOut)}
          </span>
          <span className="text-gray-400">→</span>
          <span className="text-green-600">
            {getPlayerDisplayName(item.playerIn)}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          aria-label="Remove from queue"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }

  // Position swap
  return (
    <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-white p-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-xs font-medium text-purple-600">
          P
        </span>
        <span className="text-gray-900">
          {getPlayerDisplayName(item.player1.player)}
        </span>
        <span className="text-purple-500">↔</span>
        <span className="text-gray-900">
          {getPlayerDisplayName(item.player2.player)}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
        aria-label="Remove from queue"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * Tabbed player selection component
 */
function PlayerSelectionTabs({
  selection,
  benchPlayers,
  onFieldPlayers,
  playTimeByPlayer,
  onBenchPlayerClick,
  onFieldPlayerClick,
  isExecuting,
}: {
  selection: {
    direction: 'field-first' | 'bench-first' | null;
    fieldPlayer: GqlRosterPlayer | null;
    benchPlayer: GqlRosterPlayer | null;
  };
  benchPlayers: GqlRosterPlayer[];
  onFieldPlayers: GqlRosterPlayer[];
  playTimeByPlayer: Map<string, { minutes: number; isOnField: boolean }>;
  onBenchPlayerClick: (player: GqlRosterPlayer) => void;
  onFieldPlayerClick: (player: GqlRosterPlayer) => void;
  isExecuting: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'bench' | 'onField'>('bench');
  const showTabs =
    selection.direction === 'field-first' && selection.fieldPlayer;

  if (isExecuting) return null;

  // Filter on-field players to exclude the selected one
  const swappablePlayers = onFieldPlayers.filter(
    (p) => p.gameEventId !== selection.fieldPlayer?.gameEventId,
  );

  return (
    <div className="px-4 py-3">
      {/* Tab header */}
      {showTabs ? (
        <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('bench')}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'bench'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bench ({benchPlayers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('onField')}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'onField'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Swap Position ({swappablePlayers.length})
          </button>
        </div>
      ) : (
        <div className="mb-2 text-xs font-medium uppercase text-gray-500">
          Bench
        </div>
      )}

      {/* Bench players */}
      {(!showTabs || activeTab === 'bench') && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {benchPlayers.map((player) => {
            const id = getPlayerId(player);
            const playTime = playTimeByPlayer.get(id);
            const isSelected =
              selection.direction === 'bench-first' &&
              selection.benchPlayer &&
              getPlayerId(selection.benchPlayer) === getPlayerId(player);

            return (
              <button
                key={id}
                type="button"
                onClick={() => onBenchPlayerClick(player)}
                className={`flex flex-col items-start rounded-lg border p-2 transition-colors ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {player.externalPlayerNumber && (
                    <span className="text-xs font-bold text-gray-600">
                      #{player.externalPlayerNumber}
                    </span>
                  )}
                  <span
                    className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`}
                  >
                    {getPlayerDisplayName(player)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {playTime?.minutes ?? 0} min
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* On-field players for swaps */}
      {showTabs && activeTab === 'onField' && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {swappablePlayers.map((player) => {
            const id = getPlayerId(player);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onFieldPlayerClick(player)}
                className="flex flex-col items-start rounded-lg border border-purple-200 bg-purple-50 p-2 transition-colors hover:border-purple-300"
              >
                <div className="flex items-center gap-2">
                  {player.externalPlayerNumber && (
                    <span className="text-xs font-bold text-purple-600">
                      #{player.externalPlayerNumber}
                    </span>
                  )}
                  <span className="text-sm font-medium text-purple-900">
                    {getPlayerDisplayName(player)}
                  </span>
                </div>
                <span className="text-xs text-purple-600">
                  {player.position || 'No position'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

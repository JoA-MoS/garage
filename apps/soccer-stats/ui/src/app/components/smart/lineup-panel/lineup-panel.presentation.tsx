import { useState } from 'react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { RosterPlayer as TeamRosterPlayer } from '../../../hooks/use-lineup';

import {
  LineupPanelPresentationProps,
  QueuedLineupItem,
  LineupSelection,
  getPlayerId,
} from './types';

/**
 * Get display name for a player
 */
function getPlayerDisplayName(
  player: GqlRosterPlayer | TeamRosterPlayer,
): string {
  if ('playerName' in player && player.playerName) return player.playerName;
  if ('firstName' in player || 'lastName' in player) {
    const first = 'firstName' in player ? player.firstName : '';
    const last = 'lastName' in player ? player.lastName : '';
    return `${first || ''} ${last || ''}`.trim() || 'Unknown';
  }
  if ('externalPlayerName' in player && player.externalPlayerName) {
    return player.externalPlayerName;
  }
  return 'Unknown';
}

/**
 * Get jersey number
 */
function getJerseyNumber(
  player: GqlRosterPlayer | TeamRosterPlayer,
): string | null {
  if ('externalPlayerNumber' in player)
    return player.externalPlayerNumber || null;
  if ('jerseyNumber' in player) return player.jerseyNumber || null;
  return null;
}

/**
 * Row component for a queued lineup item
 */
function QueuedItemRow({
  item,
  onRemove,
  disabled,
}: {
  item: QueuedLineupItem;
  onRemove: () => void;
  disabled: boolean;
}) {
  const getBadge = () => {
    switch (item.type) {
      case 'assignment':
        return (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-600">
            A
          </span>
        );
      case 'position-change':
        return (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-xs font-medium text-purple-600">
            P
          </span>
        );
      case 'swap':
        return (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-xs font-medium text-amber-600">
            S
          </span>
        );
      case 'removal':
        return (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-xs font-medium text-red-600">
            R
          </span>
        );
    }
  };

  const getDescription = () => {
    switch (item.type) {
      case 'assignment':
        return (
          <>
            <span className="font-medium text-blue-600">{item.position}</span>
            <span className="text-gray-400"> ← </span>
            <span className="text-gray-900">
              {getPlayerDisplayName(item.player)}
            </span>
          </>
        );
      case 'position-change':
        return (
          <>
            <span className="text-gray-900">
              {getPlayerDisplayName(item.player)}
            </span>
            <span className="text-gray-400">: </span>
            <span className="text-gray-500">{item.fromPosition}</span>
            <span className="text-purple-500"> → </span>
            <span className="font-medium text-purple-600">
              {item.toPosition}
            </span>
          </>
        );
      case 'swap':
        return (
          <>
            <span className="text-gray-900">
              {getPlayerDisplayName(item.player1)}
            </span>
            <span className="text-amber-500"> ⇄ </span>
            <span className="text-gray-900">
              {getPlayerDisplayName(item.player2)}
            </span>
          </>
        );
      case 'removal':
        return (
          <>
            <span className="text-red-600 line-through">
              {getPlayerDisplayName(item.player)}
            </span>
            <span className="text-gray-400"> from </span>
            <span className="text-gray-500">{item.position}</span>
          </>
        );
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2">
      <div className="flex items-center gap-2 text-sm">
        {getBadge()}
        {getDescription()}
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
 * Collapsible player section - used for both Bench and Team Roster.
 * Shows a count header with chevron; expands to show player grid.
 */
function CollapsiblePlayerSection({
  title,
  players,
  source,
  selection,
  onPlayerClick,
  playTimeByPlayer,
  isExecuting,
  defaultExpanded,
  emptyMessage,
  actionButton,
}: {
  title: string;
  players: (GqlRosterPlayer | TeamRosterPlayer)[];
  source: 'onField' | 'bench' | 'roster';
  selection: LineupSelection;
  onPlayerClick: (
    player: GqlRosterPlayer | TeamRosterPlayer,
    source: 'onField' | 'bench' | 'roster',
  ) => void;
  playTimeByPlayer?: Map<string, { minutes: number; isOnField: boolean }>;
  isExecuting: boolean;
  defaultExpanded: boolean;
  emptyMessage?: string;
  /** Optional action button shown in place of the toggle header */
  actionButton?: { label: string; onClick: () => void };
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (players.length === 0 && !emptyMessage && !actionButton) return null;

  return (
    <div className="mb-4">
      {/* Header - always visible */}
      <div className="mb-2 flex items-center gap-2">
        {actionButton ? (
          <button
            type="button"
            onClick={actionButton.onClick}
            disabled={isExecuting}
            className="flex flex-1 items-center justify-between rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-left transition-colors hover:border-blue-400 hover:bg-blue-100 disabled:opacity-50"
          >
            <span className="text-xs font-medium uppercase text-blue-600">
              {title} ({players.length})
            </span>
            <span className="text-xs text-blue-500">{actionButton.label}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={isExecuting}
            className="flex flex-1 items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            <span className="text-xs font-medium uppercase text-gray-500">
              {title} ({players.length})
            </span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && players.length === 0 && emptyMessage && (
        <p className="text-sm italic text-gray-400">{emptyMessage}</p>
      )}
      {isExpanded && players.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {players.map((player) => {
            const id = getPlayerId(player);
            const playTime = playTimeByPlayer?.get(id);
            const isSelected =
              selection.player && getPlayerId(selection.player) === id;
            const jerseyNumber = getJerseyNumber(player);

            return (
              <button
                key={id}
                type="button"
                onClick={() => onPlayerClick(player, source)}
                disabled={isExecuting}
                className={`flex flex-col items-start rounded-lg border p-2 text-left transition-colors disabled:opacity-50 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {jerseyNumber && (
                    <span className="text-xs font-bold text-gray-600">
                      #{jerseyNumber}
                    </span>
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? 'text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    {getPlayerDisplayName(player)}
                  </span>
                </div>
                {playTime !== undefined && (
                  <span className="text-xs text-gray-500">
                    {playTime.minutes} min
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Presentation component for the lineup panel (fixed bottom sheet)
 */
export const LineupPanelPresentation = ({
  panelState,
  onPanelStateChange,
  gameStatus,
  teamName,
  teamColor,
  playersPerTeam,
  onFieldPlayers,
  benchPlayers,
  availableRoster,
  playTimeByPlayer,
  selection,
  onPlayerClick,
  onClearSelection,
  queue,
  onRemoveFromQueue,
  onConfirmAll,
  onClearQueue,
  onKeepSameLineup,
  onAddToBench,
  isExecuting,
  executionProgress,
  error,
  filledPositions,
  filledCount,
}: LineupPanelPresentationProps) => {
  const totalPositions = playersPerTeam;
  const statusLabel =
    gameStatus === 'SCHEDULED' ? 'Starting Lineup' : 'Second Half Lineup';

  // Render collapsed bar
  if (panelState === 'collapsed') {
    const isPlayerFirstActive =
      selection.direction === 'player-first' && selection.player;

    return (
      <div
        className="border-t border-gray-200 bg-white shadow-lg"
        onClick={() => {
          if (!isPlayerFirstActive) onPanelStateChange('bench-view');
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isPlayerFirstActive)
            onPanelStateChange('bench-view');
        }}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="flex min-h-[44px] items-center justify-between px-4 pb-3 pt-1">
          {isPlayerFirstActive ? (
            <>
              <span className="text-sm text-gray-700">
                Place{' '}
                <span className="font-medium text-blue-600">
                  {getPlayerDisplayName(selection.player!)}
                </span>
                <span className="text-gray-500"> — tap position on field</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSelection();
                }}
                className="ml-2 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: teamColor }}
                />
                <span className="font-medium text-gray-900">{statusLabel}</span>
                <span className="text-sm text-gray-500">
                  {filledCount}/{totalPositions}
                </span>
              </div>
              {queue.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {queue.length}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Render expanded panel - capped max-height with internal scroll
  return (
    <div className="flex max-h-[35vh] flex-col overflow-hidden border-t border-gray-200 bg-white shadow-lg sm:max-h-[40vh]">
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
      <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <span className="font-medium text-gray-900">{teamName}</span>
        </div>

        <span className="text-sm text-gray-500">
          {filledCount}/{totalPositions}
        </span>
      </div>

      {/* Content area - scrolls within capped max-height */}
      <div className="flex-1 overflow-y-auto">
        {/* Selection header */}
        {selection.direction && (
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
            {selection.direction === 'position-first' && selection.position && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Assign player to:{' '}
                  <span className="font-medium text-blue-600">
                    {selection.position}
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
            {selection.direction === 'player-first' && selection.player && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Place{' '}
                  <span className="font-medium text-blue-600">
                    {getPlayerDisplayName(selection.player)}
                  </span>
                  <span className="text-gray-500">
                    {' '}
                    — tap position on field
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

        {/* Queued items */}
        {queue.length > 0 && (
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-gray-500">
                Queued ({queue.length})
              </span>
              <button
                type="button"
                onClick={onClearQueue}
                disabled={isExecuting}
                className="text-xs text-gray-500 hover:text-red-500 disabled:opacity-50"
              >
                Clear all
              </button>
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

        {/* Player sections */}
        <div className="px-4 py-3">
          <CollapsiblePlayerSection
            title="Bench"
            players={benchPlayers}
            source="bench"
            selection={selection}
            onPlayerClick={onPlayerClick}
            playTimeByPlayer={playTimeByPlayer}
            isExecuting={isExecuting}
            defaultExpanded={gameStatus === 'HALFTIME'}
            actionButton={
              selection.direction === 'player-first' &&
              selection.player !== null &&
              selection.playerSource !== 'bench'
                ? {
                    label:
                      selection.playerSource === 'onField'
                        ? 'Move to bench'
                        : 'Add to bench',
                    onClick: onAddToBench,
                  }
                : undefined
            }
          />

          <CollapsiblePlayerSection
            title="Team Roster"
            players={availableRoster}
            source="roster"
            selection={selection}
            onPlayerClick={onPlayerClick}
            isExecuting={isExecuting}
            defaultExpanded={gameStatus === 'SCHEDULED'}
            emptyMessage="All roster players assigned"
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-4 my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Execution progress */}
        {isExecuting && (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-gray-600">
              Processing... ({executionProgress}/{queue.length})
            </p>
          </div>
        )}
      </div>

      {/* Footer with actions */}
      {!isExecuting && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {gameStatus === 'HALFTIME' &&
            onKeepSameLineup &&
            queue.length === 0 && (
              <button
                type="button"
                onClick={onKeepSameLineup}
                className="mb-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Keep Same Lineup
              </button>
            )}

          {queue.length > 0 && (
            <button
              type="button"
              onClick={onConfirmAll}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Confirm Lineup ({queue.length} changes)
            </button>
          )}

          {queue.length === 0 &&
            !(gameStatus === 'HALFTIME' && onKeepSameLineup) && (
              <div className="text-center text-sm text-gray-500">
                {filledCount < playersPerTeam
                  ? `${playersPerTeam - filledCount} positions remaining`
                  : 'Lineup complete'}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

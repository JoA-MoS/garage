import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { RosterPlayer as TeamRosterPlayer } from '../../../hooks/use-lineup';

import {
  LineupPanelPresentationProps,
  QueuedLineupItem,
  LineupSelection,
} from './types';

/**
 * Get player ID for matching
 */
const getPlayerId = (player: GqlRosterPlayer | TeamRosterPlayer) => {
  if ('playerId' in player) return player.playerId || player.externalPlayerName || '';
  return player.oduserId;
};

/**
 * Get display name for a player
 */
function getPlayerDisplayName(player: GqlRosterPlayer | TeamRosterPlayer): string {
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
function getJerseyNumber(player: GqlRosterPlayer | TeamRosterPlayer): string | null {
  if ('externalPlayerNumber' in player) return player.externalPlayerNumber || null;
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
            <span className="font-medium text-purple-600">{item.toPosition}</span>
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
 * Section component for a group of players
 */
function PlayerSection({
  title,
  players,
  source,
  selection,
  onPlayerClick,
  playTimeByPlayer,
  isExecuting,
  emptyMessage,
}: {
  title: string;
  players: (GqlRosterPlayer | TeamRosterPlayer)[];
  source: 'onField' | 'bench' | 'roster';
  selection: LineupSelection;
  onPlayerClick: (
    player: GqlRosterPlayer | TeamRosterPlayer,
    source: 'onField' | 'bench' | 'roster'
  ) => void;
  playTimeByPlayer?: Map<string, { minutes: number; isOnField: boolean }>;
  isExecuting: boolean;
  emptyMessage?: string;
}) {
  if (players.length === 0 && !emptyMessage) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-medium uppercase text-gray-500">
        {title} ({players.length})
      </div>
      {players.length === 0 ? (
        <p className="text-sm italic text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {players.map((player) => {
            const id = getPlayerId(player);
            const playTime = playTimeByPlayer?.get(id);
            const isSelected =
              selection.player && getPlayerId(selection.player) === id;
            const jerseyNumber = getJerseyNumber(player);
            const position = 'position' in player ? player.position : null;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onPlayerClick(player, source)}
                disabled={isExecuting}
                className={`flex flex-col items-start rounded-lg border p-2 text-left transition-colors disabled:opacity-50 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : source === 'onField'
                      ? 'border-green-200 bg-green-50 hover:border-green-300'
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
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {position && <span className="font-medium">{position}</span>}
                  {playTime !== undefined && (
                    <span>{playTime.minutes} min</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Presentation component for the inline lineup panel
 */
export const LineupPanelPresentation = ({
  panelState,
  onPanelStateChange,
  gameStatus,
  teamName,
  teamColor,
  formation,
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
  isExecuting,
  executionProgress,
  error,
  filledPositions,
  availableFormations,
  onFormationChange,
}: LineupPanelPresentationProps) => {
  const filledCount = filledPositions.size;
  const totalPositions = playersPerTeam;
  const statusLabel =
    gameStatus === 'SCHEDULED' ? 'Starting Lineup' : 'Second Half Lineup';

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
        </div>
      </div>
    );
  }

  // Render expanded states (bench-view or expanded)
  const isExpanded = panelState === 'expanded';
  const panelHeight = isExpanded ? 'max-h-[60vh]' : 'max-h-[40vh]';

  return (
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
      <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-1">
        <div
          className="flex cursor-pointer items-center gap-2"
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
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <span className="font-medium text-gray-900">{teamName}</span>
        </div>

        {/* Formation selector */}
        <div className="flex items-center gap-2">
          <select
            value={formation || ''}
            onChange={(e) => onFormationChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isExecuting}
          >
            <option value="">No formation</option>
            {availableFormations.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {filledCount}/{totalPositions}
          </span>
        </div>
      </div>

      {/* Content area */}
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
                  <span className="text-gray-500"> — tap position on field</span>
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
          {onFieldPlayers.length > 0 && (
            <PlayerSection
              title="On Field"
              players={onFieldPlayers}
              source="onField"
              selection={selection}
              onPlayerClick={onPlayerClick}
              playTimeByPlayer={playTimeByPlayer}
              isExecuting={isExecuting}
            />
          )}

          <PlayerSection
            title="Bench"
            players={benchPlayers}
            source="bench"
            selection={selection}
            onPlayerClick={onPlayerClick}
            playTimeByPlayer={playTimeByPlayer}
            isExecuting={isExecuting}
            emptyMessage="No players on bench"
          />

          <PlayerSection
            title="Available from Roster"
            players={availableRoster}
            source="roster"
            selection={selection}
            onPlayerClick={onPlayerClick}
            isExecuting={isExecuting}
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
                {filledPositions.size < playersPerTeam
                  ? `${playersPerTeam - filledPositions.size} positions remaining`
                  : 'Lineup complete'}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

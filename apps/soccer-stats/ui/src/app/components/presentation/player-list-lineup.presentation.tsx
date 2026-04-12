import type { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

export interface PlayerListLineupProps {
  onField: GqlRosterPlayer[];
  bench: GqlRosterPlayer[];
  playersPerTeam: number;
  teamColor?: string;
  disabled?: boolean;
  queuedPlayerIds?: Set<string>;
  selectedFieldPlayerId?: string | null;
  hasBenchSelectionActive?: boolean;
  onFieldPlayerClick?: (player: GqlRosterPlayer) => void;
  onBenchPlayerClick?: (player: GqlRosterPlayer) => void;
  /** Called when user taps "Add to Field" during lineup setup in substitution-only mode */
  onAddToFieldClick?: () => void;
  /** Optional jersey number resolver. When omitted, falls back to externalPlayerNumber. */
  getJerseyNumber?: (player: GqlRosterPlayer) => string;
}

function getDisplayName(player: GqlRosterPlayer): string {
  if (player.externalPlayerName) return player.externalPlayerName;
  const first = player.firstName ?? '';
  const last = player.lastName ?? '';
  return `${first} ${last}`.trim() || 'Unknown';
}

function getJersey(player: GqlRosterPlayer): string {
  return player.externalPlayerNumber ?? '?';
}

function PlayerChip({
  player,
  jerseyNumber,
  isQueued,
  isSelected,
  teamColor,
  disabled,
  onClick,
}: {
  player: GqlRosterPlayer;
  jerseyNumber: string;
  isQueued: boolean;
  isSelected: boolean;
  teamColor: string;
  disabled: boolean;
  onClick?: () => void;
}) {
  const ringStyle = isSelected
    ? { outline: `2px solid ${teamColor}`, outlineOffset: '2px' }
    : isQueued
      ? { outline: '2px dashed #f59e0b', outlineOffset: '2px' }
      : {};

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      style={ringStyle}
      className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 disabled:cursor-default disabled:opacity-60"
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: teamColor }}
      >
        {jerseyNumber}
      </span>
      <span className="truncate font-medium text-gray-800">
        {getDisplayName(player)}
      </span>
    </button>
  );
}

export function PlayerListLineup({
  onField,
  bench,
  playersPerTeam,
  teamColor = '#3B82F6',
  disabled = false,
  queuedPlayerIds = new Set(),
  selectedFieldPlayerId = null,
  hasBenchSelectionActive = false,
  onFieldPlayerClick,
  onBenchPlayerClick,
  onAddToFieldClick,
  getJerseyNumber,
}: PlayerListLineupProps) {
  const resolveJersey = getJerseyNumber ?? getJersey;
  return (
    <div className="space-y-4">
      {/* On Field */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <h4 className="text-sm font-semibold text-gray-700">
            On Field
            <span className="ml-1.5 font-normal text-gray-400">
              {onField.length}/{playersPerTeam}
            </span>
          </h4>
          {hasBenchSelectionActive && !onAddToFieldClick && (
            <span className="ml-auto text-xs text-amber-600">
              Select player to substitute out
            </span>
          )}
        </div>
        {onField.length === 0 && !onAddToFieldClick ? (
          <p className="py-3 text-center text-sm text-gray-400">
            No players on field
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {onField.map((player) => (
              <PlayerChip
                key={player.gameEventId}
                player={player}
                jerseyNumber={resolveJersey(player)}
                isQueued={queuedPlayerIds.has(player.gameEventId ?? '')}
                isSelected={player.gameEventId === selectedFieldPlayerId}
                teamColor={teamColor}
                disabled={disabled}
                onClick={
                  onFieldPlayerClick
                    ? () => onFieldPlayerClick(player)
                    : undefined
                }
              />
            ))}
            {onAddToFieldClick && (
              <button
                type="button"
                onClick={onAddToFieldClick}
                disabled={disabled}
                className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 px-3 py-2 text-left text-sm transition-colors hover:bg-blue-100 disabled:opacity-50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-base font-bold text-white">
                  +
                </span>
                <span className="truncate font-medium text-blue-600">
                  Add to Field
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bench */}
      {bench.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <h4 className="text-sm font-semibold text-gray-700">
              Bench
              <span className="ml-1.5 font-normal text-gray-400">
                {bench.length}
              </span>
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {bench.map((player) => (
              <PlayerChip
                key={player.gameEventId}
                player={player}
                jerseyNumber={resolveJersey(player)}
                isQueued={false}
                isSelected={false}
                teamColor="#9ca3af"
                disabled={disabled}
                onClick={
                  onBenchPlayerClick
                    ? () => onBenchPlayerClick(player)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

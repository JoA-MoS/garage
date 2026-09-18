import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { FIELD_SENTINEL_POSITION } from '../smart/lineup-panel/types';

import { PlayerCard } from './player-card.presentation';

const getPlayerId = (player: GqlRosterPlayer) =>
  player.playerId || player.externalPlayerName || '';

export interface OnFieldCardGridProps {
  onFieldPlayers: GqlRosterPlayer[];
  playTimeByPlayer: Map<string, { totalSeconds: number; isOnField: boolean }>;
  /** Game event IDs of players queued for a substitution, swap, or removal. */
  queuedPlayerIds?: Set<string>;
  /** Game event ID of the player currently selected as a swap/sub target. */
  selectedFieldPlayerId?: string | null;
  disabled?: boolean;
  onFieldPlayerClick?: (player: GqlRosterPlayer) => void;
  /**
   * Optional jersey-number resolver (e.g. looks up managed-roster numbers
   * via team roster, not just external players). Falls back to
   * PlayerCard's own default (player.externalPlayerNumber) when omitted.
   */
  getJerseyNumber?: (player: GqlRosterPlayer) => string;
  /**
   * Renders a dashed "Add to Field" tile after the roster cards when
   * provided — used when position tracking is off and the team is short a
   * player (bringing someone on with no one going out).
   */
  onAddToFieldClick?: () => void;
}

/**
 * Card-grid rendering of the on-field roster — the live-play alternative to
 * the FieldLineup SVG. Reuses the same PlayerCard the substitution panel's
 * bench grid uses, so on-field players get the live MM:SS ticker.
 */
export function OnFieldCardGrid({
  onFieldPlayers,
  playTimeByPlayer,
  queuedPlayerIds = new Set(),
  selectedFieldPlayerId = null,
  disabled = false,
  onFieldPlayerClick,
  getJerseyNumber,
  onAddToFieldClick,
}: OnFieldCardGridProps) {
  if (onFieldPlayers.length === 0 && !onAddToFieldClick) {
    return (
      <p className="py-3 text-center text-sm text-gray-400">
        No players on field
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {onFieldPlayers.map((player) => {
        const id = getPlayerId(player);
        const playTime = playTimeByPlayer.get(id);
        // The "FIELD" position is a sentinel used internally when position
        // tracking is off - never show it as a real position.
        const hasRealPosition =
          player.position && player.position !== FIELD_SENTINEL_POSITION;

        return (
          <PlayerCard
            key={player.gameEventId}
            player={player}
            variant="onField"
            timeSeconds={playTime?.totalSeconds ?? 0}
            isLive={playTime?.isOnField ?? false}
            isSelected={player.gameEventId === selectedFieldPlayerId}
            isQueued={queuedPlayerIds.has(player.gameEventId)}
            positionLabel={hasRealPosition ? player.position : null}
            jerseyNumber={getJerseyNumber?.(player)}
            disabled={disabled}
            onClick={() => !disabled && onFieldPlayerClick?.(player)}
          />
        );
      })}
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
  );
}

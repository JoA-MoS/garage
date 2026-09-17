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
}: OnFieldCardGridProps) {
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
            key={id}
            player={player}
            variant="onField"
            timeSeconds={playTime?.totalSeconds ?? 0}
            isLive={playTime?.isOnField ?? false}
            isSelected={player.gameEventId === selectedFieldPlayerId}
            isQueued={queuedPlayerIds.has(player.gameEventId)}
            positionLabel={hasRealPosition ? player.position : null}
            disabled={disabled}
            onClick={() => !disabled && onFieldPlayerClick?.(player)}
          />
        );
      })}
    </div>
  );
}

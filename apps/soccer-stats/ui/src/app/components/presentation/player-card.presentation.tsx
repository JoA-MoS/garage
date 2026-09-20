import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import {
  DEFAULT_PLAYER_NAME_DISPLAY_CONFIG,
  JerseyNumberPosition,
  type PlayerNameDisplayConfig,
} from '../../context/player-name-display.context';
import { formatTime } from '../../utils';
import {
  formatPlayerName,
  type PlayerNameDisplayFormat,
} from '../../utils/format-player-name';

/**
 * Prefers firstName/lastName (formatted per the team's configured display
 * format) so a team's format choice actually takes effect; playerName is a
 * server-computed "First Last" fallback for rows that don't carry name
 * parts, and externalPlayerName covers players with no linked account.
 */
function getPlayerDisplayName(
  player: GqlRosterPlayer,
  format: PlayerNameDisplayFormat,
): string {
  if (player.firstName || player.lastName) {
    return formatPlayerName(
      { firstName: player.firstName, lastName: player.lastName },
      format,
    );
  }
  if (player.playerName) return player.playerName;
  if (player.externalPlayerName) return player.externalPlayerName;
  return 'Unknown';
}

export interface PlayerCardProps {
  player: GqlRosterPlayer;
  variant: 'bench' | 'onField';
  timeSeconds: number;
  isLive: boolean;
  isSelected: boolean;
  /** Queued for a substitution, swap, or removal — shown dimmed with a badge instead of disappearing. */
  isQueued?: boolean;
  positionLabel?: string | null;
  /**
   * Jersey number override — falls back to player.externalPlayerNumber when
   * omitted. Used by callers that resolve numbers for managed roster
   * players too (e.g. via a team roster lookup), not just external players.
   */
  jerseyNumber?: string;
  /** Disables the underlying button (e.g. while a mutation is in flight). */
  disabled?: boolean;
  onClick: () => void;
  /**
   * Display preferences for name format and jersey number. Defaults to
   * {@link DEFAULT_PLAYER_NAME_DISPLAY_CONFIG} when omitted so the component
   * remains usable in isolation (Storybook, unit tests) without a provider.
   */
  nameDisplayConfig?: PlayerNameDisplayConfig;
}

/**
 * Player card shared by the substitution panel's Bench grid and the
 * Lineup tab's on-field card view. On-field players get a live MM:SS
 * ticker with a pulsing dot, mirroring the "live" time treatment in
 * PlayerStatsTablePresentation; bench players show static banked time.
 */
export function PlayerCard({
  player,
  variant,
  timeSeconds,
  isLive,
  isSelected,
  isQueued = false,
  positionLabel,
  jerseyNumber,
  disabled = false,
  onClick,
  nameDisplayConfig = DEFAULT_PLAYER_NAME_DISPLAY_CONFIG,
}: PlayerCardProps) {
  const { format, showJerseyNumber, jerseyNumberPosition } = nameDisplayConfig;
  const isOnField = variant === 'onField';
  const displayNumber = jerseyNumber ?? player.externalPlayerNumber;
  const showNumberBadge = showJerseyNumber && !!displayNumber;

  const cardClasses = isQueued
    ? 'border-orange-300 bg-orange-50 opacity-70'
    : isSelected
      ? isOnField
        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-400 ring-offset-1'
        : 'border-green-500 bg-green-50'
      : isOnField
        ? 'border-purple-200 bg-purple-50 hover:border-purple-300'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';

  const nameClasses =
    isSelected && isOnField
      ? 'text-blue-900'
      : isOnField
        ? 'text-purple-900'
        : isSelected
          ? 'text-green-700'
          : 'text-gray-900';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-start rounded-lg border p-2 transition-colors disabled:cursor-default disabled:opacity-60 ${cardClasses}`}
    >
      {isQueued && (
        <span
          aria-label="Queued"
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white shadow-md"
        >
          ↓
        </span>
      )}
      <div className="flex items-center gap-2">
        {jerseyNumberPosition === JerseyNumberPosition.After ? (
          <>
            <span className={`text-sm font-medium ${nameClasses}`}>
              {getPlayerDisplayName(player, format)}
            </span>
            {showNumberBadge && (
              <span
                className={`text-xs font-bold ${isOnField ? 'text-purple-600' : 'text-gray-600'}`}
              >
                #{displayNumber}
              </span>
            )}
          </>
        ) : (
          <>
            {showNumberBadge && (
              <span
                className={`text-xs font-bold ${isOnField ? 'text-purple-600' : 'text-gray-600'}`}
              >
                #{displayNumber}
              </span>
            )}
            <span className={`text-sm font-medium ${nameClasses}`}>
              {getPlayerDisplayName(player, format)}
            </span>
          </>
        )}
      </div>
      <span
        className={`inline-flex items-center gap-1.5 text-xs ${isOnField ? 'text-purple-600' : 'text-gray-500'}`}
      >
        {formatTime(timeSeconds)}
        {isLive && (
          <span
            role="status"
            aria-label="Live"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"
            title="On field"
          />
        )}
        {positionLabel ? ` · ${positionLabel}` : ''}
      </span>
    </button>
  );
}

import { useMemo } from 'react';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import {
  Formation,
  FormationPosition,
  POSITIONS,
} from '../../constants/positions';
import { getPlayerDisplayName } from '../../hooks/use-lineup';

// Get initials from a player (e.g., firstName="John", lastName="Doe" -> "JD")
function getPlayerInitials(player: GqlRosterPlayer): string {
  // For roster players, use firstName and lastName
  if (player.playerId && (player.firstName || player.lastName)) {
    const first = player.firstName?.[0] || '';
    const last = player.lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  }

  // For external players, prefer number, then initials from name
  if (player.externalPlayerNumber) {
    return player.externalPlayerNumber;
  }
  if (player.externalPlayerName) {
    const parts = player.externalPlayerName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  return '?';
}

interface FieldLineupProps {
  formation: Formation;
  lineup: GqlRosterPlayer[];
  onPositionClick?: (
    position: FormationPosition,
    assignedPlayer?: GqlRosterPlayer,
  ) => void;
  teamColor?: string;
  isHome?: boolean;
  disabled?: boolean;
  /** When true, assigned player positions show cursor-pointer to indicate clickability */
  highlightClickableAssigned?: boolean;
}

export function FieldLineup({
  formation,
  lineup,
  onPositionClick,
  teamColor = '#3B82F6',
  isHome = true,
  disabled = false,
  highlightClickableAssigned = false,
}: FieldLineupProps) {
  // Precompute player assignments for each formation position slot
  // This handles formations with multiple slots sharing the same position code (e.g., two CBs)
  const positionAssignments = useMemo(() => {
    // Group lineup players by position code
    const playersByPositionCode = new Map<string, GqlRosterPlayer[]>();
    lineup.forEach((player) => {
      if (player.position) {
        const existing = playersByPositionCode.get(player.position) || [];
        existing.push(player);
        playersByPositionCode.set(player.position, existing);
      }
    });

    // Assign players to formation slots, distributing across same-position slots
    const assignments = new Map<number, GqlRosterPlayer | undefined>();
    const positionIndex = new Map<string, number>();

    formation.positions.forEach((pos, slotIndex) => {
      const players = playersByPositionCode.get(pos.position) || [];
      const playerIndex = positionIndex.get(pos.position) || 0;
      assignments.set(slotIndex, players[playerIndex]);
      positionIndex.set(pos.position, playerIndex + 1);
    });

    return assignments;
  }, [formation.positions, lineup]);

  // Field dimensions for 3/4 view (our half + quarter of opponent's half)
  // Full field would be 150, so 3/4 = 112.5, but we use 125 to show more attacking space
  const FIELD_HEIGHT = 125;

  // Transform formation y (0-100) to SVG y coordinate
  // Formation: y=0 is own goal, y=100 is opponent goal
  // We want: GK (y=5) at BOTTOM, ST (y=75-80) at TOP
  // SVG coordinate: y=FIELD_HEIGHT is bottom (our goal), y=0 is top (toward opponent)
  const getAdjustedY = (y: number) => {
    // Invert y so low values (GK) go to bottom, high values (ST) go to top
    // Map formation y (0-100) to SVG y (FIELD_HEIGHT down to ~0)
    const inverted = isHome ? 100 - y : y;
    // Scale to fit in the viewBox (formation 0-100 maps to SVG 0-FIELD_HEIGHT range)
    return (inverted / 100) * FIELD_HEIGHT;
  };

  // Transform formation x (0-100) to screen position
  // From keeper's perspective looking up field:
  // - LB (x=15) should be on keeper's LEFT = screen LEFT
  // - RB (x=85) should be on keeper's RIGHT = screen RIGHT
  // No flip needed for home team; away team needs flip since they view from opposite goal
  const getAdjustedX = (x: number) => (isHome ? x : 100 - x);

  return (
    <div
      className="relative w-full"
      style={{ paddingBottom: `${FIELD_HEIGHT}%` }}
    >
      {/* Soccer field background */}
      <div className="absolute inset-0 overflow-hidden rounded-lg bg-green-600">
        {/* Field markings - 3/4 field view from keeper's perspective */}
        <svg
          viewBox={`0 0 100 ${FIELD_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Outer boundary - 3/4 field */}
          <rect
            x="2"
            y="2"
            width="96"
            height={FIELD_HEIGHT - 4}
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />

          {/* Center line - positioned at 1/3 from top (midfield in 3/4 view) */}
          <line
            x1="2"
            y1={FIELD_HEIGHT * 0.33}
            x2="98"
            y2={FIELD_HEIGHT * 0.33}
            stroke="white"
            strokeWidth="0.5"
          />

          {/* Center circle at midfield */}
          <circle
            cx="50"
            cy={FIELD_HEIGHT * 0.33}
            r="12"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <circle cx="50" cy={FIELD_HEIGHT * 0.33} r="0.5" fill="white" />

          {/* Goal area - at bottom (our goal, keeper's position) */}
          <rect
            x="30"
            y={FIELD_HEIGHT - 10}
            width="40"
            height="8"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <rect
            x="38"
            y={FIELD_HEIGHT - 6}
            width="24"
            height="4"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />

          {/* Penalty arc - at bottom */}
          <path
            d={`M 38 ${FIELD_HEIGHT - 10} Q 50 ${FIELD_HEIGHT - 18} 62 ${FIELD_HEIGHT - 10}`}
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />

          {/* Corner arcs - bottom only for 3/4 view */}
          <path
            d={`M 2 ${FIELD_HEIGHT - 5} Q 5 ${FIELD_HEIGHT - 5} 5 ${FIELD_HEIGHT - 2}`}
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d={`M 95 ${FIELD_HEIGHT - 2} Q 95 ${FIELD_HEIGHT - 5} 98 ${FIELD_HEIGHT - 5}`}
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>

        {/* Player positions */}
        {formation.positions.map((pos, index) => {
          const assignedPlayer = positionAssignments.get(index);
          const adjustedX = getAdjustedX(pos.x);
          const adjustedY = getAdjustedY(pos.y);
          const positionInfo = POSITIONS[pos.position];

          return (
            <button
              key={`${pos.position}-${index}`}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 transform flex-col items-center transition-transform hover:scale-110 ${
                disabled
                  ? 'cursor-default'
                  : highlightClickableAssigned && assignedPlayer
                    ? 'cursor-pointer ring-2 ring-white ring-offset-2 ring-offset-green-600'
                    : 'cursor-pointer'
              }`}
              style={{
                left: `${adjustedX}%`,
                top: `${(adjustedY / FIELD_HEIGHT) * 100}%`,
              }}
              onClick={() =>
                !disabled && onPositionClick?.(pos, assignedPlayer)
              }
              disabled={disabled}
              type="button"
            >
              {/* Player marker */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg sm:h-10 sm:w-10 sm:text-sm ${
                  assignedPlayer ? '' : 'border-dashed opacity-60'
                }`}
                style={{
                  backgroundColor: assignedPlayer
                    ? teamColor
                    : 'rgba(0,0,0,0.3)',
                }}
              >
                {assignedPlayer ? getPlayerInitials(assignedPlayer) : '+'}
              </div>

              {/* Position label */}
              <span className="mt-0.5 rounded bg-black/50 px-1 text-[8px] text-white sm:text-[10px]">
                {positionInfo?.code || pos.position}
              </span>

              {/* Player name (if assigned) */}
              {assignedPlayer && (
                <span className="max-w-16 truncate rounded bg-black/50 px-1 text-[8px] text-white sm:max-w-20 sm:text-[10px]">
                  {getPlayerDisplayName(assignedPlayer).split(' ').pop()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FieldLineup;

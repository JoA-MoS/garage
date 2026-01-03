import { useMemo } from 'react';

import { LineupPlayer } from '@garage/soccer-stats/graphql-codegen';

import {
  Formation,
  FormationPosition,
  POSITIONS,
} from '../../constants/positions';
import { getPlayerDisplayName } from '../../hooks/use-lineup';

// Get initials from a player (e.g., firstName="John", lastName="Doe" -> "JD")
function getPlayerInitials(player: LineupPlayer): string {
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
  lineup: LineupPlayer[];
  onPositionClick?: (
    position: FormationPosition,
    assignedPlayer?: LineupPlayer,
  ) => void;
  teamColor?: string;
  isHome?: boolean;
  disabled?: boolean;
}

export function FieldLineup({
  formation,
  lineup,
  onPositionClick,
  teamColor = '#3B82F6',
  isHome = true,
  disabled = false,
}: FieldLineupProps) {
  // Precompute player assignments for each formation position slot
  // This handles formations with multiple slots sharing the same position code (e.g., two CBs)
  const positionAssignments = useMemo(() => {
    // Group lineup players by position code
    const playersByPositionCode = new Map<string, LineupPlayer[]>();
    lineup.forEach((player) => {
      if (player.position) {
        const existing = playersByPositionCode.get(player.position) || [];
        existing.push(player);
        playersByPositionCode.set(player.position, existing);
      }
    });

    // Assign players to formation slots, distributing across same-position slots
    const assignments = new Map<number, LineupPlayer | undefined>();
    const positionIndex = new Map<string, number>();

    formation.positions.forEach((pos, slotIndex) => {
      const players = playersByPositionCode.get(pos.position) || [];
      const playerIndex = positionIndex.get(pos.position) || 0;
      assignments.set(slotIndex, players[playerIndex]);
      positionIndex.set(pos.position, playerIndex + 1);
    });

    return assignments;
  }, [formation.positions, lineup]);

  // For away team, flip the y coordinates
  const getAdjustedY = (y: number) => (isHome ? y : 100 - y);

  return (
    <div className="relative w-full" style={{ paddingBottom: '150%' }}>
      {/* Soccer field background */}
      <div className="absolute inset-0 overflow-hidden rounded-lg bg-green-600">
        {/* Field markings */}
        <svg
          viewBox="0 0 100 150"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Outer boundary */}
          <rect
            x="2"
            y="2"
            width="96"
            height="146"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />

          {/* Center line */}
          <line
            x1="2"
            y1="75"
            x2="98"
            y2="75"
            stroke="white"
            strokeWidth="0.5"
          />

          {/* Center circle */}
          <circle
            cx="50"
            cy="75"
            r="12"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <circle cx="50" cy="75" r="0.5" fill="white" />

          {/* Goal areas - bottom */}
          <rect
            x="30"
            y="2"
            width="40"
            height="8"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <rect
            x="38"
            y="2"
            width="24"
            height="4"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />

          {/* Goal areas - top */}
          <rect
            x="30"
            y="140"
            width="40"
            height="8"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <rect
            x="38"
            y="144"
            width="24"
            height="4"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />

          {/* Penalty arcs */}
          <path
            d="M 38 10 Q 50 18 62 10"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M 38 140 Q 50 132 62 140"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />

          {/* Corner arcs */}
          <path
            d="M 2 5 Q 5 5 5 2"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M 95 2 Q 95 5 98 5"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M 2 145 Q 5 145 5 148"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M 95 148 Q 95 145 98 145"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>

        {/* Player positions */}
        {formation.positions.map((pos, index) => {
          const assignedPlayer = positionAssignments.get(index);
          const adjustedY = getAdjustedY(pos.y);
          const positionInfo = POSITIONS[pos.position];

          return (
            <button
              key={`${pos.position}-${index}`}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 transform flex-col items-center transition-transform hover:scale-110 ${
                disabled ? 'cursor-default' : 'cursor-pointer'
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${(adjustedY / 150) * 100}%`,
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

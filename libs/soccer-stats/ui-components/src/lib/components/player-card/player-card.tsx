import { formatTime } from '../../utils';
import type { PlayerStats } from '../../types';

/**
 * Pure Presentation Component: No GraphQL dependencies
 * Receives all computed data as props - no calculations here
 * Mobile-first responsive design
 */

export interface PlayerCardProps {
  // Basic player info
  id: string;
  name: string;
  jersey: number;
  position: string;
  photo?: string;
  playTime: number;
  isOnField: boolean;

  // Stats
  stats: PlayerStats;

  // Event handlers
  onYellowCardClick?: () => void;
  onRedCardClick?: () => void;
  onFoulCommittedClick?: () => void;
  onFoulReceivedClick?: () => void;
  onShotOnTargetClick?: () => void;
  onShotOffTargetClick?: () => void;
  onSaveClick?: () => void;

  // UI state
  showStatButtons?: boolean;
  showPhase1Stats?: boolean;
}

export const PlayerCard = ({
  name,
  jersey,
  position,
  photo,
  playTime,
  isOnField,
  stats,
  onYellowCardClick,
  onRedCardClick,
  onFoulCommittedClick,
  onShotOnTargetClick,
  onShotOffTargetClick,
  onSaveClick,
  showStatButtons = false,
  showPhase1Stats = false,
}: PlayerCardProps) => {
  const cardClass = isOnField
    ? 'bg-green-50 border border-green-200'
    : 'bg-gray-50 border border-gray-200';

  const nameClass = isOnField
    ? 'font-semibold text-green-800'
    : 'font-semibold text-gray-800';

  const positionClass = isOnField
    ? 'text-sm text-green-600'
    : 'text-sm text-gray-600';

  const timeClass = isOnField
    ? 'text-sm font-mono text-green-700'
    : 'text-sm font-mono text-gray-700';

  return (
    <div className={`${cardClass} rounded-lg p-3 sm:p-4`}>
      <div className="flex space-x-3 sm:space-x-4">
        {/* Player Photo - Mobile-first responsive */}
        <div className="flex-shrink-0">
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="
                h-20 w-16 rounded-lg border-2 border-gray-300 object-cover shadow-md
                sm:h-24 sm:w-20
              "
            />
          ) : (
            <div
              className="
              flex h-20 w-16 flex-col items-center justify-center rounded-lg border-2 border-gray-400 bg-gray-300 text-gray-600 shadow-md
              sm:h-24 sm:w-20
            "
            >
              <span className="text-xl font-bold sm:text-2xl">#{jersey}</span>
              <span className="mt-1 text-xs">No Photo</span>
            </div>
          )}
        </div>

        {/* Player Info and Stats - Mobile-first layout */}
        <div className="min-w-0 flex-1">
          {/* Top row: Name, Position, and Play Time */}
          <div
            className="
            mb-2 flex flex-col items-start
            justify-between space-y-1
            sm:flex-row sm:space-y-0
          "
          >
            <div>
              <h4 className={`${nameClass} text-base sm:text-lg`}>
                <span className="font-bold">#{jersey}</span>{' '}
                <span className="block text-sm sm:inline sm:text-base">
                  {name}
                </span>
              </h4>
              <p className={positionClass}>{position}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className={timeClass}>{formatTime(playTime)}</p>
            </div>
          </div>

          {/* Stats and Action Buttons */}
          <div className="space-y-2">
            {/* Basic Stats */}
            <div className="flex space-x-4 text-sm">
              <span className="text-gray-600">Goals: {stats.goals}</span>
              <span className="text-gray-600">Assists: {stats.assists}</span>
            </div>

            {/* Phase 1 Stats */}
            {showPhase1Stats && (
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                <span
                  aria-label={`Yellow Cards: ${stats.yellowCards}, Red Cards: ${stats.redCards}`}
                >
                  Cards: {stats.yellowCards}Y {stats.redCards}R
                </span>
                <span
                  aria-label={`Fouls Committed: ${stats.foulsCommitted}, Fouls Received: ${stats.foulsReceived}`}
                >
                  Fouls: {stats.foulsCommitted}C {stats.foulsReceived}R
                </span>
                <span
                  title="Shots On Target (includes goals) / Shots Off Target"
                  aria-label={`Shots On Target: ${stats.shotsOnTarget}, Shots Off Target: ${stats.shotsOffTarget}`}
                >
                  Shots: {stats.shotsOnTarget}ON {stats.shotsOffTarget}OFF
                </span>
                {position === 'Goalkeeper' && (
                  <span aria-label={`Saves: ${stats.saves}`}>
                    Saves: {stats.saves}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons - Mobile-first touch targets */}
            {showStatButtons && (
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={onYellowCardClick}
                    className="
                      min-h-[32px] min-w-[32px] rounded
                      bg-yellow-500 px-2 py-1 text-xs text-white
                      transition-transform hover:bg-yellow-600
                      active:scale-95 active:bg-yellow-700
                      sm:px-1 sm:py-0.5
                    "
                    title="Yellow Card"
                  >
                    YC
                  </button>
                  <button
                    onClick={onRedCardClick}
                    className="
                      min-h-[32px] min-w-[32px] rounded
                      bg-red-500 px-2 py-1 text-xs text-white
                      transition-transform hover:bg-red-600
                      active:scale-95 active:bg-red-700
                      sm:px-1 sm:py-0.5
                    "
                    title="Red Card"
                  >
                    RC
                  </button>
                  <button
                    onClick={onFoulCommittedClick}
                    className="
                      min-h-[32px] min-w-[32px] rounded
                      bg-orange-500 px-2 py-1 text-xs text-white
                      transition-transform hover:bg-orange-600
                      active:scale-95 active:bg-orange-700
                      sm:px-1 sm:py-0.5
                    "
                    title="Foul Committed"
                  >
                    FC
                  </button>
                  <button
                    onClick={onShotOnTargetClick}
                    className="
                      min-h-[32px] min-w-[32px] rounded
                      bg-purple-500 px-2 py-1 text-xs text-white
                      transition-transform hover:bg-purple-600
                      active:scale-95 active:bg-purple-700
                      sm:px-1 sm:py-0.5
                    "
                    title="Shot On Target"
                  >
                    SOT
                  </button>
                  <button
                    onClick={onShotOffTargetClick}
                    className="
                      min-h-[32px] min-w-[32px] rounded
                      bg-gray-500 px-2 py-1 text-xs text-white
                      transition-transform hover:bg-gray-600
                      active:scale-95 active:bg-gray-700
                      sm:px-1 sm:py-0.5
                    "
                    title="Shot Off Target"
                  >
                    SOF
                  </button>
                  {position === 'Goalkeeper' && (
                    <button
                      onClick={onSaveClick}
                      className="
                        min-h-[32px] min-w-[32px] rounded
                        bg-teal-500 px-2 py-1 text-xs text-white
                        transition-transform hover:bg-teal-600
                        active:scale-95 active:bg-teal-700
                        sm:px-1 sm:py-0.5
                      "
                      title="Save"
                    >
                      SAV
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

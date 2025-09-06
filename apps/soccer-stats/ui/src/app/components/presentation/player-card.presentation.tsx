import { Player } from '../../types';
import { formatTime } from '../../utils';

/**
 * Dumb Component: Pure presentation of player data
 * Receives all computed data as props - no calculations here
 */

interface PlayerCardPresentationProps {
  player: Player;
  isOnField: boolean;
  goals: number;
  assists: number;
  // Phase 1 stats
  yellowCards?: number;
  redCards?: number;
  foulsCommitted?: number;
  foulsReceived?: number;
  shotsOnTarget?: number;
  shotsOffTarget?: number;
  saves?: number;
  // Phase 1 stat handlers
  onYellowCardClick?: () => void;
  onRedCardClick?: () => void;
  onFoulCommittedClick?: () => void;
  onFoulReceivedClick?: () => void;
  onShotOnTargetClick?: () => void;
  onShotOffTargetClick?: () => void;
  onSaveClick?: () => void;
  showStatButtons?: boolean;
  showPhase1Stats?: boolean;
}

export const PlayerCardPresentation = ({
  player,
  isOnField,
  goals,
  assists,
  // Phase 1 stats
  yellowCards = 0,
  redCards = 0,
  foulsCommitted = 0,
  foulsReceived = 0,
  shotsOnTarget = 0,
  shotsOffTarget = 0,
  saves = 0,
  // Phase 1 stat handlers
  onYellowCardClick,
  onRedCardClick,
  onFoulCommittedClick,
  onFoulReceivedClick,
  onShotOnTargetClick,
  onShotOffTargetClick,
  onSaveClick,
  showStatButtons = false,
  showPhase1Stats = false,
}: PlayerCardPresentationProps) => {
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
    <div className={`${cardClass} rounded-lg p-4`}>
      <div className="flex space-x-4">
        {/* Player Photo - Enhanced for better visibility */}
        <div className="flex-shrink-0">
          {player.photo ? (
            <img
              src={player.photo}
              alt={`${player.name} photo`}
              className="w-20 h-24 rounded-lg object-cover border-2 border-gray-300 shadow-md"
            />
          ) : (
            <div className="w-20 h-24 rounded-lg bg-gray-300 flex flex-col items-center justify-center text-gray-600 border-2 border-gray-400 shadow-md">
              <span className="text-2xl font-bold">#{player.jersey}</span>
              <span className="text-xs mt-1">No Photo</span>
            </div>
          )}
        </div>

        {/* Player Info and Stats */}
        <div className="flex-1 min-w-0">
          {/* Top row: Name, Position, and Play Time */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className={nameClass}>
                <span className="font-bold text-lg">#{player.jersey}</span>{' '}
                {player.name}
              </h4>
              <p className={positionClass}>{player.position}</p>
            </div>
            <div className="text-right">
              <p className={timeClass}>{formatTime(player.playTime)}</p>
            </div>
          </div>

          {/* Bottom row: Stats and Action Buttons */}
          <div className="space-y-2">
            {/* Basic Stats */}
            <div className="flex space-x-4 text-sm">
              <span className="text-gray-600">Goals: {goals}</span>
              <span className="text-gray-600">Assists: {assists}</span>
            </div>

            {/* Phase 1 Stats */}
            {showPhase1Stats && (
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                <span
                  aria-label={`Yellow Cards: ${yellowCards}, Red Cards: ${redCards}`}
                >
                  Cards: {yellowCards}Y {redCards}R
                </span>
                <span
                  aria-label={`Fouls Committed: ${foulsCommitted}, Fouls Received: ${foulsReceived}`}
                >
                  Fouls: {foulsCommitted}C {foulsReceived}R
                </span>
                <span
                  title="Shots On Target (includes goals) / Shots Off Target"
                  aria-label={`Shots On Target: ${shotsOnTarget}, Shots Off Target: ${shotsOffTarget}`}
                >
                  Shots: {shotsOnTarget}ON {shotsOffTarget}OFF
                </span>
                {player.position === 'Goalkeeper' && (
                  <span aria-label={`Saves: ${saves}`}>Saves: {saves}</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {showStatButtons && (
              <div className="space-y-1">
                {/* Phase 1 stat buttons */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={onYellowCardClick}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-1 py-0.5 rounded text-xs"
                    title="Yellow Card"
                  >
                    YC
                  </button>
                  <button
                    onClick={onRedCardClick}
                    className="bg-red-500 hover:bg-red-600 text-white px-1 py-0.5 rounded text-xs"
                    title="Red Card"
                  >
                    RC
                  </button>
                  <button
                    onClick={onFoulCommittedClick}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-1 py-0.5 rounded text-xs"
                    title="Foul Committed"
                  >
                    FC
                  </button>
                  <button
                    onClick={onShotOnTargetClick}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-1 py-0.5 rounded text-xs"
                    title="Shot On Target (goals auto-added)"
                  >
                    SOT
                  </button>
                  <button
                    onClick={onShotOffTargetClick}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-1 py-0.5 rounded text-xs"
                    title="Shot Off Target"
                  >
                    SOF
                  </button>
                  {player.position === 'Goalkeeper' && (
                    <button
                      onClick={onSaveClick}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-1 py-0.5 rounded text-xs"
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

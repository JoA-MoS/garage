import { Player } from '../types';
import { formatTime } from '../utils';

interface PlayerCardProps {
  player: Player;
  isOnField: boolean;
  onStatUpdate?: (playerId: number, stat: 'goals' | 'assists') => void;
}

export const PlayerCard = ({
  player,
  isOnField,
  onStatUpdate,
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
    <div className={`${cardClass} rounded-lg p-4`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className={nameClass}>
            #{player.jersey} {player.name}
          </h4>
          <p className={positionClass}>{player.position}</p>
        </div>
        <div className="text-right">
          <p className={timeClass}>{formatTime(player.playTime)}</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex space-x-4 text-sm">
          <span className="text-gray-600">Goals: {player.goals}</span>
          <span className="text-gray-600">Assists: {player.assists}</span>
        </div>
        {isOnField && onStatUpdate && (
          <div className="flex space-x-2">
            <button
              onClick={() => onStatUpdate(player.id, 'goals')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
            >
              +Goal
            </button>
            <button
              onClick={() => onStatUpdate(player.id, 'assists')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs"
            >
              +Assist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

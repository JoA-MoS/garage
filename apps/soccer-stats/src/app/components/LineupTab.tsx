import { Users } from 'lucide-react';

import { Player } from '../types';

import { PlayerCard } from './PlayerCard';

interface LineupTabProps {
  playersOnField: Player[];
  playersOnBench: Player[];
  onStatUpdate: (playerId: number, stat: 'goals' | 'assists') => void;
}

export const LineupTab = ({
  playersOnField,
  playersOnBench,
  onStatUpdate,
}: LineupTabProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-green-600" />
          On Field ({playersOnField.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playersOnField.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isOnField={true}
              onStatUpdate={onStatUpdate}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-gray-600" />
          On Bench ({playersOnBench.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playersOnBench.map((player) => (
            <PlayerCard key={player.id} player={player} isOnField={false} />
          ))}
        </div>
      </div>
    </div>
  );
};

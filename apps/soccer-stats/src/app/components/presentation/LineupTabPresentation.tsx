import { Users } from 'lucide-react';

import { Player, Team } from '../../types';
import { PlayerCard } from '../PlayerCard';

interface LineupTabPresentationProps {
  playersOnField: Player[];
  playersOnBench: Player[];
  team: Team;
  onStatUpdate: (playerId: number, stat: 'goals' | 'assists') => void;
}

export const LineupTabPresentation = ({
  playersOnField,
  playersOnBench,
  team,
  onStatUpdate,
}: LineupTabPresentationProps) => {
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
              team={team}
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
            <PlayerCard
              key={player.id}
              player={player}
              team={team}
              isOnField={false}
              onStatUpdate={onStatUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

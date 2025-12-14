import { Users } from 'lucide-react';

import { Player, Team } from '../../types';
import { PlayerCardSmart } from '../smart/player-card.smart';

interface LineupTabPresentationProps {
  playersOnField: Player[];
  playersOnBench: Player[];
  team: Team;
  onStatUpdate: (
    playerId: number,
    stat:
      | 'yellow_card'
      | 'red_card'
      | 'foul_committed'
      | 'foul_received'
      | 'shot_on_target'
      | 'shot_off_target'
      | 'save'
  ) => void;
  showPhase1Stats?: boolean;
}

export const LineupTabPresentation = ({
  playersOnField,
  playersOnBench,
  team,
  onStatUpdate,
  showPhase1Stats = false,
}: LineupTabPresentationProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 flex items-center text-lg font-semibold">
          <Users className="mr-2 h-5 w-5 text-green-600" />
          On Field ({playersOnField.length})
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {playersOnField.map((player) => (
            <PlayerCardSmart
              key={player.id}
              playerRef={{ __typename: 'Player', id: String(player.id) }} // TODO: Fix when migrating to new architecture
              // TODO: Fix type mismatch when migrating to new architecture
              // onStatUpdate={onStatUpdate}
              showPhase1Stats={showPhase1Stats}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 flex items-center text-lg font-semibold">
          <Users className="mr-2 h-5 w-5 text-gray-600" />
          On Bench ({playersOnBench.length})
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {playersOnBench.map((player) => (
            <PlayerCardSmart
              key={player.id}
              playerRef={{ __typename: 'Player', id: String(player.id) }} // TODO: Fix when migrating to new architecture
              // TODO: Fix type mismatch when migrating to new architecture
              // onStatUpdate={onStatUpdate}
              showPhase1Stats={showPhase1Stats}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

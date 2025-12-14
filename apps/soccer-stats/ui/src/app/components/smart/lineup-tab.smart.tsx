import { Team, Player } from '../../types';
import { LineupTabPresentation } from '../presentation/lineup-tab.presentation';

interface LineupTabSmartProps {
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

/**
 * Smart component that filters players and manages lineup data
 */
export const LineupTabSmart = ({
  team,
  onStatUpdate,
  showPhase1Stats = false,
}: LineupTabSmartProps) => {
  // Filter players by status (in the future this logic might be more complex)
  const playersOnField = team.players.filter((p) => p.isOnField);
  const playersOnBench = team.players.filter((p) => !p.isOnField);

  return (
    <LineupTabPresentation
      playersOnField={playersOnField}
      playersOnBench={playersOnBench}
      team={team}
      onStatUpdate={onStatUpdate}
      showPhase1Stats={showPhase1Stats}
    />
  );
};

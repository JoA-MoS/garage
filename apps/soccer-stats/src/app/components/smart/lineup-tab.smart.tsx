import { Team, Player } from '../../types';
import { LineupTabPresentation } from '../presentation/lineup-tab.presentation';

interface LineupTabSmartProps {
  team: Team;
  onStatUpdate: (playerId: number, stat: 'goals' | 'assists') => void;
}

/**
 * Smart component that filters players and manages lineup data
 */
export const LineupTabSmart = ({ team, onStatUpdate }: LineupTabSmartProps) => {
  // Filter players by status (in the future this logic might be more complex)
  const playersOnField = team.players.filter((p) => p.isOnField);
  const playersOnBench = team.players.filter((p) => !p.isOnField);

  return (
    <LineupTabPresentation
      playersOnField={playersOnField}
      playersOnBench={playersOnBench}
      team={team}
      onStatUpdate={onStatUpdate}
    />
  );
};

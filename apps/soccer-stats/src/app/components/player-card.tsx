import { Player, Team } from '../types';
import { GameStatsService } from '../services/game-stats.service';

import { PlayerCardPresentation } from './presentation/player-card.presentation';

/**
 * Smart Component: Handles data fetching and state management
 * Computes stats and passes them to the dumb presentation component
 */

interface PlayerCardProps {
  player: Player;
  team: Team;
  isOnField: boolean;
  onStatUpdate?: (playerId: number, stat: 'goals' | 'assists') => void;
}

export const PlayerCard = ({
  player,
  team,
  isOnField,
  onStatUpdate,
}: PlayerCardProps) => {
  // Compute stats using the service (will eventually come from API/database)
  const goals = GameStatsService.getPlayerGoals(player.id, team);
  const assists = GameStatsService.getPlayerAssists(player.id, team);

  const handleGoalClick = () => {
    onStatUpdate?.(player.id, 'goals');
  };

  const handleAssistClick = () => {
    onStatUpdate?.(player.id, 'assists');
  };

  return (
    <PlayerCardPresentation
      player={player}
      isOnField={isOnField}
      goals={goals}
      assists={assists}
      onGoalClick={handleGoalClick}
      onAssistClick={handleAssistClick}
      showStatButtons={isOnField && !!onStatUpdate}
    />
  );
};

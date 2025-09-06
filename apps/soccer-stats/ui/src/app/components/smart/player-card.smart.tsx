import { Player, Team } from '../../types';
import { GameStatsService } from '../../services/game-stats.service';
import { PlayerCardPresentation } from '../presentation/player-card.presentation';

/**
 * Smart Component: Handles data fetching and state management
 * Computes stats and passes them to the dumb presentation component
 */

interface PlayerCardSmartProps {
  player: Player;
  team: Team;
  isOnField: boolean;
  onStatUpdate?: (
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

export const PlayerCardSmart = ({
  player,
  team,
  isOnField,
  onStatUpdate,
  showPhase1Stats = false,
}: PlayerCardSmartProps) => {
  // Compute basic stats using the service
  const goals = GameStatsService.getPlayerGoals(player.id, team);
  const assists = GameStatsService.getPlayerAssists(player.id, team);

  // Compute Phase 1 stats
  const yellowCards = GameStatsService.getPlayerYellowCards(player.id, team);
  const redCards = GameStatsService.getPlayerRedCards(player.id, team);
  const foulsCommitted = GameStatsService.getPlayerFoulsCommitted(
    player.id,
    team
  );
  const foulsReceived = GameStatsService.getPlayerFoulsReceived(
    player.id,
    team
  );
  const shotsOnTarget = GameStatsService.getPlayerShotsOnTarget(
    player.id,
    team
  );
  const shotsOffTarget = GameStatsService.getPlayerShotsOffTarget(
    player.id,
    team
  );
  const saves = GameStatsService.getPlayerSaves(player.id, team);

  // Event handlers
  const handleYellowCardClick = () => {
    onStatUpdate?.(player.id, 'yellow_card');
  };

  const handleRedCardClick = () => {
    onStatUpdate?.(player.id, 'red_card');
  };

  const handleFoulCommittedClick = () => {
    onStatUpdate?.(player.id, 'foul_committed');
  };

  const handleFoulReceivedClick = () => {
    onStatUpdate?.(player.id, 'foul_received');
  };

  const handleShotOnTargetClick = () => {
    onStatUpdate?.(player.id, 'shot_on_target');
  };

  const handleShotOffTargetClick = () => {
    onStatUpdate?.(player.id, 'shot_off_target');
  };

  const handleSaveClick = () => {
    onStatUpdate?.(player.id, 'save');
  };

  return (
    <PlayerCardPresentation
      player={player}
      isOnField={isOnField}
      goals={goals}
      assists={assists}
      // Phase 1 stats
      yellowCards={yellowCards}
      redCards={redCards}
      foulsCommitted={foulsCommitted}
      foulsReceived={foulsReceived}
      shotsOnTarget={shotsOnTarget}
      shotsOffTarget={shotsOffTarget}
      saves={saves}
      // Phase 1 stat handlers
      onYellowCardClick={handleYellowCardClick}
      onRedCardClick={handleRedCardClick}
      onFoulCommittedClick={handleFoulCommittedClick}
      onFoulReceivedClick={handleFoulReceivedClick}
      onShotOnTargetClick={handleShotOnTargetClick}
      onShotOffTargetClick={handleShotOffTargetClick}
      onSaveClick={handleSaveClick}
      showStatButtons={isOnField && !!onStatUpdate}
      showPhase1Stats={showPhase1Stats}
    />
  );
};

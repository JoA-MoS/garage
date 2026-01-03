import { GameHeader } from '@garage/soccer-stats/ui-components';

import { GameStatsService } from '../../services/game-stats.service';
import { Team } from '../../types';

interface GameHeaderSmartProps {
  homeTeam: Team;
  awayTeam: Team;
  homeTeamName: string;
  awayTeamName: string;
  gameTime: number;
  isGameRunning: boolean;
  onToggleGame: () => void;
  onGoalClick: (team: 'home' | 'away') => void;
  onResetGame: () => void;
  onSaveAndNewGame?: () => Promise<string | null>;
}

/**
 * Smart component that calculates scores and passes data to presentation component
 */
export const GameHeaderSmart = ({
  homeTeam,
  awayTeam,
  homeTeamName,
  awayTeamName,
  gameTime,
  isGameRunning,
  onToggleGame,
  onGoalClick,
  onResetGame,
  onSaveAndNewGame,
}: GameHeaderSmartProps) => {
  // Calculate scores using the service (in the future this will come from API)
  const homeScore = GameStatsService.getTeamScore(homeTeam);
  const awayScore = GameStatsService.getTeamScore(awayTeam);

  const handleSaveAndNewGame = async () => {
    if (onSaveAndNewGame) {
      try {
        await onSaveAndNewGame();
        // Could show a success message here
      } catch (error) {
        console.error('Failed to save game:', error);
        // Could show an error message here
      }
    }
  };

  return (
    <GameHeader
      homeTeamName={homeTeamName}
      awayTeamName={awayTeamName}
      homeScore={homeScore}
      awayScore={awayScore}
      gameTime={gameTime}
      isGameRunning={isGameRunning}
      onToggleGame={onToggleGame}
      onGoalClick={onGoalClick}
      onResetGame={onResetGame}
      onSaveAndNewGame={onSaveAndNewGame ? handleSaveAndNewGame : undefined}
    />
  );
};

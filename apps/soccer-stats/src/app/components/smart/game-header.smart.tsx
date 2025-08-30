import { GameStatsService } from '../../services/game-stats.service';
import { Team } from '../../types';
import { GameHeaderPresentation } from '../presentation/game-header.presentation';

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
}: GameHeaderSmartProps) => {
  // Calculate scores using the service (in the future this will come from API)
  const homeScore = GameStatsService.getTeamScore(homeTeam);
  const awayScore = GameStatsService.getTeamScore(awayTeam);

  return (
    <GameHeaderPresentation
      homeTeamName={homeTeamName}
      awayTeamName={awayTeamName}
      homeScore={homeScore}
      awayScore={awayScore}
      gameTime={gameTime}
      isGameRunning={isGameRunning}
      onToggleGame={onToggleGame}
      onGoalClick={onGoalClick}
      onResetGame={onResetGame}
    />
  );
};

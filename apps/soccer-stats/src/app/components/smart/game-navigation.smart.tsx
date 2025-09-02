import { useLocation } from 'react-router-dom';

import { GameNavigationPresentation } from '../presentation/game-navigation.presentation';

interface GameNavigationSmartProps {
  homeTeamName: string;
  awayTeamName: string;
}

/**
 * Smart component for game-specific navigation
 */
export const GameNavigationSmart = ({
  homeTeamName,
  awayTeamName,
}: GameNavigationSmartProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <GameNavigationPresentation
      homeTeamName={homeTeamName}
      awayTeamName={awayTeamName}
      currentPath={currentPath}
    />
  );
};

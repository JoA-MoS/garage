import { useNavigate } from 'react-router';

import { GameSetupWizardSmart } from '../components/smart/game-setup-wizard.smart';

/**
 * New game setup page - MVP wizard for simplified game creation
 * Uses GraphQL operations for managed/unmanaged team support
 */
export const NewGamePage = () => {
  const navigate = useNavigate();

  const handleGameComplete = (gameId: string) => {
    // Navigate to the game page with the created game ID
    navigate(`/game/${gameId}`);
  };

  return <GameSetupWizardSmart onComplete={handleGameComplete} />;
};

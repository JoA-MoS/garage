import { createContext, useContext, ReactNode } from 'react';

import { useGameManager } from '../components/smart/game-manager.smart';

interface GameContextType {
  gameData: ReturnType<typeof useGameManager>['gameData'];
  gameActions: ReturnType<typeof useGameManager>['gameActions'];
  derivedData: ReturnType<typeof useGameManager>['derivedData'];
  defaultGameConfig: ReturnType<typeof useGameManager>['defaultGameConfig'];
}

const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

/**
 * Game context provider to share game state across routes
 */
export const GameProvider = ({ children }: GameProviderProps) => {
  const gameManager = useGameManager();

  return (
    <GameContext.Provider value={gameManager}>{children}</GameContext.Provider>
  );
};

/**
 * Hook to use game context
 */
export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

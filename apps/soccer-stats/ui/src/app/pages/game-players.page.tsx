import { GamePlayersComposition } from '../components/composition/game-players.composition';

/**
 * Example Page using the three-layer fragment architecture
 *
 * This demonstrates how clean and simple page components become
 * when using the fragment architecture:
 *
 * Layer 1: PlayerCardPresentation - Pure UI component
 * Layer 2: PlayerCardSmart - Fragment wrapper with data mapping
 * Layer 3: GamePlayersComposition - Query orchestration and business logic
 */

interface GamePlayersPageProps {
  gameId: string;
}

export const GamePlayersPage = ({ gameId }: GamePlayersPageProps) => {
  return (
    <div
      className="
      min-h-screen bg-gray-50 px-4 py-4
      sm:px-6 sm:py-6
      lg:px-8 lg:py-8
    "
    >
      <div
        className="
        mx-auto max-w-7xl
      "
      >
        <GamePlayersComposition
          gameId={gameId}
          showStatButtons={true}
          showPhase1Stats={true}
          title="Game Players"
        />
      </div>
    </div>
  );
};

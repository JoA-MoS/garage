import { useState, useEffect } from 'react';

import { PlayerCardSmart } from '../smart/player-card.smart';

/**
 * Layer 3: Composition/Query Component
 * - Demonstrates the three-layer fragment architecture pattern
 * - Currently simplified for demo purposes until actual schema is available
 * - Shows how fragments would work with real GraphQL queries
 * - Mobile-first responsive layout
 */

// For now, let's create a simple working example that demonstrates the pattern
// This would be replaced with actual GraphQL queries once the schema is available

interface MockPlayer {
  id: string;
  name: string;
  jersey: number;
  position: string;
  photo?: string;
  playTime: number;
  isOnField: boolean;
  gameStats: {
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    foulsCommitted: number;
    foulsReceived: number;
    shotsOnTarget: number;
    shotsOffTarget: number;
    saves: number;
  };
}

// Mock data for demonstration - would be replaced with actual GraphQL query results
const mockGamePlayers: MockPlayer[] = [
  {
    id: '1',
    name: 'John Doe',
    jersey: 10,
    position: 'Forward',
    playTime: 90,
    isOnField: true,
    gameStats: {
      goals: 2,
      assists: 1,
      yellowCards: 0,
      redCards: 0,
      foulsCommitted: 1,
      foulsReceived: 3,
      shotsOnTarget: 4,
      shotsOffTarget: 2,
      saves: 0,
    },
  },
  {
    id: '2',
    name: 'Jane Smith',
    jersey: 1,
    position: 'Goalkeeper',
    playTime: 90,
    isOnField: true,
    gameStats: {
      goals: 0,
      assists: 0,
      yellowCards: 1,
      redCards: 0,
      foulsCommitted: 0,
      foulsReceived: 1,
      shotsOnTarget: 0,
      shotsOffTarget: 0,
      saves: 5,
    },
  },
];

interface GamePlayersCompositionProps {
  gameId: string;
  showStatButtons?: boolean;
  showPhase1Stats?: boolean;
  title?: string;
}

export const GamePlayersComposition = ({
  gameId,
  showStatButtons = false,
  showPhase1Stats = true,
  title = 'Game Players',
}: GamePlayersCompositionProps) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<MockPlayer[]>([]);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Mock data loading effect - would be replaced with actual GraphQL query
  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPlayers(mockGamePlayers);
      setLoading(false);
    };

    loadPlayers();
  }, [gameId]);

  // Mock stat update handler - would be replaced with actual GraphQL mutation
  const handleStatUpdate = async (playerId: string, statType: string) => {
    setUpdateLoading(true);

    // Simulate mutation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update local state to show immediate feedback
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.id === playerId) {
          const updatedStats = { ...player.gameStats };
          switch (statType) {
            case 'yellowCard':
              updatedStats.yellowCards += 1;
              break;
            case 'redCard':
              updatedStats.redCards += 1;
              break;
            case 'foulCommitted':
              updatedStats.foulsCommitted += 1;
              break;
            case 'foulReceived':
              updatedStats.foulsReceived += 1;
              break;
            case 'shotOnTarget':
              updatedStats.shotsOnTarget += 1;
              break;
            case 'shotOffTarget':
              updatedStats.shotsOffTarget += 1;
              break;
            case 'save':
              updatedStats.saves += 1;
              break;
          }
          return { ...player, gameStats: updatedStats };
        }
        return player;
      })
    );

    setUpdateLoading(false);
  };

  // Loading state for the entire composition
  if (loading) {
    return (
      <div className="space-y-4">
        <div
          className="
          h-8 w-32 animate-pulse rounded
          bg-gray-200 sm:w-40
        "
        />
        <div
          className="
          grid grid-cols-1 gap-3
          sm:gap-4
          md:grid-cols-2 
          lg:grid-cols-3
          xl:grid-cols-4
        "
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="
                h-32 animate-pulse rounded-lg bg-gray-200
                sm:h-36
              "
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile-first responsive */}
      <div
        className="
        flex flex-col space-y-2
        sm:flex-row sm:items-center sm:justify-between sm:space-y-0
      "
      >
        <h2
          className="
          text-xl font-bold text-gray-900
          sm:text-2xl
        "
        >
          {title} ({players.length})
        </h2>
        <div
          className="
          text-sm text-gray-600
          sm:text-base
        "
        >
          Game ID: {gameId}
        </div>
      </div>

      {/* Players grid - Mobile-first responsive layout */}
      {players.length > 0 ? (
        <div
          className="
          grid grid-cols-1 gap-3
          sm:gap-4
          md:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
        "
        >
          {players.map((player) => (
            <PlayerCardSmart
              key={player.id}
              playerRef={{
                __typename: 'Player',
                id: player.id,
              }}
              onStatUpdate={handleStatUpdate}
              showStatButtons={showStatButtons && !updateLoading}
              showPhase1Stats={showPhase1Stats}
            />
          ))}
        </div>
      ) : (
        <div
          className="
          py-8 text-center text-sm
          text-gray-500 sm:text-base
        "
        >
          No players found for this game
        </div>
      )}

      {/* Loading overlay for stat updates */}
      {updateLoading && (
        <div
          className="
          fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20
          sm:bg-opacity-10
        "
        >
          <div
            className="
            flex items-center space-x-3 rounded-lg bg-white p-4 text-sm
            shadow-lg sm:text-base
          "
          >
            <div
              className="
              h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600
              sm:h-6 sm:w-6
            "
            />
            <span>Updating stats...</span>
          </div>
        </div>
      )}
    </div>
  );
};

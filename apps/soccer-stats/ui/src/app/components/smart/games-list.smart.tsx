import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { GamesListPresentation } from '../presentation/games-list.presentation';

/**
 * Layer 2: Smart Component (Fragment Wrapper) - Temporary without generated GraphQL
 * - Uses existing GraphQL service temporarily during migration
 * - Maps data to individual presentation props
 * - Handles business logic for data transformation
 * - Manages user interactions and navigation
 * TODO: Replace with proper Three-Layer Fragment Architecture once GraphQL codegen is set up
 */

interface GamesListSmartProps {
  games: any[]; // TODO: Replace with proper FragmentType once GraphQL codegen is set up
  loading?: boolean;
  error?: string;
}

export const GamesListSmart = ({
  games: gameData,
  loading,
  error,
}: GamesListSmartProps) => {
  const navigate = useNavigate();

  // Transform data to presentation props - temporary implementation
  const games = gameData.map((game: any) => {
    // Business logic: Extract team information
    const homeTeam = game.gameTeams?.find((gt: any) => gt.teamType === 'HOME')
      ?.team || { id: '', name: 'TBD' };
    const awayTeam = game.gameTeams?.find((gt: any) => gt.teamType === 'AWAY')
      ?.team || { id: '', name: 'TBD' };

    // Business logic: Extract scores
    const homeScore = game.gameTeams?.find(
      (gt: any) => gt.teamType === 'HOME'
    )?.finalScore;
    const awayScore = game.gameTeams?.find(
      (gt: any) => gt.teamType === 'AWAY'
    )?.finalScore;

    return {
      id: game.id,
      name: game.name,
      scheduledStart: game.scheduledStart,
      venue: game.venue || undefined,
      status: (game.status || 'SCHEDULED') as
        | 'SCHEDULED'
        | 'IN_PROGRESS'
        | 'COMPLETED'
        | 'CANCELLED',
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
      },
      homeScore,
      awayScore,
      gameFormatName: game.gameFormat?.name,
    };
  });

  // Business logic: Handle game navigation
  const handleGameClick = useCallback(
    (gameId: string) => {
      navigate(`/games/${gameId}`);
    },
    [navigate]
  );

  return (
    <GamesListPresentation
      games={games}
      loading={loading}
      error={error}
      onGameClick={handleGameClick}
    />
  );
};

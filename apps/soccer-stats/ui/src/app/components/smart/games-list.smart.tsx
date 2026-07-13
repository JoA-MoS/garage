import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { GamesList } from '@garage/soccer-stats/ui-components';

import { findGameTeam, getTeamDisplayName } from '../../utils/game-team-display';

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
    const homeGameTeam = findGameTeam(game.teams, 'home');
    const awayGameTeam = findGameTeam(game.teams, 'away');
    const homeTeam = homeGameTeam?.team || { id: '', name: 'Unassigned' };
    const awayTeam = awayGameTeam?.team || { id: '', name: 'Unassigned' };

    // Business logic: Extract scores
    const homeScore = homeGameTeam?.finalScore ?? undefined;
    const awayScore = awayGameTeam?.finalScore ?? undefined;

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
        id: homeTeam.id ?? '',
        name: getTeamDisplayName(homeGameTeam),
      },
      awayTeam: {
        id: awayTeam.id ?? '',
        name: getTeamDisplayName(awayGameTeam),
      },
      homeScore,
      awayScore,
      gameFormatName: game.format?.name,
    };
  });

  // Business logic: Handle game navigation
  const handleGameClick = useCallback(
    (gameId: string) => {
      navigate(`/games/${gameId}`);
    },
    [navigate],
  );

  return (
    <GamesList
      games={games}
      loading={loading}
      error={error}
      onGameClick={handleGameClick}
    />
  );
};

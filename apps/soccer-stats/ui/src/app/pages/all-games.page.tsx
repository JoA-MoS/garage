import { GamesListComposition } from '../components/composition/games-list.composition';

/**
 * All Games Page
 * - Simple page wrapper that uses the Three-Layer Fragment Architecture
 * - Delegates all functionality to the composition layer
 * - Follows established pattern from team-stats.page.tsx
 */

export const AllGamesPage = () => {
  return <GamesListComposition />;
};

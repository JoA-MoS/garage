import { useCallback } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client/react';

import { graphql } from '@garage/soccer-stats/graphql-codegen';

// Fragments imported from colocated smart components (Strict Pattern).
// Note: Fragments are imported to ensure they're registered with graphql-codegen.
// The eslint-disable is needed because fragments are referenced by name in queries.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GameCardFragment, type GameCardData } from '../smart/game-card.smart';
import {
  GameFormatSelectFragment,
  type GameFormatSelectData,
} from '../smart/game-format-select.smart';
import {
  OpponentTeamFragment,
  type OpponentTeamData,
} from '../smart/opponent-select.smart';
import { TeamGamesSmart } from '../smart/team-games.smart';

// Re-export types for consumers who need them
export type { GameCardData, OpponentTeamData, GameFormatSelectData };

// =============================================================================
// QUERIES - Compose fragments into queries
// =============================================================================

/**
 * Main query for the team games page.
 * Fetches team info and all games for this team in a single request.
 * Spreads fragments imported from smart components.
 */
const TeamGamesPageQuery = graphql(/* GraphQL */ `
  query TeamGamesPage($teamId: ID!) {
    team(id: $teamId) {
      id
      name
      shortName
      games {
        ...GameCard
      }
    }
  }
`);

/**
 * Query for create game modal data.
 * Only fetched when the modal is opened (lazy-loaded).
 * Spreads fragments imported from smart components.
 */
const CreateGameModalQuery = graphql(/* GraphQL */ `
  query CreateGameModal {
    teams {
      ...OpponentTeam
    }
    gameFormats {
      ...GameFormatSelect
    }
  }
`);

// =============================================================================
// TYPES
// =============================================================================

interface TeamGamesCompositionProps {
  teamId: string;
}

// =============================================================================
// COMPOSITION COMPONENT
// =============================================================================

/**
 * Composition component for the Team Games page.
 *
 * Responsibilities:
 * - Owns queries that compose fragments from smart components
 * - Handles loading/error states
 * - Passes fragment data to smart component
 *
 * Note: This follows the "strict" three-layer pattern where:
 * - Layer 1 (Presentation): Pure UI, no GraphQL awareness
 * - Layer 2 (Smart): Owns fragments and transforms data
 * - Layer 3 (Composition): Owns queries, composes fragments, handles data fetching
 */
export const TeamGamesComposition = ({ teamId }: TeamGamesCompositionProps) => {
  // Main query - fetches team and its games in a single request
  const {
    data: pageData,
    loading: pageLoading,
    error: pageError,
    refetch: refetchGames,
  } = useQuery(TeamGamesPageQuery, {
    variables: { teamId },
    fetchPolicy: 'cache-and-network',
  });

  // Modal query - lazy-loaded only when user clicks "Create Game"
  const [
    loadModalData,
    {
      data: modalData,
      loading: modalLoading,
      error: modalError,
      called: modalCalled,
    },
  ] = useLazyQuery(CreateGameModalQuery, {
    fetchPolicy: 'cache-first',
  });

  // Handler to load modal data when needed
  const handleOpenModal = useCallback(() => {
    if (!modalCalled) {
      loadModalData();
    }
  }, [modalCalled, loadModalData]);

  // Error state
  if (pageError) {
    return (
      <div className="p-4">
        <div className="text-red-600">
          Error loading games: {pageError.message}
        </div>
      </div>
    );
  }

  // Extract data for smart component
  const gameTeams = pageData?.team?.games ?? [];
  const opponents = modalData?.teams ?? [];
  const gameFormats = modalData?.gameFormats ?? [];

  return (
    <TeamGamesSmart
      teamId={teamId}
      gameTeams={gameTeams}
      opponents={opponents}
      gameFormats={gameFormats}
      loading={pageLoading}
      modalLoading={modalLoading}
      modalError={modalError?.message}
      onOpenModal={handleOpenModal}
      onGameCreated={refetchGames}
    />
  );
};

// =============================================================================
// STRICT PATTERN DOCUMENTATION
// =============================================================================

/**
 * This file demonstrates the "strict" three-layer fragment colocation pattern:
 *
 * LAYER RESPONSIBILITIES:
 *
 * 1. Presentation Components (team-games.presentation.tsx)
 *    - Pure UI rendering with plain TypeScript interfaces
 *    - No GraphQL imports or awareness
 *    - Receives fully transformed data as props
 *
 * 2. Smart Components (game-card.smart.tsx, opponent-select.smart.tsx, etc.)
 *    - OWN and EXPORT their GraphQL fragments
 *    - Provide hooks (useGameCardsData, useOpponentsData) that:
 *      - Accept FragmentType<T> (masked fragment data)
 *      - Use useFragment() to unmask the data
 *      - Transform to presentation-friendly format
 *    - Export types for both fragment input and presentation output
 *
 * 3. Composition Components (this file)
 *    - IMPORT fragments from smart components
 *    - Compose fragments into queries
 *    - Handle data fetching (useQuery, useLazyQuery)
 *    - Manage loading/error states
 *    - Pass masked fragment data to smart components
 *
 * DATA FLOW:
 *
 *   Query (Composition) → Fragment Data (Smart) → Plain Props (Presentation)
 *
 * BENEFITS:
 *
 * - Fragment definitions live with the component that uses them
 * - Clear ownership: each smart component owns its data requirements
 * - Composition components remain focused on query orchestration
 * - Presentation components stay pure and testable
 * - Type safety enforced through FragmentType masking
 */

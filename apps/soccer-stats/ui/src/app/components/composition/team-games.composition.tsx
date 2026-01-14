import { useCallback } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client/react';

import { graphql, FragmentType } from '@garage/soccer-stats/graphql-codegen';

import { TeamGamesSmart } from '../smart/team-games.smart';

// =============================================================================
// FRAGMENTS - Define data requirements for child components
// =============================================================================

/**
 * Fragment for displaying a game card in the list.
 * Used by TeamGamesSmart to render game information.
 */
export const GameCardFragment = graphql(/* GraphQL */ `
  fragment GameCard on GameTeam {
    id
    teamType
    finalScore
    game {
      id
      name
      status
      scheduledStart
      venue
      createdAt
      gameFormat {
        id
        name
        playersPerTeam
        durationMinutes
      }
      gameTeams {
        id
        teamType
        finalScore
        team {
          id
          name
          shortName
          homePrimaryColor
          homeSecondaryColor
        }
      }
    }
  }
`);

/**
 * Fragment for opponent team selection in create game modal.
 * Minimal fields needed for the dropdown.
 */
export const OpponentTeamFragment = graphql(/* GraphQL */ `
  fragment OpponentTeam on Team {
    id
    name
    shortName
  }
`);

/**
 * Fragment for game format selection in create game modal.
 */
export const GameFormatSelectFragment = graphql(/* GraphQL */ `
  fragment GameFormatSelect on GameFormat {
    id
    name
    playersPerTeam
    durationMinutes
  }
`);

// =============================================================================
// QUERIES - Compose fragments into queries
// =============================================================================

/**
 * Main query for the team games page.
 * Fetches team info and all games for this team in a single request.
 */
const TeamGamesPageQuery = graphql(/* GraphQL */ `
  query TeamGamesPage($teamId: ID!) {
    team(id: $teamId) {
      id
      name
      shortName
      gameTeams {
        ...GameCard
      }
    }
  }
`);

/**
 * Query for create game modal data.
 * Only fetched when the modal is opened (lazy-loaded).
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

export type GameCardData = FragmentType<typeof GameCardFragment>;
export type OpponentTeamData = FragmentType<typeof OpponentTeamFragment>;
export type GameFormatSelectData = FragmentType<
  typeof GameFormatSelectFragment
>;

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
 * - Owns the main query (team + games) - fetched on mount
 * - Owns the modal query (teams + formats) - lazy-loaded when modal opens
 * - Handles loading/error states
 * - Passes fragment data to smart component
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
  const gameTeams = pageData?.team?.gameTeams ?? [];
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

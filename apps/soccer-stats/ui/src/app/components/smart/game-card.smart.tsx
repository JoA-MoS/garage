import { useMemo } from 'react';

import {
  graphql,
  FragmentType,
  useFragment,
} from '@garage/soccer-stats/graphql-codegen';

// =============================================================================
// FRAGMENT - Colocated with this smart component
// =============================================================================

/**
 * Fragment defining the data requirements for a game card.
 * Exported so composition components can spread it into their queries.
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

// =============================================================================
// TYPES
// =============================================================================

export type GameCardData = FragmentType<typeof GameCardFragment>;

/** Transformed game info for presentation layer */
export interface GameCardInfo {
  id: string;
  name?: string | null;
  status: string;
  scheduledStart?: string | null;
  venue?: string | null;
  createdAt: string;
  gameFormat: {
    id: string;
    name: string;
    playersPerTeam: number;
    durationMinutes: number;
  };
  gameTeams: readonly {
    id: string;
    teamType: string;
    finalScore?: number | null;
    team: {
      id: string;
      name: string;
      shortName?: string | null;
      homePrimaryColor?: string | null;
      homeSecondaryColor?: string | null;
    };
  }[];
  /** Which side the current team is on */
  currentTeamType: string;
  currentTeamScore?: number | null;
}

// =============================================================================
// HOOK - Transform fragment data to presentation format
// =============================================================================

/**
 * Hook to transform GameCard fragment data into presentation-ready format.
 * Uses useFragment to properly unmask the fragment data.
 */
export function useGameCardData(gameTeamFragment: GameCardData): GameCardInfo {
  const gameTeam = useFragment(GameCardFragment, gameTeamFragment);

  return useMemo(
    () => ({
      id: gameTeam.game.id,
      name: gameTeam.game.name,
      status: gameTeam.game.status,
      scheduledStart: gameTeam.game.scheduledStart,
      venue: gameTeam.game.venue,
      createdAt: gameTeam.game.createdAt,
      gameFormat: gameTeam.game.gameFormat,
      gameTeams: gameTeam.game.gameTeams ?? [],
      currentTeamType: gameTeam.teamType,
      currentTeamScore: gameTeam.finalScore,
    }),
    [gameTeam],
  );
}

/**
 * Hook to transform multiple GameCard fragments.
 * Convenience wrapper for lists of game cards.
 */
export function useGameCardsData(
  gameTeamFragments: readonly GameCardData[],
): GameCardInfo[] {
  const gameTeams = useFragment(GameCardFragment, gameTeamFragments);

  return useMemo(
    () =>
      gameTeams.map((gameTeam) => ({
        id: gameTeam.game.id,
        name: gameTeam.game.name,
        status: gameTeam.game.status,
        scheduledStart: gameTeam.game.scheduledStart,
        venue: gameTeam.game.venue,
        createdAt: gameTeam.game.createdAt,
        gameFormat: gameTeam.game.gameFormat,
        gameTeams: gameTeam.game.gameTeams ?? [],
        currentTeamType: gameTeam.teamType,
        currentTeamScore: gameTeam.finalScore,
      })),
    [gameTeams],
  );
}

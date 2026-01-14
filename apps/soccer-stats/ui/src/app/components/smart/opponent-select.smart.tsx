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
 * Fragment defining the data requirements for opponent team selection.
 * Minimal fields needed for dropdown display.
 * Exported so composition components can spread it into their queries.
 */
export const OpponentTeamFragment = graphql(/* GraphQL */ `
  fragment OpponentTeam on Team {
    id
    name
    shortName
  }
`);

// =============================================================================
// TYPES
// =============================================================================

export type OpponentTeamData = FragmentType<typeof OpponentTeamFragment>;

/** Transformed opponent info for presentation layer */
export interface OpponentInfo {
  id: string;
  name: string;
  shortName?: string | null;
}

// =============================================================================
// HOOK - Transform fragment data to presentation format
// =============================================================================

/**
 * Hook to transform OpponentTeam fragment data into presentation-ready format.
 * Uses useFragment to properly unmask the fragment data.
 * Filters out the current team from the list.
 */
export function useOpponentsData(
  opponentFragments: readonly OpponentTeamData[],
  currentTeamId: string,
): OpponentInfo[] {
  const opponents = useFragment(OpponentTeamFragment, opponentFragments);

  return useMemo(
    () =>
      opponents
        .map((team) => ({
          id: team.id,
          name: team.name,
          shortName: team.shortName,
        }))
        .filter((team) => team.id !== currentTeamId),
    [opponents, currentTeamId],
  );
}

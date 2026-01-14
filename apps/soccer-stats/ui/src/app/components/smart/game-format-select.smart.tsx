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
 * Fragment defining the data requirements for game format selection.
 * Exported so composition components can spread it into their queries.
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
// TYPES
// =============================================================================

export type GameFormatSelectData = FragmentType<
  typeof GameFormatSelectFragment
>;

/** Transformed game format info for presentation layer */
export interface GameFormatInfo {
  id: string;
  name: string;
  playersPerTeam: number;
  durationMinutes: number;
}

// =============================================================================
// HOOK - Transform fragment data to presentation format
// =============================================================================

/**
 * Hook to transform GameFormatSelect fragment data into presentation-ready format.
 * Uses useFragment to properly unmask the fragment data.
 */
export function useGameFormatsData(
  gameFormatFragments: readonly GameFormatSelectData[],
): GameFormatInfo[] {
  const formats = useFragment(GameFormatSelectFragment, gameFormatFragments);

  return useMemo(
    () =>
      formats.map((format) => ({
        id: format.id,
        name: format.name,
        playersPerTeam: format.playersPerTeam,
        durationMinutes: format.durationMinutes,
      })),
    [formats],
  );
}

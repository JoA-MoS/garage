import { PlayerCard } from '@garage/soccer-stats/ui-components';

import { graphql } from '../../generated/gql';

/**
 * Layer 2: Fragment Smart Wrapper
 * - Collocated GraphQL fragment
 * - Data mapping between GraphQL and presentation component
 * - Uses useFragment hook for reactive data updates
 * - Handles loading states for fragment data
 */

export const PLAYER_CARD_FRAGMENT = graphql(`
  fragment PlayerCardData on User {
    id
    firstName
    lastName
    email
    phone
    dateOfBirth
    isActive
    teamPlayers {
      id
      jerseyNumber
      primaryPosition
      isActive
      team {
        id
        name
      }
    }
    # Note: Game stats would need to be computed from performedEvents
    # This might require a custom resolver field for aggregated stats
    # performedEvents {
    #   id
    #   eventType {
    #     name
    #   }
    #   gameMinute
    #   game {
    #     id
    #   }
    # }
  }
`);

interface PlayerCardSmartProps {
  // Fragment reference - only needs id and typename for cache lookup
  playerRef: { __typename: 'Player'; id: string };

  // Business logic handlers
  onStatUpdate?: (playerId: string, statType: string) => void;

  // UI state passed through to presentation
  showStatButtons?: boolean;
  showPhase1Stats?: boolean;
}

export const PlayerCardSmart = ({
  playerRef,
  onStatUpdate,
  showStatButtons = false,
  showPhase1Stats = false,
}: PlayerCardSmartProps) => {
  // TODO: Replace with actual useFragment when GraphQL schema is available
  // For now, simulate the fragment behavior with mock data that matches User entity
  const mockPlayer = {
    id: playerRef.id,
    firstName: `Player`,
    lastName: `${playerRef.id}`,
    teamPlayers: [
      {
        id: `tp-${playerRef.id}`,
        jerseyNumber: (parseInt(playerRef.id) + 10).toString(),
        primaryPosition: playerRef.id === '2' ? 'Goalkeeper' : 'Forward',
        isActive: true,
        team: {
          id: 'team-1',
          name: 'Home Team',
        },
      },
    ],
  };

  // Data mapping: Transform User entity to PlayerCardPresentation props
  const player = mockPlayer;
  const activeTeamPlayer = player.teamPlayers.find((tp) => tp.isActive);

  // Extract player info from User entity
  const name = `${player.firstName} ${player.lastName}`;
  const jersey = parseInt(activeTeamPlayer?.jerseyNumber || '0');
  const position = activeTeamPlayer?.primaryPosition || 'Unknown';

  // Mock game stats - in real implementation, these would come from:
  // 1. A custom resolver field that aggregates performedEvents
  // 2. Or a separate query for game-specific stats
  // 3. Or computed fields on the User entity
  const mockGameStats = {
    goals: playerRef.id === '1' ? 2 : 0,
    assists: playerRef.id === '1' ? 1 : 0,
    yellowCards: playerRef.id === '2' ? 1 : 0,
    redCards: 0,
    foulsCommitted: 1,
    foulsReceived: 2,
    shotsOnTarget: playerRef.id === '1' ? 4 : 0,
    shotsOffTarget: playerRef.id === '1' ? 2 : 0,
    saves: playerRef.id === '2' ? 5 : 0,
  };

  // Uncomment when GraphQL schema is available:
  // const { data: player, complete } = useFragment({
  //   fragment: PLAYER_CARD_FRAGMENT,
  //   from: playerRef,
  // });

  // if (!complete || !player) {
  //   return (
  //     <div className="
  //       min-h-[120px] animate-pulse rounded-lg border border-gray-200 bg-gray-100
  //       p-3
  //       sm:min-h-[140px]
  //       sm:p-4
  //     ">
  //       <div className="flex space-x-3 sm:space-x-4">
  //         <div className="
  //           h-20 w-16 rounded-lg bg-gray-300
  //           sm:h-24 sm:w-20
  //         " />
  //         <div className="flex-1 space-y-2">
  //           <div className="h-4 w-3/4 rounded bg-gray-300" />
  //           <div className="h-3 w-1/2 rounded bg-gray-300" />
  //           <div className="h-3 w-2/3 rounded bg-gray-300" />
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // Data mapping layer: Transform GraphQL data to presentation component props
  const handleStatClick = (statType: string) => {
    return () => onStatUpdate?.(mockPlayer.id, statType);
  };

  // Map User entity data to presentation stats format
  const stats = {
    goals: mockGameStats.goals,
    assists: mockGameStats.assists,
    yellowCards: mockGameStats.yellowCards,
    redCards: mockGameStats.redCards,
    foulsCommitted: mockGameStats.foulsCommitted,
    foulsReceived: mockGameStats.foulsReceived,
    shotsOnTarget: mockGameStats.shotsOnTarget,
    shotsOffTarget: mockGameStats.shotsOffTarget,
    saves: mockGameStats.saves,
  };

  return (
    <PlayerCard
      id={mockPlayer.id}
      name={name}
      jersey={jersey}
      position={position}
      photo={undefined} // No photo field in User entity
      playTime={90} // Mock - would need to be computed from game data
      isOnField={activeTeamPlayer?.isActive || false}
      stats={stats}
      onYellowCardClick={handleStatClick('yellowCard')}
      onRedCardClick={handleStatClick('redCard')}
      onFoulCommittedClick={handleStatClick('foulCommitted')}
      onFoulReceivedClick={handleStatClick('foulReceived')}
      onShotOnTargetClick={handleStatClick('shotOnTarget')}
      onShotOffTargetClick={handleStatClick('shotOffTarget')}
      onSaveClick={handleStatClick('save')}
      showStatButtons={showStatButtons}
      showPhase1Stats={showPhase1Stats}
    />
  );
};

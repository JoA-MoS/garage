import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { GraphQLContext } from '../dataloaders';

import { LineupPlayer } from './dto/game-lineup.output';
import { PlayerGameStats } from './dto/player-game-stats.output';

/**
 * Resolver for LineupPlayer field-level data loading.
 * Provides optional stats field that's only computed when queried.
 *
 * Uses DataLoader for batched stats fetching - multiple players from the same
 * team share a single service call via request-scoped memoization.
 */
@Resolver(() => LineupPlayer)
export class LineupPlayerResolver {
  /**
   * Resolves stats for a specific player in a game.
   * Only computed when the stats field is explicitly queried.
   *
   * Uses playerStatsByGameTeamLoader DataLoader for request-scoped caching:
   * - Multiple players from the same team share a single getPlayerStatsByGameTeamId call
   * - Stats are loaded once per gameTeamId, then filtered for each player
   */
  @ResolveField(() => PlayerGameStats, {
    nullable: true,
    description: 'Player statistics for this game (only fetched when queried)',
  })
  async stats(
    @Parent() player: LineupPlayer,
    @Context() ctx: GraphQLContext,
  ): Promise<PlayerGameStats | null> {
    // Get all player stats for this game team (batched via DataLoader)
    const allStats = await ctx.loaders.playerStatsByGameTeamLoader.load(
      player.gameTeamId,
    );

    // Find stats for this specific player
    // Must match by playerId OR externalPlayerName, but only if the value is defined
    // (null === null would incorrectly match different players)
    const playerStats = allStats.find((s) => {
      if (player.playerId && s.playerId === player.playerId) {
        return true;
      }
      if (
        player.externalPlayerName &&
        s.externalPlayerName === player.externalPlayerName
      ) {
        return true;
      }
      return false;
    });

    if (!playerStats) {
      return null;
    }

    return {
      totalSeconds: playerStats.totalMinutes * 60 + playerStats.totalSeconds,
      positionTimes: playerStats.positionTimes,
      goals: playerStats.goals,
      assists: playerStats.assists,
      lastEntryPeriodSecond: playerStats.lastEntryGameSeconds,
      currentPosition: playerStats.currentPosition,
    };
  }
}

import { Resolver, ResolveField, Parent } from '@nestjs/graphql';

import { LineupPlayer } from './dto/game-lineup.output';
import { PlayerGameStats } from './dto/player-game-stats.output';
import { StatsService } from './services/stats.service';

/**
 * Resolver for LineupPlayer field-level data loading.
 * Provides optional stats field that's only computed when queried.
 */
@Resolver(() => LineupPlayer)
export class LineupPlayerResolver {
  constructor(private readonly statsService: StatsService) {}

  /**
   * Resolves stats for a specific player in a game.
   * Only computed when the stats field is explicitly queried.
   *
   * Note: This currently fetches all player stats and filters.
   * Could be optimized with a DataLoader if N+1 becomes an issue.
   */
  @ResolveField(() => PlayerGameStats, {
    nullable: true,
    description: 'Player statistics for this game (only fetched when queried)',
  })
  async stats(@Parent() player: LineupPlayer): Promise<PlayerGameStats | null> {
    // Get all player stats for this game team
    const allStats = await this.statsService.getPlayerStatsByGameTeamId(
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
    };
  }
}

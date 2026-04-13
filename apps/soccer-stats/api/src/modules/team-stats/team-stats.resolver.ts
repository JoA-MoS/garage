import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { Public } from '../auth/public.decorator';

import { TeamStatsService } from './team-stats.service';
import { TeamStatsInput } from './dto/team-stats-input';
import { TeamStatsResponse } from './dto/team-stats-response.output';
import { GameStatsSummary } from './dto/game-stats-summary.output';

@Resolver()
@UseGuards(ClerkAuthGuard)
export class TeamStatsResolver {
  constructor(private readonly teamStatsService: TeamStatsService) {}

  @Query(() => TeamStatsResponse, {
    name: 'teamStats',
    description:
      'Get comprehensive team statistics with player breakdown and game-by-game analysis. ' +
      'Supports optional date range filtering for season/period stats.',
  })
  @Public()
  getTeamStats(
    @Args('input') input: TeamStatsInput,
  ): Promise<TeamStatsResponse> {
    return this.teamStatsService.getTeamStats(input);
  }

  @Query(() => GameStatsSummary, {
    name: 'gameTeamStats',
    description:
      'Get stats for a specific team in a specific game, including per-player breakdown.',
  })
  @Public()
  getGameTeamStats(
    @Args('gameTeamId', { type: () => ID }) gameTeamId: string,
  ): Promise<GameStatsSummary> {
    return this.teamStatsService.getGameTeamStats(gameTeamId);
  }
}

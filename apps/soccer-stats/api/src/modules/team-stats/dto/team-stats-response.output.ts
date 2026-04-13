import { ObjectType, Field, ID } from '@nestjs/graphql';

import { TeamAggregateStats } from './team-aggregate-stats.output';
import { PlayerGameStatsRow } from './player-game-stats-row.output';
import { GameStatsSummary } from './game-stats-summary.output';

@ObjectType()
export class TeamStatsResponse {
  @Field(() => ID)
  teamId: string;

  @Field()
  teamName: string;

  @Field(() => TeamAggregateStats)
  aggregateStats: TeamAggregateStats;

  @Field(() => [PlayerGameStatsRow])
  playerStats: PlayerGameStatsRow[];

  @Field(() => [GameStatsSummary])
  gameBreakdown: GameStatsSummary[];
}

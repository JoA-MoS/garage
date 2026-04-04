import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

import { PlayerGameStatsRow } from './player-game-stats-row.output';

@ObjectType()
export class GameStatsSummary {
  @Field(() => ID)
  gameId: string;

  @Field(() => ID)
  gameTeamId: string;

  @Field({ nullable: true })
  gameName?: string;

  @Field({ nullable: true })
  gameDate?: Date;

  @Field()
  gameStatus: string;

  @Field({ nullable: true })
  opponentName?: string;

  @Field(() => Int, { nullable: true })
  teamScore?: number;

  @Field(() => Int, { nullable: true })
  opponentScore?: number;

  @Field()
  result: string; // 'W', 'D', 'L', or 'N/A'

  @Field(() => Int)
  totalGoals: number;

  @Field(() => Int)
  totalAssists: number;

  @Field(() => [PlayerGameStatsRow])
  playerStats: PlayerGameStatsRow[];
}

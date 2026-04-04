import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class TeamAggregateStats {
  @Field(() => Int)
  gamesPlayed: number;

  @Field(() => Int)
  wins: number;

  @Field(() => Int)
  draws: number;

  @Field(() => Int)
  losses: number;

  @Field(() => Float)
  winRate: number;

  @Field(() => Int)
  goalsFor: number;

  @Field(() => Int)
  goalsAgainst: number;

  @Field(() => Int)
  goalDifference: number;

  @Field(() => Int)
  totalAssists: number;

  @Field(() => Int)
  totalYellowCards: number;

  @Field(() => Int)
  totalRedCards: number;
}

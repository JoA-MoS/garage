import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class OnFieldSquadMetric {
  @Field()
  squad: string;

  @Field(() => Int)
  goalsFor: number;

  @Field(() => Int)
  goalsAgainst: number;
}

@ObjectType()
export class PlayerComboMetric {
  @Field()
  scorer: string;

  @Field()
  assister: string;

  @Field(() => Int)
  goals: number;
}

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

  @Field({ nullable: true })
  topScoringSquad?: string;

  @Field(() => Int)
  topScoringSquadGoalsFor: number;

  @Field({ nullable: true })
  topDefensiveSquad?: string;

  @Field(() => Int)
  topDefensiveSquadGoalsAgainst: number;

  @Field(() => [OnFieldSquadMetric])
  topScoringSquads: OnFieldSquadMetric[];

  @Field(() => [OnFieldSquadMetric])
  topDefensiveSquads: OnFieldSquadMetric[];

  @Field(() => [PlayerComboMetric])
  topComboPlayers: PlayerComboMetric[];
}

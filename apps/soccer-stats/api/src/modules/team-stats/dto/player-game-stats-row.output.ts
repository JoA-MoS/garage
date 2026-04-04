import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class PlayerGameStatsRow {
  @Field(() => ID, { nullable: true })
  playerId?: string;

  @Field({ nullable: true })
  playerName?: string;

  @Field({ nullable: true })
  externalPlayerName?: string;

  @Field({ nullable: true })
  externalPlayerNumber?: string;

  @Field(() => Int)
  goals: number;

  @Field(() => Int)
  assists: number;

  @Field(() => Int)
  yellowCards: number;

  @Field(() => Int)
  redCards: number;

  @Field(() => Int)
  ownGoals: number;

  @Field(() => Int)
  totalMinutes: number;

  @Field(() => Int)
  totalSeconds: number;

  @Field(() => Int)
  gamesPlayed: number;
}

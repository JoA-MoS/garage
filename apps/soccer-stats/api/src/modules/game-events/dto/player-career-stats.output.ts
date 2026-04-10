import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class PlayerGameEntry {
  @Field(() => ID)
  gameId: string;

  @Field(() => ID)
  gameTeamId: string;

  @Field({ nullable: true })
  gameDate?: string;

  @Field(() => ID)
  teamId: string;

  @Field()
  teamName: string;

  @Field({ nullable: true })
  opponentName?: string;

  @Field(() => Int, { nullable: true })
  teamScore?: number;

  @Field(() => Int, { nullable: true })
  opponentScore?: number;

  @Field()
  result: string;

  @Field(() => Int)
  goals: number;

  @Field(() => Int)
  assists: number;

  @Field(() => Int)
  unassistedGoals: number;

  @Field(() => Int)
  totalPlayTimeSeconds: number;
}

@ObjectType()
export class PlayerTeamStats {
  @Field(() => ID)
  teamId: string;

  @Field()
  teamName: string;

  @Field(() => Int)
  gamesPlayed: number;

  @Field(() => Int)
  goals: number;

  @Field(() => Int)
  assists: number;

  @Field(() => Int)
  unassistedGoals: number;

  @Field(() => Int)
  totalPlayTimeSeconds: number;
}

@ObjectType()
export class PlayerCareerStats {
  @Field(() => ID)
  playerId: string;

  @Field()
  playerName: string;

  @Field(() => Int)
  totalGamesPlayed: number;

  @Field(() => Int)
  totalGoals: number;

  @Field(() => Int)
  totalAssists: number;

  @Field(() => Int)
  totalUnassistedGoals: number;

  @Field(() => Int)
  totalPlayTimeSeconds: number;

  @Field(() => [PlayerTeamStats])
  teamStats: PlayerTeamStats[];

  @Field(() => [PlayerGameEntry])
  gameHistory: PlayerGameEntry[];
}

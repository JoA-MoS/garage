import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class LineupPlayer {
  @Field(() => ID)
  gameEventId: string;

  @Field(() => ID, { nullable: true })
  playerId?: string;

  @Field({ nullable: true })
  playerName?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  externalPlayerName?: string;

  @Field({ nullable: true })
  externalPlayerNumber?: string;

  @Field({ nullable: true })
  position?: string;

  @Field()
  isOnField: boolean;
}

@ObjectType()
export class GameLineup {
  @Field(() => ID)
  gameTeamId: string;

  @Field({ nullable: true })
  formation?: string;

  @Field(() => [LineupPlayer])
  starters: LineupPlayer[];

  @Field(() => [LineupPlayer])
  bench: LineupPlayer[];

  @Field(() => [LineupPlayer])
  currentOnField: LineupPlayer[];
}

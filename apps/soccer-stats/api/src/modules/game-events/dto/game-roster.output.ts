import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class RosterPlayer {
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

  @Field({ nullable: true, description: 'Position on field. null = on bench' })
  position?: string;
}

@ObjectType()
export class GameRoster {
  @Field(() => ID)
  gameTeamId: string;

  @Field({ nullable: true })
  formation?: string;

  @Field(() => [RosterPlayer])
  players: RosterPlayer[];

  @Field(() => [RosterPlayer], { nullable: true })
  previousPeriodLineup?: RosterPlayer[];
}

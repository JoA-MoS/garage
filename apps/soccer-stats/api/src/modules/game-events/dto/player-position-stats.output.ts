import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class PositionTime {
  @Field()
  position: string;

  @Field(() => Int)
  minutes: number;

  @Field(() => Int)
  seconds: number;
}

@ObjectType()
export class PlayerPositionStats {
  @Field(() => ID, { nullable: true })
  playerId?: string;

  @Field({ nullable: true })
  playerName?: string;

  @Field({ nullable: true })
  externalPlayerName?: string;

  @Field({ nullable: true })
  externalPlayerNumber?: string;

  @Field(() => Int)
  totalMinutes: number;

  @Field(() => Int)
  totalSeconds: number;

  @Field(() => [PositionTime])
  positionTimes: PositionTime[];
}

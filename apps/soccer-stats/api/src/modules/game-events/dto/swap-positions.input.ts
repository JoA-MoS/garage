import { InputType, Field, ID, Int } from '@nestjs/graphql';

@InputType()
export class SwapPositionsInput {
  @Field(() => ID)
  gameTeamId: string;

  @Field(() => ID, {
    description:
      'The GameEvent ID of the first player (will get player2 position)',
  })
  player1EventId: string;

  @Field(() => ID, {
    description:
      'The GameEvent ID of the second player (will get player1 position)',
  })
  player2EventId: string;

  @Field(() => Int)
  gameMinute: number;

  @Field(() => Int, { defaultValue: 0 })
  gameSecond: number;
}

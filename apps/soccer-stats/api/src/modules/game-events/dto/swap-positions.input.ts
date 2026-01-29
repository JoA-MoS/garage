import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max } from 'class-validator';

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

  @Field(() => String, {
    description: 'Period identifier (e.g., "1", "2", "OT1")',
  })
  @IsString()
  period: string;

  @Field(() => Int, {
    description: 'Seconds elapsed within the period (0-5999)',
    defaultValue: 0,
  })
  @IsInt()
  @Min(0)
  @Max(5999)
  periodSecond: number;
}

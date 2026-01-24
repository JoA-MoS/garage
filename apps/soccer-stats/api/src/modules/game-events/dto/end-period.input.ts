import { InputType, Field, ID, Int } from '@nestjs/graphql';

@InputType()
export class EndPeriodInput {
  @Field(() => ID, { description: 'The game team ID' })
  gameTeamId: string;

  @Field(() => Int, {
    description: 'Period number to end (1 for first half, 2 for second half)',
  })
  period: number;

  @Field(() => Int, {
    nullable: true,
    description:
      'Game minute for the period end (defaults to calculated elapsed time)',
  })
  gameMinute?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Game second for the period end (defaults to 0)',
  })
  gameSecond?: number;
}

import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

@InputType()
export class EndPeriodInput {
  @Field(() => ID, { description: 'The game team ID' })
  gameTeamId: string;

  @Field(() => String, {
    description: 'Period identifier to end (e.g., "1", "2", "OT1")',
  })
  @IsString()
  period: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Seconds elapsed within the period at end time',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5999)
  periodSecond?: number;
}

import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';

@InputType()
export class RecordFormationChangeInput {
  @Field(() => ID)
  @IsUUID()
  gameTeamId: string;

  @Field({ description: 'Formation code (e.g., "4-3-3", "3-5-2")' })
  @IsString()
  @MaxLength(50)
  formation: string;

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

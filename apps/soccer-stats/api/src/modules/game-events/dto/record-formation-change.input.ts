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

  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(999)
  gameMinute: number;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  @Max(59)
  gameSecond: number;
}

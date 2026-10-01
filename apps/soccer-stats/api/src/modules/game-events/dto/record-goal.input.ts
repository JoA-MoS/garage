import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsUUID,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

@InputType()
export class RecordGoalInput {
  @Field(() => ID, {
    nullable: true,
    description: 'Stable client UUID for idempotent goal creation',
  })
  @IsOptional()
  @IsUUID('4')
  clientActionId?: string;

  @Field(() => ID)
  @IsUUID()
  gameTeamId: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Player ID for managed team scorer',
  })
  @IsOptional()
  @IsUUID()
  scorerId?: string;

  @Field({
    nullable: true,
    description: 'External player name for opponent scorer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalScorerName?: string;

  @Field({ nullable: true, description: 'External player jersey number' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  externalScorerNumber?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Player ID for managed team assister',
  })
  @IsOptional()
  @IsUUID()
  assisterId?: string;

  @Field({
    nullable: true,
    description: 'External player name for opponent assister',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalAssisterName?: string;

  @Field({
    nullable: true,
    description: 'External player jersey number for assister',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  externalAssisterNumber?: string;

  @Field(() => String, {
    description: 'Period identifier (e.g., "1", "2", "OT1")',
  })
  @IsString()
  @MaxLength(20)
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

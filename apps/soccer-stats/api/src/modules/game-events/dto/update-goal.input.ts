import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsString, IsInt, Min, Max } from 'class-validator';

@InputType()
export class UpdateGoalInput {
  @Field(() => ID, { description: 'The goal event ID to update' })
  @IsUUID()
  gameEventId: string;

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
  externalScorerName?: string;

  @Field({ nullable: true, description: 'External player jersey number' })
  @IsOptional()
  @IsString()
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
  externalAssisterName?: string;

  @Field({
    nullable: true,
    description: 'External player jersey number for assister',
  })
  @IsOptional()
  @IsString()
  externalAssisterNumber?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Period identifier (e.g., "1", "2", "OT1")',
  })
  @IsOptional()
  @IsString()
  period?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Seconds elapsed within the period (0-5999)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5999)
  periodSecond?: number;

  @Field({ nullable: true, description: 'Set to true to clear the assist' })
  @IsOptional()
  clearAssist?: boolean;
}

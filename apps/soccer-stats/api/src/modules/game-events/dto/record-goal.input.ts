import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsString, IsInt, Min, Max } from 'class-validator';

@InputType()
export class RecordGoalInput {
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

  @Field(() => ID, {
    nullable: true,
    description:
      'Client-generated idempotency key. A retry with the same actionId returns the original goal without recording it again.',
  })
  actionId?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Client-chosen ID for the GOAL event',
  })
  goalEventId?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Client-chosen ID for the ASSIST event (child of the goal)',
  })
  assistEventId?: string;

  @Field({
    nullable: true,
    description: 'Client wall-clock time the goal was recorded',
  })
  occurredAt?: Date;
}

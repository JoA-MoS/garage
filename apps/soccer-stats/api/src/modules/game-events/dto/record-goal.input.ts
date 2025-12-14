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

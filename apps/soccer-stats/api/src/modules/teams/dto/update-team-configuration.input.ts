import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';

import { StatsTrackingLevel } from '../../../entities/team-configuration.entity';

@InputType()
export class UpdateTeamConfigurationInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  defaultGameFormatId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultFormation?: string;

  @Field({ nullable: true })
  @IsOptional()
  defaultGameDuration?: number;

  @Field({ nullable: true })
  @IsOptional()
  defaultPlayerCount?: number;

  @Field(() => StatsTrackingLevel, { nullable: true })
  @IsOptional()
  @IsEnum(StatsTrackingLevel)
  statsTrackingLevel?: StatsTrackingLevel;

  // TODO: Add defaultLineup when implementing lineup defaults feature
  // Will need graphql-type-json package for GraphQLJSON scalar
}

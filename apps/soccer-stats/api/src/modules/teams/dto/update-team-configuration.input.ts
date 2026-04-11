import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { StatsFeaturesInput } from '../../../entities/stats-features.type';

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

  @Field(() => StatsFeaturesInput, {
    nullable: true,
    description: "Default stats features for this team's games",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StatsFeaturesInput)
  statsFeatures?: StatsFeaturesInput;

  // TODO: Add defaultLineup when implementing lineup defaults feature
  // Will need graphql-type-json package for GraphQLJSON scalar
}

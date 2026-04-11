import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { StatsFeaturesInput } from '../../../entities/stats-features.type';

@InputType()
export class UpdateGameTeamInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  formation?: string;

  @Field(() => StatsFeaturesInput, {
    nullable: true,
    description:
      'Stats feature overrides for this team in this game (null = use game or team default)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StatsFeaturesInput)
  statsFeatures?: StatsFeaturesInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tacticalNotes?: string;
}

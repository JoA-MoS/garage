import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsString } from 'class-validator';

import { StatsTrackingLevel } from '../../../entities/team-configuration.entity';

@InputType()
export class UpdateGameTeamInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  formation?: string;

  @Field(() => StatsTrackingLevel, {
    nullable: true,
    description:
      'Override stats tracking level for this team in this game (null = use team default)',
  })
  @IsOptional()
  @IsEnum(StatsTrackingLevel)
  statsTrackingLevel?: StatsTrackingLevel;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tacticalNotes?: string;
}

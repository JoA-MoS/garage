import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsUUID,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsOptional,
} from 'class-validator';

import { SubstitutionReason } from './substitution-reason.enum';

/**
 * Input for bringing a player onto the field during a game.
 * Creates a SUBSTITUTION_IN event without requiring a paired SUBSTITUTION_OUT.
 * Used for late arrivals, halftime lineup changes, or adding to empty positions.
 */
@InputType()
export class BringPlayerOntoFieldInput {
  @Field(() => ID)
  @IsUUID()
  gameTeamId: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Player ID for managed roster player',
  })
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @Field({
    nullable: true,
    description: 'External player name (for opponents)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalPlayerName?: string;

  @Field({
    nullable: true,
    description: 'External player jersey number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  externalPlayerNumber?: string;

  @Field({ description: 'Position for the player (e.g., "CM", "ST", "GK")' })
  @IsString()
  @MaxLength(20)
  position: string;

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

  @Field(() => SubstitutionReason, {
    nullable: true,
    description: 'Reason for bringing the player on (e.g., LATE_ARRIVAL)',
  })
  @IsOptional()
  reason?: SubstitutionReason;

  @Field({
    nullable: true,
    description: 'Optional notes about the substitution',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

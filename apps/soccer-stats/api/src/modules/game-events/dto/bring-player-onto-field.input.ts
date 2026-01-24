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

  @Field(() => Int, { description: 'Game minute when player enters' })
  @IsInt()
  @Min(0)
  @Max(999)
  gameMinute: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: 'Game second when player enters',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  gameSecond?: number;

  @Field(() => Int, {
    nullable: true,
    description:
      'Period number (1 for first half, 2 for second half). If not provided, will be inferred from game time.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10) // Allow for extra time periods
  period?: number;

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

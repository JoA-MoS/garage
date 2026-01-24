import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { SubstitutionReason } from './substitution-reason.enum';

/**
 * Input for removing a player from the field without replacement.
 * Creates only a SUBSTITUTION_OUT event - no paired SUBSTITUTION_IN required.
 * Used for scenarios like injuries, red cards, or tactical removals.
 */
@InputType()
export class RemovePlayerFromFieldInput {
  @Field(() => ID, { description: 'The game team ID' })
  @IsUUID()
  gameTeamId: string;

  @Field(() => ID, {
    description:
      'The GameEvent ID of the player to remove (their current on-field event: STARTING_LINEUP or SUBSTITUTION_IN)',
  })
  @IsUUID()
  playerEventId: string;

  @Field(() => Int, { description: 'Game minute when player leaves the field' })
  @IsInt()
  @Min(0)
  @Max(999)
  gameMinute: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: 'Game second when player leaves the field',
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
    description: 'Reason for removing the player (e.g., INJURY, RED_CARD)',
  })
  @IsOptional()
  reason?: SubstitutionReason;

  @Field({
    nullable: true,
    description: 'Optional notes about the removal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

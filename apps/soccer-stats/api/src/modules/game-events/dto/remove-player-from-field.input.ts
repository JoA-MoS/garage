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
      'The GameEvent ID of the player to remove (their current on-field event: SUBSTITUTION_IN)',
  })
  @IsUUID()
  playerEventId: string;

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

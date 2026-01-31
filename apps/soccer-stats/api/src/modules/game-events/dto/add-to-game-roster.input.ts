import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsUUID,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

/**
 * Input for adding a player to a game roster.
 * Creates a GAME_ROSTER event.
 *
 * This mutation replaces the old addToBench and addToLineup mutations:
 * - Without position: equivalent to addToBench (player on roster, available to sub in)
 * - With position: equivalent to addToLineup (planned starter with assigned position)
 */
@InputType()
export class AddToGameRosterInput {
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

  @Field({
    nullable: true,
    description:
      'Position if player is a planned starter (e.g., "CM", "ST", "GK"). Omit for bench players.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  position?: string;
}

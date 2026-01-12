import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsUUID,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum PositionChangeReason {
  FORMATION_CHANGE = 'FORMATION_CHANGE',
  TACTICAL = 'TACTICAL',
  OTHER = 'OTHER',
}

@InputType()
export class RecordPositionChangeInput {
  @Field(() => ID, { description: 'The game team ID' })
  @IsUUID()
  gameTeamId: string;

  @Field(() => ID, {
    description:
      'The GameEvent ID of the player entry (STARTING_LINEUP or SUBSTITUTION_IN)',
  })
  @IsUUID()
  playerEventId: string;

  @Field({ description: 'The new position code (e.g., "CM", "ST", "GK")' })
  @IsString()
  @MaxLength(20)
  newPosition: string;

  @Field(() => Int, { description: 'Game minute when position change occurs' })
  @IsInt()
  @Min(0)
  @Max(999)
  gameMinute: number;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  @Max(59)
  gameSecond: number;

  @Field(() => String, {
    nullable: true,
    description: 'Reason for position change',
  })
  @IsOptional()
  @IsEnum(PositionChangeReason)
  reason?: PositionChangeReason;
}

import { InputType, PartialType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { GameStatus } from '../../../entities/game.entity';
import { StatsFeaturesInput } from '../../../entities/stats-features.type';

import { CreateGameInput } from './create-game.input';

@InputType()
export class UpdateGameInput extends PartialType(CreateGameInput) {
  @Field(() => GameStatus, { nullable: true })
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @Field(() => Int, {
    nullable: true,
    description:
      'Period-relative seconds when status changes (used for timing events)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  periodSecond?: number;

  @Field({ nullable: true })
  @IsOptional()
  actualStart?: Date;

  @Field({ nullable: true })
  @IsOptional()
  firstHalfEnd?: Date;

  @Field({ nullable: true })
  @IsOptional()
  secondHalfStart?: Date;

  @Field({ nullable: true })
  @IsOptional()
  actualEnd?: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'When the game clock was paused (null to unpause)',
  })
  @IsOptional()
  pausedAt?: Date | null;

  @Field({
    nullable: true,
    description:
      'If true, resets the game to SCHEDULED status and clears all timestamps',
  })
  @IsOptional()
  @IsBoolean()
  resetGame?: boolean;

  @Field({
    nullable: true,
    description: 'If true (with resetGame), also deletes all game events',
  })
  @IsOptional()
  @IsBoolean()
  clearEvents?: boolean;

  @Field(() => StatsFeaturesInput, {
    nullable: true,
    description:
      'Stats feature overrides for this game (null = use team default)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StatsFeaturesInput)
  statsFeatures?: StatsFeaturesInput;

  @Field(() => ID, {
    nullable: true,
    description:
      'Client-generated idempotency key. A retry with the same actionId returns the current game without applying the change again.',
  })
  actionId?: string;

  @Field({
    nullable: true,
    description:
      'Client wall-clock time of the change. The game clock uses it, so a change that syncs late is still timed correctly.',
  })
  occurredAt?: Date;

  @Field(() => String, {
    nullable: true,
    description:
      'Current period when pausing/resuming (e.g. "1", "2"), with periodSecond, to place the stoppage in game time',
  })
  period?: string;
}

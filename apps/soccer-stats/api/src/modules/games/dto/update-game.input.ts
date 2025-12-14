import { InputType, PartialType, Field } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';

import { GameStatus } from '../../../entities/game.entity';

import { CreateGameInput } from './create-game.input';

@InputType()
export class UpdateGameInput extends PartialType(CreateGameInput) {
  @Field(() => GameStatus, { nullable: true })
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

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
}

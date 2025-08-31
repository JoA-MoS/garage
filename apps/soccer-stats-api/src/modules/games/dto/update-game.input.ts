import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';

import { GameStatus } from '../../../entities/game.entity';

import { CreateGameInput } from './create-game.input';

@InputType()
export class UpdateGameInput extends PartialType(CreateGameInput) {
  @Field(() => GameStatus, { nullable: true })
  @IsEnum(GameStatus)
  @IsOptional()
  status?: GameStatus;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  currentTime?: number;
}

import { InputType, Field, Int, ID } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsInt, Min, IsUUID } from 'class-validator';

import { GameFormat } from '../../../entities/game.entity';

@InputType()
export class CreateGameInput {
  @Field(() => ID)
  @IsUUID()
  homeTeamId: string;

  @Field(() => ID)
  @IsUUID()
  awayTeamId: string;

  @Field(() => GameFormat)
  @IsEnum(GameFormat)
  format: GameFormat;

  @Field(() => Int, { defaultValue: 90 })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;
}

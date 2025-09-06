import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { CreatePlayerInput } from './create-player.input';

@InputType()
export class UpdatePlayerInput extends PartialType(CreatePlayerInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;
}

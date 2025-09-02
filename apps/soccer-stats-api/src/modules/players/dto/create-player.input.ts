import { InputType, Field } from '@nestjs/graphql';
import { IsString, MaxLength } from 'class-validator';

@InputType()
export class CreatePlayerInput {
  @Field()
  @IsString()
  @MaxLength(255)
  name: string;

  @Field()
  @IsString()
  @MaxLength(100)
  position: string;
}

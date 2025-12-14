import { InputType, Field, PartialType } from '@nestjs/graphql';

import { CreateGameFormatInput } from './create-game-format.input';

@InputType()
export class UpdateGameFormatInput extends PartialType(CreateGameFormatInput) {
  @Field()
  id: string;
}

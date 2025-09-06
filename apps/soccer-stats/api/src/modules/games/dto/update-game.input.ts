import { InputType, PartialType } from '@nestjs/graphql';

import { CreateGameInput } from './create-game.input';

@InputType()
export class UpdateGameInput extends PartialType(CreateGameInput) {}

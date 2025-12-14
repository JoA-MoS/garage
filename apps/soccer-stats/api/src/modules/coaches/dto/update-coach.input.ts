import { InputType, PartialType } from '@nestjs/graphql';

import { CreateCoachInput } from './create-coach.input';

@InputType()
export class UpdateCoachInput extends PartialType(CreateCoachInput) {}

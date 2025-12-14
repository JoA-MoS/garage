import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

import { UpdateTeamInput } from './update-team.input';

@InputType()
export class UpgradeTeamInput extends UpdateTeamInput {
  @Field(() => ID)
  @IsUUID()
  teamId: string;
}

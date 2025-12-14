import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class AddToBenchInput {
  @Field(() => ID)
  gameTeamId: string;

  @Field(() => ID, { nullable: true })
  playerId?: string;

  @Field({ nullable: true })
  externalPlayerName?: string;

  @Field({ nullable: true })
  externalPlayerNumber?: string;
}

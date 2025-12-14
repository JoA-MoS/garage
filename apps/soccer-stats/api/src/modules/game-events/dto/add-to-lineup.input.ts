import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class AddToLineupInput {
  @Field(() => ID)
  gameTeamId: string;

  @Field(() => ID, { nullable: true })
  playerId?: string;

  @Field({ nullable: true })
  externalPlayerName?: string;

  @Field({ nullable: true })
  externalPlayerNumber?: string;

  @Field()
  position: string;
}

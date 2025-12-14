import { InputType, Field, ID, Int } from '@nestjs/graphql';

@InputType()
export class SubstitutePlayerInput {
  @Field(() => ID)
  gameTeamId: string;

  @Field(() => ID, {
    description: 'The GameEvent ID of the player being substituted out',
  })
  playerOutEventId: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Player ID if substituting in a managed roster player',
  })
  playerInId?: string;

  @Field({
    nullable: true,
    description: 'External player name if substituting in an opponent player',
  })
  externalPlayerInName?: string;

  @Field({
    nullable: true,
    description: 'External player number if substituting in an opponent player',
  })
  externalPlayerInNumber?: string;

  @Field(() => Int)
  gameMinute: number;

  @Field(() => Int, { defaultValue: 0 })
  gameSecond: number;
}

import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class SecondHalfLineupPlayerInput {
  @Field(() => ID, {
    nullable: true,
    description: 'Player ID for managed roster player',
  })
  playerId?: string;

  @Field({
    nullable: true,
    description: 'External player name (for opponents)',
  })
  externalPlayerName?: string;

  @Field({ nullable: true, description: 'External player jersey number' })
  externalPlayerNumber?: string;

  @Field({ description: 'Position for second half (e.g., "CM", "ST", "GK")' })
  position: string;
}

@InputType()
export class SetSecondHalfLineupInput {
  @Field(() => ID)
  gameTeamId: string;

  @Field(() => [SecondHalfLineupPlayerInput], {
    description: 'Players for second half lineup',
  })
  lineup: SecondHalfLineupPlayerInput[];
}

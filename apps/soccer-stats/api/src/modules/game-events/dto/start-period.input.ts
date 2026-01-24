import { InputType, Field, ID, Int } from '@nestjs/graphql';

@InputType()
export class PeriodLineupPlayerInput {
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

  @Field({ description: 'Position for this period (e.g., "CM", "ST", "GK")' })
  position: string;
}

@InputType()
export class StartPeriodInput {
  @Field(() => ID, { description: 'The game team ID' })
  gameTeamId: string;

  @Field(() => Int, {
    description: 'Period number (1 for first half, 2 for second half)',
  })
  period: number;

  @Field(() => [PeriodLineupPlayerInput], {
    description: 'Players to bring onto the field for this period',
  })
  lineup: PeriodLineupPlayerInput[];

  @Field(() => Int, {
    nullable: true,
    description:
      'Game minute for the period start (defaults to 0 for period 1, or calculated from timing for period 2+)',
  })
  gameMinute?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Game second for the period start (defaults to 0)',
  })
  gameSecond?: number;
}

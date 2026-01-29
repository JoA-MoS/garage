import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

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

  @Field(() => String, {
    description: 'Period identifier (e.g., "1", "2", "OT1")',
  })
  @IsString()
  period: string;

  @Field(() => [PeriodLineupPlayerInput], {
    description: 'Players to bring onto the field for this period',
  })
  lineup: PeriodLineupPlayerInput[];

  @Field(() => Int, {
    nullable: true,
    description:
      'Seconds elapsed within the period (defaults to 0 for period start)',
    defaultValue: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5999)
  periodSecond?: number;
}

import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max } from 'class-validator';

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

  @Field(() => String, {
    description: 'Period identifier (e.g., "1", "2", "OT1")',
  })
  @IsString()
  period: string;

  @Field(() => Int, {
    description: 'Seconds elapsed within the period (0-5999)',
    defaultValue: 0,
  })
  @IsInt()
  @Min(0)
  @Max(5999)
  periodSecond: number;

  @Field(() => ID, {
    nullable: true,
    description:
      'Client-generated idempotency key. A retry with the same actionId returns the original result without creating new events.',
  })
  actionId?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Client-chosen ID for the SUBSTITUTION_OUT event',
  })
  subOutEventId?: string;

  @Field(() => ID, {
    nullable: true,
    description:
      'Client-chosen ID for the SUBSTITUTION_IN event, so later queued actions can reference it before it syncs',
  })
  subInEventId?: string;

  @Field({
    nullable: true,
    description: 'Client wall-clock time the substitution was confirmed',
  })
  occurredAt?: Date;
}

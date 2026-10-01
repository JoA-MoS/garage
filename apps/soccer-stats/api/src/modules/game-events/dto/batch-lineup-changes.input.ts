import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max } from 'class-validator';

/**
 * Single substitution within a batch operation
 */
@InputType()
export class BatchSubstitutionInput {
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

  @Field(() => ID, {
    nullable: true,
    description: 'Client-chosen ID for the SUBSTITUTION_OUT event',
  })
  subOutEventId?: string;

  @Field(() => ID, {
    nullable: true,
    description:
      'Client-chosen ID for the SUBSTITUTION_IN event. Swaps in the same batch can reference it by eventId.',
  })
  subInEventId?: string;
}

/**
 * Reference to a player for position swaps - either by event ID or substitution index
 */
@InputType()
export class BatchSwapPlayerRef {
  @Field(() => ID, {
    nullable: true,
    description: 'The GameEvent ID for an on-field player',
  })
  eventId?: string;

  @Field(() => Int, {
    nullable: true,
    description:
      'Index of a substitution in the batch (0-based) to reference the incoming player',
  })
  substitutionIndex?: number;
}

/**
 * Single position swap within a batch operation
 */
@InputType()
export class BatchSwapInput {
  @Field(() => BatchSwapPlayerRef, {
    description:
      'First player reference (will get player2 position). Use eventId for on-field players, or substitutionIndex to reference an incoming player from a queued substitution.',
  })
  player1: BatchSwapPlayerRef;

  @Field(() => BatchSwapPlayerRef, {
    description:
      'Second player reference (will get player1 position). Use eventId for on-field players, or substitutionIndex to reference an incoming player from a queued substitution.',
  })
  player2: BatchSwapPlayerRef;

  @Field(() => ID, {
    nullable: true,
    description: 'Client-chosen ID for the first POSITION_SWAP event',
  })
  swap1EventId?: string;

  @Field(() => ID, {
    nullable: true,
    description:
      'Client-chosen ID for the second POSITION_SWAP event (child of the first)',
  })
  swap2EventId?: string;
}

/**
 * Input for batch lineup changes - processes multiple substitutions and swaps
 * in a single GraphQL mutation to reduce network overhead
 */
@InputType()
export class BatchLineupChangesInput {
  @Field(() => ID)
  gameTeamId: string;

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

  @Field(() => [BatchSubstitutionInput], {
    defaultValue: [],
    description: 'List of substitutions to process (processed first)',
  })
  substitutions: BatchSubstitutionInput[];

  @Field(() => [BatchSwapInput], {
    defaultValue: [],
    description:
      'List of position swaps to process (processed after substitutions)',
  })
  swaps: BatchSwapInput[];

  @Field(() => ID, {
    nullable: true,
    description:
      'Client-generated idempotency key. A retry with the same actionId returns the original result without creating new events.',
  })
  actionId?: string;

  @Field({
    nullable: true,
    description: 'Client wall-clock time the change was confirmed',
  })
  occurredAt?: Date;
}

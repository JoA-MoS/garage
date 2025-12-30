import { InputType, Field, ID, Int } from '@nestjs/graphql';

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
}

/**
 * Input for batch lineup changes - processes multiple substitutions and swaps
 * in a single GraphQL mutation to reduce network overhead
 */
@InputType()
export class BatchLineupChangesInput {
  @Field(() => ID)
  gameTeamId: string;

  @Field(() => Int, { description: 'Game minute when changes occur' })
  gameMinute: number;

  @Field(() => Int, {
    defaultValue: 0,
    description: 'Game second when changes occur',
  })
  gameSecond: number;

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
}

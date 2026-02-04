import { ObjectType, Field, Int } from '@nestjs/graphql';

import { PositionTime } from './player-position-stats.output';

/**
 * Player statistics for a single game.
 * Used as a nested field on player types (e.g., LineupPlayer.stats).
 * Only fetched when explicitly queried.
 */
@ObjectType()
export class PlayerGameStats {
  @Field(() => Int)
  totalSeconds: number;

  @Field(() => [PositionTime])
  positionTimes: PositionTime[];

  @Field(() => Int)
  goals: number;

  @Field(() => Int)
  assists: number;

  @Field(() => Int, { nullable: true })
  lastEntryPeriodSecond?: number;
}

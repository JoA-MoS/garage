import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

import { PositionTime } from './player-position-stats.output';

@ObjectType()
export class PlayerFullStats {
  // Player identification
  @Field(() => ID, { nullable: true })
  playerId?: string;

  @Field({ nullable: true })
  playerName?: string;

  @Field({ nullable: true })
  externalPlayerName?: string;

  @Field({ nullable: true })
  externalPlayerNumber?: string;

  // Playing time
  @Field(() => Int)
  totalMinutes: number;

  @Field(() => Int)
  totalSeconds: number;

  @Field(() => [PositionTime])
  positionTimes: PositionTime[];

  // Scoring stats
  @Field(() => Int)
  goals: number;

  @Field(() => Int)
  assists: number;

  // Game count (for averages)
  @Field(() => Int)
  gamesPlayed: number;

  // Live time tracking (for real-time UI updates)
  @Field(() => Boolean, { nullable: true })
  isOnField?: boolean;

  @Field(() => Int, { nullable: true })
  lastEntryGameSeconds?: number;

  @Field({ nullable: true })
  currentPosition?: string;

  // Future extensibility (nullable)
  @Field(() => Int, { nullable: true })
  yellowCards?: number;

  @Field(() => Int, { nullable: true })
  redCards?: number;

  @Field(() => Int, { nullable: true })
  saves?: number;
}

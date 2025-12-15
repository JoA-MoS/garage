import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';

import { GameEvent } from '../../../entities/game-event.entity';

export enum GameEventAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  DUPLICATE_DETECTED = 'DUPLICATE_DETECTED',
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
}

registerEnumType(GameEventAction, {
  name: 'GameEventAction',
  description: 'The type of action that occurred on a game event',
});

@ObjectType()
export class ConflictingEvent {
  @Field(() => ID)
  eventId: string;

  @Field()
  playerName: string;

  @Field(() => ID, { nullable: true })
  playerId?: string;

  @Field()
  recordedByUserName: string;
}

@ObjectType()
export class ConflictInfo {
  @Field(() => ID)
  conflictId: string;

  @Field()
  eventType: string;

  @Field(() => Int)
  gameMinute: number;

  @Field(() => Int)
  gameSecond: number;

  @Field(() => [ConflictingEvent])
  conflictingEvents: ConflictingEvent[];
}

@ObjectType()
export class GameEventSubscriptionPayload {
  @Field(() => GameEventAction)
  action: GameEventAction;

  @Field(() => ID)
  gameId: string;

  @Field(() => GameEvent, { nullable: true })
  event?: GameEvent;

  @Field(() => ID, { nullable: true })
  deletedEventId?: string;

  @Field(() => ConflictInfo, { nullable: true })
  conflict?: ConflictInfo;
}

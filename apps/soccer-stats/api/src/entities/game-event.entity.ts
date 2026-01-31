import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Game } from './game.entity';
import { GameTeam } from './game-team.entity';
import { User } from './user.entity';
import { EventType } from './event-type.entity';

@ObjectType()
@Entity('game_events')
export class GameEvent extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  gameId: string;

  @Field(() => ID)
  @Column('uuid')
  eventTypeId: string;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { nullable: true })
  playerId?: string;

  @Field({ nullable: true })
  @Column({ length: 100, nullable: true })
  externalPlayerName?: string;

  @Field({ nullable: true })
  @Column({ length: 10, nullable: true })
  externalPlayerNumber?: string;

  @Field(() => ID)
  @Column('uuid')
  recordedByUserId: string;

  @Field(() => ID)
  @Column('uuid')
  gameTeamId: string;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { nullable: true })
  parentEventId?: string;

  /**
   * @deprecated Use `period` and `periodSecond` instead.
   * Kept for backward compatibility during migration.
   */
  @Field(() => Int, {
    deprecationReason: 'Use period and periodSecond instead',
  })
  @Column({ type: 'int' })
  gameMinute: number;

  /**
   * @deprecated Use `period` and `periodSecond` instead.
   * Kept for backward compatibility during migration.
   */
  @Field(() => Int, {
    deprecationReason: 'Use period and periodSecond instead',
  })
  @Column({ type: 'int' })
  gameSecond: number;

  /**
   * Period identifier (e.g., "1", "2", "OT1", "OT2").
   * The clock resets at the start of each period, matching real soccer timing.
   */
  @Field(() => String, { nullable: true })
  @Column({ length: 10, nullable: true })
  period?: string;

  /**
   * Seconds elapsed within the current period (resets each period).
   * Combined with `period`, this represents the exact game time.
   * Example: period="2", periodSecond=1320 means 22:00 into second half (67' display time).
   */
  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  periodSecond: number;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  position?: string;

  @Field({
    nullable: true,
    description:
      'Team formation code for FORMATION_CHANGE events (e.g., "4-3-3")',
  })
  @Column({ length: 20, nullable: true })
  formation?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { nullable: true })
  conflictId?: string;

  // Note: metadata field is excluded from GraphQL schema to avoid type complexity
  @Column({ type: 'json', nullable: true })
  metadata?: object;

  @Field(() => Game)
  @ManyToOne(() => Game, (game) => game.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Field(() => EventType)
  @ManyToOne(() => EventType, (eventType) => eventType.gameEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventTypeId' })
  eventType: EventType;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.performedEvents, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'playerId' })
  player?: User;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.recordedEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recordedByUserId' })
  recordedByUser: User;

  @Field(() => GameTeam)
  @ManyToOne(() => GameTeam, (gameTeam) => gameTeam.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gameTeamId' })
  gameTeam: GameTeam;

  @Field(() => GameEvent, { nullable: true })
  @ManyToOne(() => GameEvent, (gameEvent) => gameEvent.childEvents, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentEventId' })
  parentEvent?: GameEvent;

  @Field(() => [GameEvent])
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.parentEvent)
  childEvents: GameEvent[];

  /**
   * Validates player reference constraints.
   * - Cannot have BOTH playerId and externalPlayerName (ambiguous reference)
   * - Having neither is allowed for event types like GOAL where scorer may be unknown
   * - Service layer enforces player requirements for events that need them
   *   (GAME_ROSTER, SUBSTITUTION_IN, SUBSTITUTION_OUT).
   *   POSITION_SWAP events instead reference existing player events and are
   *   validated separately when swapping positions.
   */
  @BeforeInsert()
  @BeforeUpdate()
  validatePlayerReference() {
    const hasInternalPlayer = !!this.playerId;
    const hasExternalPlayer = !!this.externalPlayerName;

    // Only enforce mutual exclusivity - can't have both types of player reference
    // (null players allowed for GOALS_ONLY mode and opponent goals)
    if (hasInternalPlayer && hasExternalPlayer) {
      throw new Error('Cannot have both playerId and externalPlayerName');
    }
  }
}

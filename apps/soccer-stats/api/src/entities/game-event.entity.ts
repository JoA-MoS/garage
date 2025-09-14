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

  @Field(() => Int)
  @Column({ type: 'int' })
  gameMinute: number;

  @Field(() => Int)
  @Column({ type: 'int' })
  gameSecond: number;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  position?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  // Note: metadata field is excluded from GraphQL schema to avoid type complexity
  @Column({ type: 'json', nullable: true })
  metadata?: object;

  @Field(() => Game)
  @ManyToOne(() => Game, (game) => game.gameEvents, { onDelete: 'CASCADE' })
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
  @ManyToOne(() => GameTeam, (gameTeam) => gameTeam.gameEvents, {
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

  @BeforeInsert()
  @BeforeUpdate()
  validatePlayerReference() {
    const hasInternalPlayer = !!this.playerId;
    const hasExternalPlayer = !!this.externalPlayerName;

    if (!hasInternalPlayer && !hasExternalPlayer) {
      throw new Error('Either playerId or externalPlayerName must be provided');
    }

    if (hasInternalPlayer && hasExternalPlayer) {
      throw new Error('Cannot have both playerId and externalPlayerName');
    }
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { GameEvent } from './game-event.entity';

export enum EventCategory {
  SCORING = 'SCORING',
  DISCIPLINE = 'DISCIPLINE',
  SUBSTITUTION = 'SUBSTITUTION',
  DEFENSIVE = 'DEFENSIVE',
  SET_PIECE = 'SET_PIECE',
  OFFENSIVE = 'OFFENSIVE',
  GAME_FLOW = 'GAME_FLOW',
}

@ObjectType()
@Entity('event_types')
export class EventType {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 50, unique: true })
  code: string;

  @Field()
  @Column({ length: 100 })
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: EventCategory,
  })
  category: EventCategory;

  @Field()
  @Column({ type: 'boolean', default: false })
  requiresRelatedPlayer: boolean;

  @Field()
  @Column({ type: 'boolean', default: true })
  isTeamEvent: boolean;

  @Field()
  @Column({ type: 'boolean', default: true })
  isPositive: boolean;

  @Column({ type: 'json', nullable: true })
  metadataSchema?: object;

  @Field()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field(() => [GameEvent])
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.eventType)
  gameEvents: GameEvent[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

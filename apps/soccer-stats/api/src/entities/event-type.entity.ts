import { Entity, Column, OneToMany } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { GameEvent } from './game-event.entity';

export enum EventCategory {
  SCORING = 'SCORING',
  DISCIPLINARY = 'DISCIPLINARY',
  SUBSTITUTION = 'SUBSTITUTION',
  TACTICAL = 'TACTICAL',
  GAME_FLOW = 'GAME_FLOW',
}

@ObjectType()
@Entity('event_types')
export class EventType extends BaseEntity {
  @Field()
  @Column({ length: 100 })
  name: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: EventCategory,
  })
  category: EventCategory;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field()
  @Column({ type: 'boolean', default: false })
  requiresPosition: boolean;

  @Field()
  @Column({ type: 'boolean', default: false })
  allowsParent: boolean;

  @Field(() => [GameEvent])
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.eventType)
  gameEvents: GameEvent[];
}

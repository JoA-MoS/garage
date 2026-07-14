import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { CalendarSource } from './calendar-source.entity';
import { Game } from './game.entity';

@ObjectType()
@Entity('external_game_mappings')
@Unique('UQ_external_game_mappings_source_uid', [
  'calendarSourceId',
  'externalUid',
])
export class ExternalGameMapping extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  calendarSourceId!: string;

  @Field(() => ID)
  @Column('uuid')
  gameId!: string;

  @Field()
  @Column({ length: 255 })
  externalUid!: string;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  externalSequence?: number;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  externalCreatedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  externalLastModified?: Date;

  @Field(() => CalendarSource)
  @ManyToOne(() => CalendarSource, (source) => source.externalGameMappings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'calendarSourceId' })
  calendarSource!: CalendarSource;

  @Field(() => Game)
  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game!: Game;
}

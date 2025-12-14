import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { GameTeam } from './game-team.entity';
import { GameEvent } from './game-event.entity';
import { GameFormat } from './game-format.entity';

export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  FIRST_HALF = 'FIRST_HALF',
  HALFTIME = 'HALFTIME',
  SECOND_HALF = 'SECOND_HALF',
  IN_PROGRESS = 'IN_PROGRESS', // Legacy - treated as FIRST_HALF
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(GameStatus, {
  name: 'GameStatus',
  description: 'The status of a game',
});

@ObjectType()
@Entity('games')
export class Game extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  gameFormatId: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  name?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  scheduledStart?: Date;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  venue?: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  weatherConditions?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field(() => GameStatus)
  @Column({
    type: 'varchar',
    length: 20,
    default: GameStatus.SCHEDULED,
  })
  status: GameStatus;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  actualStart?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  firstHalfEnd?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  secondHalfStart?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  actualEnd?: Date;

  @Field({
    nullable: true,
    description: 'When the game clock was paused (null = not paused)',
  })
  @Column({ type: 'timestamp', nullable: true })
  pausedAt?: Date;

  @Field(() => GameFormat)
  @ManyToOne(() => GameFormat, (gameFormat) => gameFormat.games, {
    nullable: false,
  })
  @JoinColumn({ name: 'gameFormatId' })
  gameFormat: GameFormat;

  @Field(() => [GameTeam], { nullable: true })
  @OneToMany(() => GameTeam, (gameTeam) => gameTeam.game, { cascade: true })
  gameTeams: GameTeam[];

  @Field(() => [GameEvent], { nullable: true })
  @OneToMany(() => GameEvent, (gameTeam) => gameTeam.game, { cascade: true })
  gameEvents: GameEvent[];
}

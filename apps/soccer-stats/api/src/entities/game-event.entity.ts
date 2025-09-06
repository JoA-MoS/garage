import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { Game } from './game.entity';
import { GameTeam } from './game-team.entity';
import { Player } from './player.entity';
import { EventType } from './event-type.entity';

@ObjectType()
@Entity('game_events')
export class GameEvent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  minute: number;

  @Field(() => Int)
  @Column({ type: 'int' })
  timestamp: number;

  @Field()
  @CreateDateColumn()
  realTime: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: object;

  @Field(() => EventType)
  @ManyToOne(() => EventType, { onDelete: 'CASCADE' })
  eventType: EventType;

  @Field()
  @Column('uuid')
  eventTypeId: string;

  @Field(() => Game)
  @ManyToOne(() => Game, (game) => game.gameEvents, { onDelete: 'CASCADE' })
  game: Game;

  @Field()
  @Column('uuid')
  gameId: string;

  @Field(() => GameTeam)
  @ManyToOne(() => GameTeam, { onDelete: 'CASCADE' })
  gameTeam: GameTeam;

  @Field()
  @Column('uuid')
  gameTeamId: string;

  @Field(() => Player)
  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  player: Player;

  @Field()
  @Column('uuid')
  playerId: string;

  @Field(() => Player, { nullable: true })
  @ManyToOne(() => Player, { nullable: true, onDelete: 'SET NULL' })
  relatedPlayer?: Player;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  relatedPlayerId?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

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

@ObjectType()
@Entity('game_participations')
export class GameParticipation {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  startMinute: number; // When player entered the game

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  endMinute?: number; // When player left the game

  @Field()
  @Column({ type: 'boolean', default: false })
  isStarter: boolean;

  @Field()
  @Column({ type: 'boolean', default: false })
  isOnField: boolean;

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  minutesPlayed: number; // Total minutes played

  @Field(() => Game)
  @ManyToOne(() => Game, (game) => game.participations, { onDelete: 'CASCADE' })
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
  @ManyToOne(() => Player, (player) => player.participations, {
    onDelete: 'CASCADE',
  })
  player: Player;

  @Field()
  @Column('uuid')
  playerId: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Game } from './game.entity';
import { Team } from './team.entity';
import { GameEvent } from './game-event.entity';

@ObjectType()
@Entity('game_teams')
export class GameTeam extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  gameId: string;

  @Field(() => ID)
  @Column('uuid')
  teamId: string;

  @Field()
  @Column({ length: 10 })
  teamType: string; // 'home' or 'away'

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  formation?: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  finalScore?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  tacticalNotes?: string;

  @Field(() => Game)
  @ManyToOne(() => Game, (game) => game.gameTeams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.gameTeams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Field(() => [GameEvent])
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.gameTeam, {
    cascade: true,
  })
  gameEvents: GameEvent[];
}

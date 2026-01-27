import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Game } from './game.entity';
import { Team } from './team.entity';
import { GameEvent } from './game-event.entity';
import { StatsTrackingLevel } from './team-configuration.entity';

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

  @Field(() => StatsTrackingLevel, {
    nullable: true,
    description:
      'Override stats tracking level for this team in this game (null = use game or team default)',
  })
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  statsTrackingLevel?: StatsTrackingLevel;

  @Field(() => Game)
  @ManyToOne(() => Game, (game) => game.teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.games, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Field(() => [GameEvent], { nullable: true })
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.gameTeam, {
    cascade: true,
  })
  events: GameEvent[];
}

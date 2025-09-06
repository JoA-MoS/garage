import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { Game } from './game.entity';
import { Team } from './team.entity';
import { GameEvent } from './game-event.entity';
import { GameParticipation } from './game-participation.entity';

@ObjectType()
@Entity('game_teams')
export class GameTeam {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'boolean', default: true })
  isHome: boolean;

  @Field({ nullable: true })
  @Column({ length: 100, nullable: true })
  formation?: string;

  @Field(() => Game)
  @ManyToOne(() => Game, (game) => game.gameTeams, { onDelete: 'CASCADE' })
  game: Game;

  @Field()
  @Column('uuid')
  gameId: string;

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.gameTeams, { onDelete: 'CASCADE' })
  team: Team;

  @Field()
  @Column('uuid')
  teamId: string;

  @Field(() => [GameEvent])
  @OneToMany(() => GameEvent, (gameEvent) => gameEvent.gameTeam, {
    cascade: true,
  })
  gameEvents: GameEvent[];

  @Field(() => [GameParticipation])
  @OneToMany(
    () => GameParticipation,
    (participation) => participation.gameTeam,
    { cascade: true }
  )
  gameParticipations: GameParticipation[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

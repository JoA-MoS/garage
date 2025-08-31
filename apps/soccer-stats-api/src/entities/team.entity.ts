import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { GameTeam } from './game-team.entity';
import { TeamPlayer } from './team-player.entity';

@ObjectType()
@Entity('teams')
export class Team {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 255 })
  name: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  logo?: string;

  @Field({ nullable: true })
  @Column({ length: 100, nullable: true })
  colors?: string;

  @Field(() => [GameTeam])
  @OneToMany(() => GameTeam, (gameTeam) => gameTeam.team, { cascade: true })
  gameTeams: GameTeam[];

  @Field(() => [TeamPlayer])
  @OneToMany(() => TeamPlayer, (teamPlayer) => teamPlayer.team, {
    cascade: true,
  })
  teamPlayers: TeamPlayer[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

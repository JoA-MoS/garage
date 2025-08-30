import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { Team } from './team.entity';
import { Player } from './player.entity';

@ObjectType()
@Entity('team_players')
export class TeamPlayer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  jersey: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  depthRank: number;

  @Field()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field()
  @CreateDateColumn()
  joinedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  leftAt?: Date;

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.teamPlayers, { onDelete: 'CASCADE' })
  team: Team;

  @Field()
  @Column('uuid')
  teamId: string;

  @Field(() => Player)
  @ManyToOne(() => Player, (player) => player.teamPlayers, {
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

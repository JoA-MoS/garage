import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Team } from './team.entity';
import { User } from './user.entity';

@ObjectType()
@Entity('team_players')
export class TeamPlayer extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  teamId: string;

  @Field(() => ID)
  @Column('uuid')
  userId: string;

  @Field({ nullable: true })
  @Column({ length: 10, nullable: true })
  jerseyNumber?: string;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  primaryPosition?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  joinedDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  leftDate?: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.teamPlayers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.teamPlayers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}

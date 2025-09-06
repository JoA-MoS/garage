import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Team } from './team.entity';
import { User } from './user.entity';

@ObjectType()
@Entity('team_coaches')
export class TeamCoach extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  teamId: string;

  @Field(() => ID)
  @Column('uuid')
  userId: string;

  @Field()
  @Column({ length: 100, default: 'Head Coach' })
  role: string;

  @Field()
  @Column({ type: 'date' })
  startDate: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.teamCoaches)
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.teamCoaches)
  @JoinColumn({ name: 'userId' })
  user: User;
}

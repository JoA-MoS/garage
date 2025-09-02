import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

import { User } from './user.entity';
import { Team } from './team.entity';

export enum TeamRole {
  ADMIN = 'admin',
  COACH = 'coach', 
  ASSISTANT_COACH = 'assistant_coach',
  TEAM_MANAGER = 'team_manager',
  PLAYER = 'player',
}

registerEnumType(TeamRole, {
  name: 'TeamRole',
  description: 'Role hierarchy for team management',
});

@ObjectType()
@Entity('user_team_roles')
@Unique(['user', 'team']) // One role per user per team
export class UserTeamRole {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.userTeamRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => Team)
  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Field(() => TeamRole)
  @Column({
    type: 'enum',
    enum: TeamRole,
    default: TeamRole.PLAYER,
  })
  role: TeamRole;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
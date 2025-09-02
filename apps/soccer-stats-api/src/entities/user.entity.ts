import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { UserTeamRole } from './user-team-role.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 255, unique: true })
  clerkId: string;

  @Field()
  @Column({ length: 255 })
  email: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @Column({ length: 255, nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  @Column({ length: 500, nullable: true })
  profileImageUrl?: string;

  @Field(() => [UserTeamRole])
  @OneToMany(() => UserTeamRole, (userTeamRole) => userTeamRole.user, {
    cascade: true,
  })
  userTeamRoles: UserTeamRole[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
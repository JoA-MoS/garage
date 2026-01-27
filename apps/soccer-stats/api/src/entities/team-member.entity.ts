import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Team } from './team.entity';
import { User } from './user.entity';
import { TeamMemberRole } from './team-member-role.entity';

/**
 * Team membership roles for access control.
 * @see FEATURE_ROADMAP.md section 1.1 Team Access Management
 */
export enum TeamRole {
  /** Team owner - full control, can transfer ownership */
  OWNER = 'OWNER',
  /** Team manager - administrative access, game scheduling */
  MANAGER = 'MANAGER',
  /** Team coach - roster management, game events */
  COACH = 'COACH',
  /** Guest coach - temporary coaching access, can be promoted to COACH */
  GUEST_COACH = 'GUEST_COACH',
  /** Team player - view own stats */
  PLAYER = 'PLAYER',
  /** Guardian of a minor player - can update player contact info */
  GUARDIAN = 'GUARDIAN',
  /** Fan/supporter - view-only access */
  FAN = 'FAN',
}

registerEnumType(TeamRole, {
  name: 'TeamRole',
  description: 'Role of a user within a team',
});

/**
 * Represents a user's membership within a team.
 * This is the central entity for team-based access control.
 *
 * Design:
 * - One TeamMember record per (user, team) combination
 * - A user can have multiple roles via TeamMemberRole (e.g., player-coach)
 * - Membership-level data (join date, active status) lives here
 * - Role-specific data (jersey number, coach title) lives in TeamMemberRole
 *
 * Key relationships:
 * - Each team has exactly one OWNER role (enforced via TeamMemberRole)
 * - A user's roles are accessed via the `roles` relation
 */
@ObjectType()
@Entity('team_members')
@Index('idx_team_member_unique', ['teamId', 'userId'], { unique: true })
export class TeamMember extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  teamId: string;

  @Field(() => ID)
  @Column('uuid')
  userId: string;

  // ============================================================
  // Membership status fields
  // ============================================================

  /**
   * When the user joined (or was added to) the team.
   */
  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  joinedDate?: Date;

  /**
   * When the user left the team (null if still active).
   */
  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  leftDate?: Date;

  /**
   * Whether this membership is currently active.
   */
  @Field()
  @Column({ default: true })
  isActive: boolean;

  // ============================================================
  // Invitation tracking fields
  // ============================================================

  /**
   * User who invited this team member.
   */
  @Field(() => ID, { nullable: true })
  @Column('uuid', { nullable: true })
  invitedById?: string;

  /**
   * When the invitation was sent.
   */
  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  invitedAt?: Date;

  /**
   * When the user accepted the invitation and joined the team.
   */
  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  // ============================================================
  // Relations
  // ============================================================

  @Field(() => Team)
  @ManyToOne(() => Team, (team) => team.teamMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.teamMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invitedById' })
  invitedBy?: User;

  /**
   * The roles this member holds within the team.
   * A member can have multiple roles (e.g., PLAYER + COACH).
   */
  @Field(() => [TeamMemberRole], { nullable: true })
  @OneToMany(() => TeamMemberRole, (role) => role.teamMember, { cascade: true })
  roles?: TeamMemberRole[];
}

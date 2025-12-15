import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { Team } from './team.entity';
import { User } from './user.entity';

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
  /** Team player - view own stats */
  PLAYER = 'PLAYER',
  /** Parent or fan - view-only access, linked to player(s) */
  PARENT_FAN = 'PARENT_FAN',
}

registerEnumType(TeamRole, {
  name: 'TeamRole',
  description: 'Role of a user within a team',
});

/**
 * Represents a user's membership and role within a team.
 * This is the central entity for team-based access control.
 *
 * Key relationships:
 * - Each team has exactly one OWNER
 * - Parents/fans are linked to specific players via linkedPlayerId
 * - Guest coaches have isGuest=true
 */
@ObjectType()
@Entity('team_members')
@Index('idx_team_member_unique', ['teamId', 'userId'], { unique: true }) // User can only have one role per team
export class TeamMember extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  teamId: string;

  @Field(() => ID)
  @Column('uuid')
  userId: string;

  @Field(() => TeamRole)
  @Column({
    type: 'enum',
    enum: TeamRole,
  })
  role: TeamRole;

  /**
   * For PARENT_FAN role: the player this parent/fan is linked to.
   * Access to the team is granted through this player link.
   * A parent can have multiple TeamMember records for multiple children.
   */
  @Field(() => ID, { nullable: true })
  @Column('uuid', { nullable: true })
  linkedPlayerId?: string;

  /**
   * Indicates if this is a guest coach (temporary access).
   * Guest coaches can be promoted to full coaches by owner/manager.
   */
  @Field()
  @Column({ default: false })
  isGuest: boolean;

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
  @Column({ type: 'timestamp', nullable: true })
  invitedAt?: Date;

  /**
   * When the user accepted the invitation and joined the team.
   */
  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  // Relations

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
  @JoinColumn({ name: 'linkedPlayerId' })
  linkedPlayer?: User;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invitedById' })
  invitedBy?: User;
}

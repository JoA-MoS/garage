import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { BaseEntity } from './base.entity';
import { TeamMember, TeamRole } from './team-member.entity';

/**
 * Role-specific data stored in the roleData JSONB column.
 *
 * Each role type can have different fields:
 * - PLAYER: { jerseyNumber?: string, primaryPosition?: string }
 * - COACH: { title?: string }
 * - GUEST_COACH: { title?: string }
 * - GUARDIAN: { linkedPlayerId: string } - required, links to minor player
 * - FAN: { linkedPlayerId?: string } - optional, can be linked to player or just team
 * - OWNER, MANAGER: typically empty {}
 */
export interface PlayerRoleData {
  jerseyNumber?: string;
  primaryPosition?: string;
}

export interface CoachRoleData {
  title?: string;
}

export interface GuardianRoleData {
  linkedPlayerId: string; // Required - guardian must be linked to a minor player
}

export interface FanRoleData {
  linkedPlayerId?: string; // Optional - fan can be linked to player or just follow team
}

export type RoleData =
  | PlayerRoleData
  | CoachRoleData
  | GuardianRoleData
  | FanRoleData
  | Record<string, never>;

/**
 * Represents a specific role a team member holds within a team.
 *
 * A single TeamMember (user + team) can have multiple roles (e.g., player-coach).
 * Role-specific data is stored in the polymorphic `roleData` JSONB column.
 *
 * Examples:
 * - PLAYER role: { jerseyNumber: "10", primaryPosition: "Forward" }
 * - COACH role: { title: "Head Coach" }
 * - GUEST_COACH role: { title: "Assistant" }
 * - GUARDIAN role: { linkedPlayerId: "uuid-of-minor-player" }
 * - FAN role: { linkedPlayerId?: "uuid-of-player" } or {}
 * - OWNER/MANAGER roles: {}
 */
@ObjectType()
@Entity('team_member_roles')
@Index('idx_team_member_role_unique', ['teamMemberId', 'role'], {
  unique: true,
})
@Index('idx_team_member_role_team_member', ['teamMemberId'])
export class TeamMemberRole extends BaseEntity {
  @Field(() => ID)
  @Column('uuid')
  teamMemberId: string;

  @Field(() => TeamRole)
  @Column({
    type: 'enum',
    enum: TeamRole,
    enumName: 'team_members_role_enum',
  })
  role: TeamRole;

  /**
   * Polymorphic role-specific data stored as JSONB.
   *
   * Structure depends on role:
   * - PLAYER: { jerseyNumber?: string, primaryPosition?: string }
   * - COACH/GUEST_COACH: { title?: string }
   * - GUARDIAN: { linkedPlayerId: string }
   * - FAN: { linkedPlayerId?: string }
   * - OWNER/MANAGER: {}
   *
   * Note: Not directly exposed in GraphQL. Use computed fields in resolvers
   * (jerseyNumber, primaryPosition, coachTitle, linkedPlayerId) for type-safe access.
   */
  @Column({ type: 'jsonb', default: {} })
  roleData: RoleData;

  // ============================================================
  // Relations
  // ============================================================

  @Field(() => TeamMember)
  @ManyToOne(() => TeamMember, (teamMember) => teamMember.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teamMemberId' })
  teamMember: TeamMember;

  // ============================================================
  // GraphQL computed fields from roleData
  // ============================================================

  /**
   * Jersey number (PLAYER role only).
   */
  @Field(() => String, {
    nullable: true,
    description: 'Jersey number (PLAYER role only)',
  })
  get jerseyNumber(): string | null {
    if (this.role !== TeamRole.PLAYER) return null;
    return (this.roleData as PlayerRoleData).jerseyNumber ?? null;
  }

  /**
   * Primary position (PLAYER role only).
   */
  @Field(() => String, {
    nullable: true,
    description: 'Primary position (PLAYER role only)',
  })
  get primaryPosition(): string | null {
    if (this.role !== TeamRole.PLAYER) return null;
    return (this.roleData as PlayerRoleData).primaryPosition ?? null;
  }

  /**
   * Coach title (COACH/GUEST_COACH role only).
   */
  @Field(() => String, {
    nullable: true,
    description: 'Coach title (COACH/GUEST_COACH role only)',
  })
  get coachTitle(): string | null {
    if (this.role !== TeamRole.COACH && this.role !== TeamRole.GUEST_COACH)
      return null;
    return (this.roleData as CoachRoleData).title ?? null;
  }

  /**
   * Linked player ID (GUARDIAN or FAN role).
   */
  @Field(() => ID, {
    nullable: true,
    description: 'Linked player user ID (GUARDIAN/FAN roles)',
  })
  get linkedPlayerId(): string | null {
    if (this.role === TeamRole.GUARDIAN) {
      return (this.roleData as GuardianRoleData).linkedPlayerId ?? null;
    }
    if (this.role === TeamRole.FAN) {
      return (this.roleData as FanRoleData).linkedPlayerId ?? null;
    }
    return null;
  }

  // ============================================================
  // Convenience getters for type-safe access to roleData
  // ============================================================

  /**
   * Get player-specific data (jerseyNumber, primaryPosition).
   * Returns null if this is not a PLAYER role.
   */
  get playerData(): PlayerRoleData | null {
    if (this.role !== TeamRole.PLAYER) return null;
    return this.roleData as PlayerRoleData;
  }

  /**
   * Get coach-specific data (title).
   * Returns null if this is not a COACH or GUEST_COACH role.
   */
  get coachData(): CoachRoleData | null {
    if (this.role !== TeamRole.COACH && this.role !== TeamRole.GUEST_COACH)
      return null;
    return this.roleData as CoachRoleData;
  }

  /**
   * Get guardian-specific data (linkedPlayerId).
   * Returns null if this is not a GUARDIAN role.
   */
  get guardianData(): GuardianRoleData | null {
    if (this.role !== TeamRole.GUARDIAN) return null;
    return this.roleData as GuardianRoleData;
  }

  /**
   * Get fan-specific data (linkedPlayerId).
   * Returns null if this is not a FAN role.
   */
  get fanData(): FanRoleData | null {
    if (this.role !== TeamRole.FAN) return null;
    return this.roleData as FanRoleData;
  }
}

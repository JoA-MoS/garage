import { SetMetadata } from '@nestjs/common';

import { TeamRole } from '../../entities/team-member.entity';

export const TEAM_ROLES_KEY = 'teamRoles';

/**
 * Metadata for team role requirements.
 */
export interface TeamRoleMetadata {
  /** Required roles (user must have one of these or higher) */
  roles: TeamRole[];
  /** Argument name containing the team ID (default: 'teamId') */
  teamIdArg?: string;
  /** Nested path to team ID in input objects (e.g., 'addPlayerToTeamInput.teamId') */
  teamIdPath?: string;
}

/**
 * Decorator to require specific team roles for a resolver method.
 * Used with TeamAccessGuard to enforce role-based access control.
 *
 * @param roles - Array of required roles. User must have at least one of these roles.
 *                Role ordering: OWNER > MANAGER > COACH > GUEST_COACH > PLAYER > GUARDIAN > FAN
 * @param options - Optional configuration for teamId extraction
 *
 * @example
 * // Require OWNER or MANAGER role, teamId from 'teamId' arg
 * @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER])
 *
 * @example
 * // Require COACH or higher, teamId from 'id' arg
 * @RequireTeamRole([TeamRole.COACH], { teamIdArg: 'id' })
 *
 * @example
 * // Require COACH or higher, teamId from nested input object
 * @RequireTeamRole([TeamRole.COACH], { teamIdPath: 'addPlayerToTeamInput.teamId' })
 */
export const RequireTeamRole = (
  roles: TeamRole[],
  options?: { teamIdArg?: string; teamIdPath?: string },
) =>
  SetMetadata<string, TeamRoleMetadata>(TEAM_ROLES_KEY, {
    roles,
    teamIdArg: options?.teamIdArg,
    teamIdPath: options?.teamIdPath,
  });

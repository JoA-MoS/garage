import { SetMetadata } from '@nestjs/common';

import { TeamRole } from '../../entities/team-member.entity';

export const GAME_EVENT_ROLES_KEY = 'gameEventRoles';

/**
 * Metadata for game event role requirements.
 */
export interface GameEventRoleMetadata {
  /** Required roles (user must have one of these or higher) */
  roles: TeamRole[];
  /** Argument name containing the game event ID (default: 'gameEventId') */
  gameEventIdArg?: string;
  /** Argument name containing the game team ID (for mutations that operate on gameTeamId) */
  gameTeamIdArg?: string;
  /** Nested path to game event ID in input objects (e.g., 'input.gameEventId') */
  gameEventIdPath?: string;
  /** Nested path to game team ID in input objects (e.g., 'input.gameTeamId') */
  gameTeamIdPath?: string;
}

/**
 * Decorator to require specific team roles for a game event resolver method.
 * Used with GameEventAccessGuard to enforce role-based access control.
 *
 * The guard traces from gameEventId → GameEvent → GameTeam → Team,
 * or from gameTeamId → GameTeam → Team, then checks the user's role in that team.
 *
 * @param roles - Array of required roles. User must have at least one of these roles.
 *                Role hierarchy is respected (OWNER > MANAGER > COACH > PLAYER > PARENT_FAN).
 * @param options - Optional configuration for ID extraction
 *
 * @example
 * // Require COACH or higher, gameEventId from 'gameEventId' arg
 * @RequireGameEventRole([TeamRole.COACH])
 *
 * @example
 * // Require COACH or higher, gameEventId from nested input object
 * @RequireGameEventRole([TeamRole.COACH], { gameEventIdPath: 'input.gameEventId' })
 *
 * @example
 * // Require COACH or higher, gameTeamId from 'gameTeamId' arg
 * @RequireGameEventRole([TeamRole.COACH], { gameTeamIdArg: 'gameTeamId' })
 */
export const RequireGameEventRole = (
  roles: TeamRole[],
  options?: {
    gameEventIdArg?: string;
    gameTeamIdArg?: string;
    gameEventIdPath?: string;
    gameTeamIdPath?: string;
  }
) =>
  SetMetadata<string, GameEventRoleMetadata>(GAME_EVENT_ROLES_KEY, {
    roles,
    gameEventIdArg: options?.gameEventIdArg,
    gameTeamIdArg: options?.gameTeamIdArg,
    gameEventIdPath: options?.gameEventIdPath,
    gameTeamIdPath: options?.gameTeamIdPath,
  });

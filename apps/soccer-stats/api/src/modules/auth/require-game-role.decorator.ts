import { SetMetadata } from '@nestjs/common';

import { TeamRole } from '../../entities/team-member.entity';

export const GAME_ROLES_KEY = 'gameRoles';

/**
 * Metadata for game role requirements.
 */
export interface GameRoleMetadata {
  /** Required roles (user must have one of these or higher) */
  roles: TeamRole[];
  /** Argument name containing the game ID (default: 'id') */
  gameIdArg?: string;
  /** Nested path to game ID in input objects (e.g., 'updateGameInput.id') */
  gameIdPath?: string;
  /** Nested path to home team ID in input objects (e.g., 'createGameInput.homeTeamId') */
  homeTeamIdPath?: string;
  /**
   * If true, user only needs role in home team.
   * If false, user can have role in either team (home or away).
   * Defaults to false.
   */
  requireHomeTeam?: boolean;
}

/**
 * Decorator to require specific team roles for a game resolver method.
 * Used with GameAccessGuard to enforce role-based access control.
 *
 * For create operations, the guard uses homeTeamId from the input.
 * For update/delete operations, the guard looks up the game and checks
 * the user's role in either the home or away team.
 *
 * @param roles - Array of required roles. User must have at least one of these roles.
 *                Role hierarchy is respected (OWNER > MANAGER > COACH > PLAYER > PARENT_FAN).
 * @param options - Optional configuration for ID extraction and team checking
 *
 * @example
 * // Require OWNER or MANAGER of home team for creating games
 * @RequireGameRole([TeamRole.OWNER, TeamRole.MANAGER], {
 *   homeTeamIdPath: 'createGameInput.homeTeamId',
 *   requireHomeTeam: true
 * })
 *
 * @example
 * // Require COACH or higher in either team for updating games
 * @RequireGameRole([TeamRole.COACH], { gameIdArg: 'id' })
 */
export const RequireGameRole = (
  roles: TeamRole[],
  options?: {
    gameIdArg?: string;
    gameIdPath?: string;
    homeTeamIdPath?: string;
    requireHomeTeam?: boolean;
  }
) =>
  SetMetadata<string, GameRoleMetadata>(GAME_ROLES_KEY, {
    roles,
    gameIdArg: options?.gameIdArg,
    gameIdPath: options?.gameIdPath,
    homeTeamIdPath: options?.homeTeamIdPath,
    requireHomeTeam: options?.requireHomeTeam ?? false,
  });

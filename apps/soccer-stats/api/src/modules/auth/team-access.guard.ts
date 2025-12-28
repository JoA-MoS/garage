import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';

import { TeamMembersService } from '../team-members/team-members.service';
import { UsersService } from '../users/users.service';
import { TeamRole } from '../../entities/team-member.entity';

import {
  TEAM_ROLES_KEY,
  TeamRoleMetadata,
} from './require-team-role.decorator';
import { ClerkUser } from './clerk.service';

/**
 * Role hierarchy for team access control.
 * Higher values indicate more permissions.
 * A user with OWNER role can perform any action that MANAGER, COACH, etc. can perform.
 */
const ROLE_HIERARCHY: Record<TeamRole, number> = {
  [TeamRole.OWNER]: 5,
  [TeamRole.MANAGER]: 4,
  [TeamRole.COACH]: 3,
  [TeamRole.PLAYER]: 2,
  [TeamRole.PARENT_FAN]: 1,
};

/**
 * Guard that checks if the current user has the required team role.
 *
 * This guard should be used after ClerkAuthGuard to ensure the user is authenticated.
 * It reads the @RequireTeamRole metadata to determine required roles and how to extract
 * the teamId from the request.
 *
 * @example
 * @Mutation(() => Team)
 * @UseGuards(ClerkAuthGuard, TeamAccessGuard)
 * @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER])
 * async updateTeam(@Args('id') id: string, ...) { ... }
 */
@Injectable()
export class TeamAccessGuard implements CanActivate {
  private readonly logger = new Logger(TeamAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly teamMembersService: TeamMembersService,
    private readonly usersService: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<TeamRoleMetadata>(
      TEAM_ROLES_KEY,
      context.getHandler()
    );

    // If no role metadata, allow access (method doesn't require team roles)
    if (!metadata || !metadata.roles || metadata.roles.length === 0) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();
    const args = gqlContext.getArgs();

    // Get the authenticated user from the request (set by ClerkAuthGuard)
    const clerkUser: ClerkUser = req.user;
    if (!clerkUser) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract teamId from args
    const teamId = this.extractTeamId(args, metadata);
    if (!teamId) {
      this.logger.warn(
        `TeamAccessGuard: Could not extract teamId from args. Metadata: ${JSON.stringify(
          metadata
        )}`
      );
      throw new ForbiddenException('Team ID not found in request');
    }

    // Look up internal user by email (Clerk ID != internal UUID)
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      throw new ForbiddenException('User email not found');
    }

    const internalUser = await this.usersService.findByEmail(email);
    if (!internalUser) {
      this.logger.debug(`No internal user found for email ${email}`);
      throw new ForbiddenException('User not registered in the system');
    }

    // Get user's role in the team using internal user ID
    const membership = await this.teamMembersService.findUserRoleInTeam(
      internalUser.id,
      teamId
    );

    if (!membership) {
      this.logger.debug(
        `User ${internalUser.id} is not a member of team ${teamId}`
      );
      throw new ForbiddenException('You are not a member of this team');
    }

    // Check if user has at least one of the required roles (or higher)
    const userRoleLevel = ROLE_HIERARCHY[membership.role];
    const hasRequiredRole = metadata.roles.some((requiredRole) => {
      const requiredLevel = ROLE_HIERARCHY[requiredRole];
      return userRoleLevel >= requiredLevel;
    });

    if (!hasRequiredRole) {
      this.logger.debug(
        `User ${internalUser.id} with role ${
          membership.role
        } does not have required roles: ${metadata.roles.join(', ')}`
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required role: ${this.getLowestRequiredRole(
          metadata.roles
        )} or higher`
      );
    }

    this.logger.debug(
      `User ${internalUser.id} with role ${membership.role} granted access to team ${teamId}`
    );

    return true;
  }

  /**
   * Extracts the teamId from GraphQL args based on metadata configuration.
   */
  private extractTeamId(
    args: Record<string, unknown>,
    metadata: TeamRoleMetadata
  ): string | undefined {
    // If teamIdPath is specified, navigate the nested path
    if (metadata.teamIdPath) {
      const parts = metadata.teamIdPath.split('.');
      let value: unknown = args;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
      return typeof value === 'string' ? value : undefined;
    }

    // If teamIdArg is specified, use that argument name
    if (metadata.teamIdArg) {
      const value = args[metadata.teamIdArg];
      return typeof value === 'string' ? value : undefined;
    }

    // Default: look for 'teamId' in common locations
    if (args.teamId && typeof args.teamId === 'string') {
      return args.teamId;
    }

    // Check 'id' as fallback for team-specific operations
    if (args.id && typeof args.id === 'string') {
      return args.id;
    }

    return undefined;
  }

  /**
   * Gets the lowest (most permissive) required role from the list.
   */
  private getLowestRequiredRole(roles: TeamRole[]): TeamRole {
    let lowestRole = roles[0];
    let lowestLevel = ROLE_HIERARCHY[lowestRole];

    for (const role of roles) {
      const level = ROLE_HIERARCHY[role];
      if (level < lowestLevel) {
        lowestLevel = level;
        lowestRole = role;
      }
    }

    return lowestRole;
  }
}

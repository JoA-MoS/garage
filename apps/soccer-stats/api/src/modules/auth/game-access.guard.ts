import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Game } from '../../entities/game.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { TeamRole } from '../../entities/team-member.entity';
import { TeamMembersService } from '../team-members/team-members.service';
import { UsersService } from '../users/users.service';

import {
  GAME_ROLES_KEY,
  GameRoleMetadata,
} from './require-game-role.decorator';
import { ClerkUser } from './clerk.service';

/**
 * Role hierarchy for team access control.
 * Higher values indicate more permissions.
 */
const ROLE_HIERARCHY: Record<TeamRole, number> = {
  [TeamRole.OWNER]: 5,
  [TeamRole.MANAGER]: 4,
  [TeamRole.COACH]: 3,
  [TeamRole.PLAYER]: 2,
  [TeamRole.PARENT_FAN]: 1,
};

/**
 * Guard that checks if the current user has the required team role for game operations.
 *
 * For create operations, it checks the user's role in the home team (via homeTeamIdPath).
 * For update/delete operations, it looks up the game and checks the user's role in
 * either the home or away team (unless requireHomeTeam is set).
 *
 * Should be used after ClerkAuthGuard to ensure the user is authenticated.
 *
 * @example
 * @Mutation(() => Game)
 * @UseGuards(ClerkAuthGuard, GameAccessGuard)
 * @RequireGameRole([TeamRole.OWNER, TeamRole.MANAGER], {
 *   homeTeamIdPath: 'createGameInput.homeTeamId',
 *   requireHomeTeam: true
 * })
 * async createGame(@Args('createGameInput') input: CreateGameInput) { ... }
 */
@Injectable()
export class GameAccessGuard implements CanActivate {
  private readonly logger = new Logger(GameAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly teamMembersService: TeamMembersService,
    private readonly usersService: UsersService,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>
  ) {}

  /**
   * Converts a Clerk user to internal user ID by looking up via email.
   */
  private async getInternalUserId(clerkUser: ClerkUser): Promise<string> {
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      throw new BadRequestException('User email not found');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException(
        `No internal user found for email ${email}`
      );
    }

    return user.id;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<GameRoleMetadata>(
      GAME_ROLES_KEY,
      context.getHandler()
    );

    // If no role metadata, allow access (method doesn't require game roles)
    if (!metadata || !metadata.roles || metadata.roles.length === 0) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();
    const args = gqlContext.getArgs();

    // Get the authenticated user from the request (set by ClerkAuthGuard)
    const user: ClerkUser = req.user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Collect team IDs to check
    let teamIds: string[] = [];

    // Try homeTeamIdPath first (for create operations)
    if (metadata.homeTeamIdPath) {
      const homeTeamId = this.extractFromPath(args, metadata.homeTeamIdPath);
      if (homeTeamId) {
        teamIds = [homeTeamId];
      }
    }

    // If no home team ID, try to get teams from game ID
    if (teamIds.length === 0) {
      const gameId = this.extractGameId(args, metadata);
      if (gameId) {
        const teams = await this.getTeamsFromGame(
          gameId,
          metadata.requireHomeTeam
        );
        teamIds = teams;
      }
    }

    if (teamIds.length === 0) {
      this.logger.warn(
        `GameAccessGuard: Could not extract team IDs from args. Metadata: ${JSON.stringify(
          metadata
        )}`
      );
      throw new ForbiddenException('Team ID not found in request');
    }

    // Convert Clerk user ID to internal user ID
    const internalUserId = await this.getInternalUserId(user);

    // Check if user has required role in any of the teams
    let bestMembership: { role: TeamRole; teamId: string } | null = null;

    for (const teamId of teamIds) {
      const membership = await this.teamMembersService.findUserRoleInTeam(
        internalUserId,
        teamId
      );

      if (membership) {
        if (
          !bestMembership ||
          ROLE_HIERARCHY[membership.role] > ROLE_HIERARCHY[bestMembership.role]
        ) {
          bestMembership = { role: membership.role, teamId };
        }
      }
    }

    if (!bestMembership) {
      this.logger.debug(
        `User ${internalUserId} is not a member of any team: ${teamIds.join(
          ', '
        )}`
      );
      throw new ForbiddenException(
        'You are not a member of any team involved in this game'
      );
    }

    // Check if user has at least one of the required roles (or higher)
    const userRoleLevel = ROLE_HIERARCHY[bestMembership.role];
    const hasRequiredRole = metadata.roles.some((requiredRole) => {
      const requiredLevel = ROLE_HIERARCHY[requiredRole];
      return userRoleLevel >= requiredLevel;
    });

    if (!hasRequiredRole) {
      this.logger.debug(
        `User ${internalUserId} with role ${
          bestMembership.role
        } does not have required roles: ${metadata.roles.join(', ')}`
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required role: ${this.getLowestRequiredRole(
          metadata.roles
        )} or higher`
      );
    }

    this.logger.debug(
      `User ${internalUserId} with role ${bestMembership.role} granted access to team ${bestMembership.teamId}`
    );

    return true;
  }

  /**
   * Get team IDs from a game.
   * Returns home team only if requireHomeTeam is true, otherwise returns both.
   */
  private async getTeamsFromGame(
    gameId: string,
    requireHomeTeam?: boolean
  ): Promise<string[]> {
    const gameTeams = await this.gameTeamRepository.find({
      where: { gameId },
    });

    if (requireHomeTeam) {
      const homeTeam = gameTeams.find((gt) => gt.teamType === 'home');
      return homeTeam ? [homeTeam.teamId] : [];
    }

    return gameTeams.map((gt) => gt.teamId);
  }

  /**
   * Extract game ID from args.
   */
  private extractGameId(
    args: Record<string, unknown>,
    metadata: GameRoleMetadata
  ): string | undefined {
    // Try path first
    if (metadata.gameIdPath) {
      return this.extractFromPath(args, metadata.gameIdPath);
    }

    // Then try the argument name
    const argName = metadata.gameIdArg || 'id';
    const value = args[argName];
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Extracts a value from a nested path in args.
   */
  private extractFromPath(
    args: Record<string, unknown>,
    path: string
  ): string | undefined {
    const parts = path.split('.');
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

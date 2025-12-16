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

import { GameEvent } from '../../entities/game-event.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { TeamRole } from '../../entities/team-member.entity';
import { TeamMembersService } from '../team-members/team-members.service';
import { UsersService } from '../users/users.service';

import {
  GAME_EVENT_ROLES_KEY,
  GameEventRoleMetadata,
} from './require-game-event-role.decorator';
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
 * Guard that checks if the current user has the required team role for game event operations.
 *
 * This guard traces from gameEventId → GameEvent → GameTeam → Team (or gameTeamId → GameTeam → Team),
 * then checks if the user has the required role in that team.
 *
 * Should be used after ClerkAuthGuard to ensure the user is authenticated.
 *
 * @example
 * @Mutation(() => Boolean)
 * @UseGuards(ClerkAuthGuard, GameEventAccessGuard)
 * @RequireGameEventRole([TeamRole.COACH])
 * async deleteGoal(@Args('gameEventId') gameEventId: string) { ... }
 */
@Injectable()
export class GameEventAccessGuard implements CanActivate {
  private readonly logger = new Logger(GameEventAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly teamMembersService: TeamMembersService,
    private readonly usersService: UsersService,
    @InjectRepository(GameEvent)
    private readonly gameEventRepository: Repository<GameEvent>,
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
    const metadata = this.reflector.get<GameEventRoleMetadata>(
      GAME_EVENT_ROLES_KEY,
      context.getHandler()
    );

    // If no role metadata, allow access (method doesn't require game event roles)
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

    // Try to get teamId from gameEventId or gameTeamId
    let teamId: string | undefined;

    // Try gameEventId first
    const gameEventId = this.extractId(args, {
      idArg: metadata.gameEventIdArg || 'gameEventId',
      idPath: metadata.gameEventIdPath,
    });

    if (gameEventId) {
      teamId = await this.getTeamIdFromGameEvent(gameEventId);
    }

    // If no gameEventId, try gameTeamId
    if (!teamId) {
      const gameTeamId = this.extractId(args, {
        idArg: metadata.gameTeamIdArg || 'gameTeamId',
        idPath: metadata.gameTeamIdPath,
      });

      if (gameTeamId) {
        teamId = await this.getTeamIdFromGameTeam(gameTeamId);
      }
    }

    if (!teamId) {
      this.logger.warn(
        `GameEventAccessGuard: Could not extract teamId from args. Metadata: ${JSON.stringify(
          metadata
        )}`
      );
      throw new ForbiddenException('Team ID not found in request');
    }

    // Convert Clerk user ID to internal user ID
    const internalUserId = await this.getInternalUserId(user);

    // Get user's role in the team
    const membership = await this.teamMembersService.findUserRoleInTeam(
      internalUserId,
      teamId
    );

    if (!membership) {
      this.logger.debug(
        `User ${internalUserId} is not a member of team ${teamId}`
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
        `User ${internalUserId} with role ${
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
      `User ${internalUserId} with role ${membership.role} granted access to team ${teamId}`
    );

    return true;
  }

  /**
   * Get team ID from a game event ID by tracing GameEvent → GameTeam → Team
   */
  private async getTeamIdFromGameEvent(
    gameEventId: string
  ): Promise<string | undefined> {
    const gameEvent = await this.gameEventRepository.findOne({
      where: { id: gameEventId },
      relations: ['gameTeam'],
    });

    if (!gameEvent?.gameTeam) {
      return undefined;
    }

    return gameEvent.gameTeam.teamId;
  }

  /**
   * Get team ID from a game team ID
   */
  private async getTeamIdFromGameTeam(
    gameTeamId: string
  ): Promise<string | undefined> {
    const gameTeam = await this.gameTeamRepository.findOne({
      where: { id: gameTeamId },
    });

    return gameTeam?.teamId;
  }

  /**
   * Extracts an ID from GraphQL args based on configuration.
   */
  private extractId(
    args: Record<string, unknown>,
    config: { idArg: string; idPath?: string }
  ): string | undefined {
    // If idPath is specified, navigate the nested path
    if (config.idPath) {
      const parts = config.idPath.split('.');
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

    // Use the argument name
    const value = args[config.idArg];
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

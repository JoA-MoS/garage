import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Args,
  Int,
} from '@nestjs/graphql';
import { Logger, NotFoundException, UseGuards } from '@nestjs/common';

import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { Game, GameStatus } from '../../entities/game.entity';
import { TeamRole } from '../../entities/team-member.entity';
import { CurrentUser } from '../auth/user.decorator';
import { ClerkUser } from '../auth/clerk.service';
import { OptionalClerkAuthGuard } from '../auth/optional-clerk-auth.guard';
import { UsersService } from '../users/users.service';
import { TeamMembersService } from '../team-members/team-members.service';
import { GamesService } from '../games/games.service';

import { MyData } from './my-data.type';

/**
 * Resolver for the `my` query - implements the Viewer pattern.
 *
 * This provides a clean entry point for user-scoped data:
 * - `my.user` - the authenticated user
 * - `my.teams` - all teams the user belongs to
 * - `my.upcomingGames` - scheduled games across all teams
 * - `my.recentGames` - completed games across all teams
 * - `my.liveGames` - games currently in progress
 *
 * Domain queries are delegated to their respective services:
 * - User queries → UsersService
 * - Team queries → TeamMembersService
 * - Game queries → GamesService
 *
 * @see FEATURE_ROADMAP.md Issue #183
 */
@Resolver(() => MyData)
@UseGuards(OptionalClerkAuthGuard)
export class MyResolver {
  private readonly logger = new Logger(MyResolver.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly teamMembersService: TeamMembersService,
    private readonly gamesService: GamesService,
  ) {}

  /**
   * Root query for user-scoped data.
   *
   * Returns null if not authenticated (no Clerk user in context).
   *
   * Implements Just-In-Time (JIT) user provisioning:
   * - If an internal user exists (by clerkId or email), returns it
   * - If no internal user exists, creates one from Clerk data
   *
   * The returned MyData contains only the userId - all other fields
   * are resolved via @ResolveField() to enable lazy loading and
   * allow clients to request only what they need.
   */
  @Query(() => MyData, {
    nullable: true,
    name: 'my',
    description:
      'Get data for the authenticated user. Returns null if not authenticated.',
  })
  async getMy(@CurrentUser() clerkUser: ClerkUser): Promise<MyData | null> {
    // Not authenticated - expected for anonymous users
    if (!clerkUser) {
      return null;
    }

    // Find or create internal user (JIT provisioning)
    const user = await this.usersService.findOrCreateByClerkUser(clerkUser);

    // Return minimal data - field resolvers will fetch the rest
    return { userId: user.id } as MyData;
  }

  @ResolveField(() => User, { description: 'The authenticated user' })
  async user(@Parent() myData: MyData): Promise<User | null> {
    try {
      return await this.usersService.findOne(myData.userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // User was deleted/deactivated between getMy and user resolution
        this.logger.warn(
          `User ${myData.userId} not found during my.user resolution`,
        );
        return null;
      }
      // Rethrow unexpected errors - don't hide database failures
      this.logger.error(
        `Failed to resolve my.user for userId ${myData.userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @ResolveField(() => [Team], {
    description: 'All teams the user belongs to',
  })
  async teams(@Parent() myData: MyData): Promise<Team[]> {
    return this.teamMembersService.findTeamsForUser(myData.userId);
  }

  @ResolveField(() => [Team], {
    description: 'Teams where the user is OWNER',
  })
  async ownedTeams(@Parent() myData: MyData): Promise<Team[]> {
    return this.teamMembersService.findTeamsForUser(myData.userId, [
      TeamRole.OWNER,
    ]);
  }

  @ResolveField(() => [Team], {
    description: 'Teams where the user is OWNER or MANAGER',
  })
  async managedTeams(@Parent() myData: MyData): Promise<Team[]> {
    return this.teamMembersService.findTeamsForUser(myData.userId, [
      TeamRole.OWNER,
      TeamRole.MANAGER,
    ]);
  }

  @ResolveField(() => [Game], {
    description: 'Upcoming games across all teams (SCHEDULED status)',
  })
  async upcomingGames(
    @Parent() myData: MyData,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Game[]> {
    const teamIds = await this.teamMembersService.findTeamIdsForUser(
      myData.userId,
    );
    return this.gamesService.findByTeamIds(teamIds, [GameStatus.SCHEDULED], {
      limit,
      orderBy: 'scheduledStart',
      orderDirection: 'ASC',
    });
  }

  @ResolveField(() => [Game], {
    description: 'Recent completed games across all teams',
  })
  async recentGames(
    @Parent() myData: MyData,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Game[]> {
    const teamIds = await this.teamMembersService.findTeamIdsForUser(
      myData.userId,
    );
    return this.gamesService.findByTeamIds(teamIds, [GameStatus.COMPLETED], {
      limit,
      orderBy: 'actualEnd',
      orderDirection: 'DESC',
    });
  }

  @ResolveField(() => [Game], {
    description: 'Games currently in progress across all teams',
  })
  async liveGames(@Parent() myData: MyData): Promise<Game[]> {
    const teamIds = await this.teamMembersService.findTeamIdsForUser(
      myData.userId,
    );
    return this.gamesService.findByTeamIds(
      teamIds,
      [
        GameStatus.FIRST_HALF,
        GameStatus.HALFTIME,
        GameStatus.SECOND_HALF,
        GameStatus.IN_PROGRESS,
      ],
      {
        orderBy: 'actualStart',
        orderDirection: 'DESC',
      },
    );
  }
}

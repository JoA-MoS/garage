import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Args,
  Int,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';

import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { Game } from '../../entities/game.entity';
import { CurrentUser } from '../auth/user.decorator';
import { ClerkUser } from '../auth/clerk.service';

import { MyData } from './my-data.type';
import { MyService } from './my.service';

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
 * @see FEATURE_ROADMAP.md Issue #183
 */
@Resolver(() => MyData)
export class MyResolver {
  private readonly logger = new Logger(MyResolver.name);

  constructor(private readonly myService: MyService) {}

  /**
   * Root query for user-scoped data.
   *
   * Returns null if:
   * - Not authenticated (no Clerk user in context)
   * - Clerk user has no email address configured
   * - No internal user found for the email (Clerk-to-app sync issue)
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

    // Clerk user has no email - configuration issue
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      this.logger.warn(
        `Clerk user ${clerkUser.id} has no email address configured`
      );
      return null;
    }

    // Look up internal user by email
    const user = await this.myService.findUserByEmail(email);
    if (!user) {
      this.logger.warn(
        `No internal user found for Clerk user ${clerkUser.id} with email ${email}`
      );
      return null;
    }

    // Return minimal data - field resolvers will fetch the rest
    return { userId: user.id } as MyData;
  }

  /**
   * Resolve the user field
   */
  @ResolveField(() => User, { description: 'The authenticated user' })
  async user(@Parent() myData: MyData): Promise<User | null> {
    return this.myService.findUserById(myData.userId);
  }

  /**
   * Resolve all teams the user belongs to (any role)
   */
  @ResolveField(() => [Team], {
    description: 'All teams the user belongs to',
  })
  async teams(@Parent() myData: MyData): Promise<Team[]> {
    return this.myService.findTeamsByUserId(myData.userId);
  }

  /**
   * Resolve teams where user is OWNER
   */
  @ResolveField(() => [Team], {
    description: 'Teams where the user is OWNER',
  })
  async ownedTeams(@Parent() myData: MyData): Promise<Team[]> {
    return this.myService.findOwnedTeamsByUserId(myData.userId);
  }

  /**
   * Resolve teams where user is OWNER or MANAGER
   */
  @ResolveField(() => [Team], {
    description: 'Teams where the user is OWNER or MANAGER',
  })
  async managedTeams(@Parent() myData: MyData): Promise<Team[]> {
    return this.myService.findManagedTeamsByUserId(myData.userId);
  }

  /**
   * Resolve upcoming games across all user's teams
   */
  @ResolveField(() => [Game], {
    description: 'Upcoming games across all teams (SCHEDULED status)',
  })
  async upcomingGames(
    @Parent() myData: MyData,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number
  ): Promise<Game[]> {
    return this.myService.findUpcomingGamesByUserId(myData.userId, limit);
  }

  /**
   * Resolve recent completed games across all user's teams
   */
  @ResolveField(() => [Game], {
    description: 'Recent completed games across all teams',
  })
  async recentGames(
    @Parent() myData: MyData,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number
  ): Promise<Game[]> {
    return this.myService.findRecentGamesByUserId(myData.userId, limit);
  }

  /**
   * Resolve games currently in progress across all user's teams
   */
  @ResolveField(() => [Game], {
    description: 'Games currently in progress across all teams',
  })
  async liveGames(@Parent() myData: MyData): Promise<Game[]> {
    return this.myService.findLiveGamesByUserId(myData.userId);
  }
}

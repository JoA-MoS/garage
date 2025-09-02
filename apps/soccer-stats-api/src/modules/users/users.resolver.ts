import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User, Team, UserTeamRole, TeamRole } from '../../entities';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../../app/guards/clerk-auth.guard';
import { CurrentUser } from '../../app/decorators/current-user.decorator';

@Resolver(() => User)
@UseGuards(ClerkAuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'me' })
  async getCurrentUser(@CurrentUser() clerkUser: any): Promise<User> {
    // Ensure user exists in database
    const user = await this.usersService.findOrCreateUser({
      clerkId: clerkUser.sub,
      email: clerkUser.email || clerkUser.email_addresses?.[0]?.email_address,
      firstName: clerkUser.first_name,
      lastName: clerkUser.last_name,
      profileImageUrl: clerkUser.image_url,
    });

    return user;
  }

  @Query(() => [Team], { name: 'myTeams' })
  async getUserTeams(@CurrentUser() clerkUser: any): Promise<Team[]> {
    const user = await this.usersService.findByClerkId(clerkUser.sub);
    if (!user) {
      return [];
    }

    return this.usersService.getUserTeams(user.id);
  }

  @Mutation(() => UserTeamRole)
  async addUserToTeam(
    @Args('teamId') teamId: string,
    @Args('userId') userId: string,
    @Args('role', { type: () => TeamRole, defaultValue: TeamRole.PLAYER }) role: TeamRole,
    @CurrentUser() clerkUser: any
  ): Promise<UserTeamRole> {
    const currentUser = await this.usersService.findByClerkId(clerkUser.sub);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Check if current user has permission to add users to this team
    const currentUserRole = await this.usersService.getUserRole(currentUser.id, teamId);
    if (!currentUserRole || !this.usersService.hasPermission(currentUserRole, TeamRole.COACH)) {
      throw new Error('Insufficient permissions to add users to team');
    }

    return this.usersService.addUserToTeam(userId, teamId, role);
  }

  @Mutation(() => Boolean)
  async removeUserFromTeam(
    @Args('teamId') teamId: string,
    @Args('userId') userId: string,
    @CurrentUser() clerkUser: any
  ): Promise<boolean> {
    const currentUser = await this.usersService.findByClerkId(clerkUser.sub);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Check if current user has permission to remove users from this team
    const currentUserRole = await this.usersService.getUserRole(currentUser.id, teamId);
    if (!currentUserRole || !this.usersService.hasPermission(currentUserRole, TeamRole.COACH)) {
      throw new Error('Insufficient permissions to remove users from team');
    }

    await this.usersService.removeUserFromTeam(userId, teamId);
    return true;
  }
}
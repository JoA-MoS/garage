import { ObjectType, Field } from '@nestjs/graphql';

import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { Game } from '../../entities/game.entity';

/**
 * Represents the current authenticated user's data.
 * This type follows the "Viewer" pattern used by GitHub, Shopify, and Facebook.
 *
 * The `my` query provides a clean entry point for user-scoped data:
 * - No need to pass user IDs from the client
 * - User extracted from auth context (more secure)
 * - Apollo Client can cache `my` as a stable entry point per session
 *
 * @see FEATURE_ROADMAP.md Issue #183 for full implementation details
 */
@ObjectType({
  description: 'User-scoped data accessible via the `my` query',
})
export class MyData {
  /**
   * Internal user ID - used by field resolvers to query related data.
   * Not exposed in the GraphQL schema.
   */
  userId: string;

  @Field(() => User, { description: 'The authenticated user' })
  user: User;

  @Field(() => [Team], { description: 'All teams the user belongs to' })
  teams: Team[];

  @Field(() => [Team], { description: 'Teams where the user is OWNER' })
  ownedTeams: Team[];

  @Field(() => [Team], {
    description: 'Teams where the user is OWNER or MANAGER',
  })
  managedTeams: Team[];

  @Field(() => [Game], {
    description: 'Upcoming games across all teams (scheduled, not completed)',
  })
  upcomingGames: Game[];

  @Field(() => [Game], {
    description: 'Recent completed games across all teams',
  })
  recentGames: Game[];

  @Field(() => [Game], {
    description: 'Games currently in progress across all teams',
  })
  liveGames: Game[];
}

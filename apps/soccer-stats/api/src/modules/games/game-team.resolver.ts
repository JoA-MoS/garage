import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { GameTeam } from '../../entities/game-team.entity';
import { Game } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { GraphQLContext } from '../dataloaders';

/**
 * Resolver for GameTeam entity field-level data loading.
 *
 * Uses DataLoaders to batch database queries and solve the N+1 problem.
 * Each field resolver only triggers when that field is actually queried.
 */
@Resolver(() => GameTeam)
export class GameTeamResolver {
  /**
   * Resolves the 'game' field on GameTeam.
   * Uses DataLoader to batch multiple game lookups into a single query.
   */
  @ResolveField(() => Game, {
    description: 'The game this team participation belongs to',
  })
  async game(
    @Parent() gameTeam: GameTeam,
    @Context() context: GraphQLContext,
  ): Promise<Game> {
    // If game was already loaded (e.g., via eager loading), return it
    if (gameTeam.game) {
      return gameTeam.game;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameLoader.load(gameTeam.gameId);
  }

  /**
   * Resolves the 'team' field on GameTeam.
   * Uses DataLoader to batch multiple team lookups into a single query.
   */
  @ResolveField(() => Team, {
    description: 'The team participating in this game',
  })
  async team(
    @Parent() gameTeam: GameTeam,
    @Context() context: GraphQLContext,
  ): Promise<Team> {
    // If team was already loaded (e.g., via eager loading), return it
    if (gameTeam.team) {
      return gameTeam.team;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.teamLoader.load(gameTeam.teamId);
  }

  /**
   * Resolves the 'events' field on GameTeam.
   * Uses DataLoader to batch multiple events lookups into a single query.
   *
   * This is the primary access path for game events in the frontend,
   * which queries events through teams[].events.
   */
  @ResolveField(() => [GameEvent], {
    nullable: true,
    description: 'All events for this team in this game',
  })
  async events(
    @Parent() gameTeam: GameTeam,
    @Context() context: GraphQLContext,
  ): Promise<GameEvent[]> {
    // If events was already loaded (e.g., via eager loading), return it
    if (gameTeam.events !== undefined) {
      return gameTeam.events;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameEventsByGameTeamLoader.load(gameTeam.id);
  }
}

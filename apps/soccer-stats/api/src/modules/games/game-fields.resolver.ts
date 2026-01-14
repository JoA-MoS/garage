import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { Game } from '../../entities/game.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GraphQLContext } from '../dataloaders';

/**
 * Resolver for Game entity field-level data loading.
 *
 * Uses DataLoaders to batch database queries and solve the N+1 problem.
 * Each field resolver only triggers when that field is actually queried.
 */
@Resolver(() => Game)
export class GameFieldsResolver {
  /**
   * Resolves the 'gameFormat' field on Game.
   * Uses DataLoader to batch multiple gameFormat lookups into a single query.
   */
  @ResolveField(() => GameFormat, {
    description: 'The format/rules for this game',
  })
  async gameFormat(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<GameFormat> {
    // If gameFormat was already loaded (e.g., via eager loading), return it
    if (game.gameFormat) {
      return game.gameFormat;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameFormatLoader.load(game.gameFormatId);
  }

  /**
   * Resolves the 'gameTeams' field on Game.
   * Uses DataLoader to batch multiple gameTeams lookups into a single query.
   */
  @ResolveField(() => [GameTeam], {
    nullable: true,
    description: 'The teams participating in this game',
  })
  async gameTeams(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<GameTeam[]> {
    // If gameTeams was already loaded (e.g., via eager loading), return it
    // Check for defined (not just truthy) to handle empty arrays correctly
    if (game.gameTeams !== undefined) {
      return game.gameTeams;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameTeamsByGameLoader.load(game.id);
  }
}

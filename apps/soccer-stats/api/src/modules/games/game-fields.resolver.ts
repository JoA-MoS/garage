import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { Game } from '../../entities/game.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { GraphQLContext } from '../dataloaders';

/**
 * Resolver for Game entity field-level data loading.
 *
 * Uses DataLoaders to batch database queries and solve the N+1 problem.
 * Each field resolver only triggers when that field is actually queried.
 *
 * Timing fields (actualStart, firstHalfEnd, secondHalfStart, actualEnd, pausedAt)
 * are computed from timing events via DataLoader, with fallback to legacy column
 * values for backward compatibility during the migration period.
 */
@Resolver(() => Game)
export class GameFieldsResolver {
  /**
   * Resolves the 'format' field on Game.
   * Uses DataLoader to batch multiple format lookups into a single query.
   */
  @ResolveField(() => GameFormat, {
    description: 'The format/rules for this game',
  })
  async format(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<GameFormat> {
    // If format was already loaded (e.g., via eager loading), return it
    if (game.format) {
      return game.format;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameFormatLoader.load(game.gameFormatId);
  }

  /**
   * Resolves the 'teams' field on Game.
   * Uses DataLoader to batch multiple teams lookups into a single query.
   */
  @ResolveField(() => [GameTeam], {
    nullable: true,
    description: 'The teams participating in this game',
  })
  async teams(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<GameTeam[]> {
    // If teams was already loaded (e.g., via eager loading), return it
    // Check for defined (not just truthy) to handle empty arrays correctly
    if (game.teams !== undefined) {
      return game.teams;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameTeamsByGameLoader.load(game.id);
  }

  /**
   * Resolves the 'events' field on Game.
   * Uses DataLoader to batch multiple events lookups into a single query.
   *
   * This resolver is critical for memory efficiency - it loads events only when
   * specifically requested by the GraphQL query, preventing the massive memory
   * usage that occurred with eager loading all events for every game.
   */
  @ResolveField(() => [GameEvent], {
    nullable: true,
    description: 'All events that occurred during this game',
  })
  async events(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<GameEvent[]> {
    // If events was already loaded (e.g., via eager loading), return it
    if (game.events !== undefined) {
      return game.events;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameEventsByGameLoader.load(game.id);
  }

  // ============================================================
  // Timing Field Resolvers
  // ============================================================
  // These compute timing from events via DataLoader (batched), with fallback
  // to legacy column values. Once all games have timing events, the column
  // fallbacks can be removed.

  /**
   * When the game actually started.
   * Computed from GAME_START event, falls back to legacy column.
   */
  @ResolveField(() => Date, { nullable: true })
  async actualStart(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<Date | undefined> {
    // Use DataLoader to batch timing queries across multiple games
    const timing = await context.loaders.gameTimingLoader.load(game.id);
    if (timing.actualStart) {
      return timing.actualStart;
    }
    // Fallback to legacy column value
    return game.actualStart;
  }

  /**
   * When the first half ended.
   * Computed from PERIOD_END event with period="1", falls back to legacy column.
   */
  @ResolveField(() => Date, { nullable: true })
  async firstHalfEnd(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<Date | undefined> {
    const timing = await context.loaders.gameTimingLoader.load(game.id);
    if (timing.firstHalfEnd) {
      return timing.firstHalfEnd;
    }
    return game.firstHalfEnd;
  }

  /**
   * When the second half started.
   * Computed from PERIOD_START event with period="2", falls back to legacy column.
   */
  @ResolveField(() => Date, { nullable: true })
  async secondHalfStart(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<Date | undefined> {
    const timing = await context.loaders.gameTimingLoader.load(game.id);
    if (timing.secondHalfStart) {
      return timing.secondHalfStart;
    }
    return game.secondHalfStart;
  }

  /**
   * When the game ended.
   * Computed from GAME_END event, falls back to legacy column.
   */
  @ResolveField(() => Date, { nullable: true })
  async actualEnd(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<Date | undefined> {
    const timing = await context.loaders.gameTimingLoader.load(game.id);
    if (timing.actualEnd) {
      return timing.actualEnd;
    }
    return game.actualEnd;
  }

  /**
   * When the game clock was paused (null = not paused).
   * Computed from unmatched STOPPAGE_START event, falls back to legacy column.
   */
  @ResolveField(() => Date, { nullable: true })
  async pausedAt(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<Date | undefined> {
    const timing = await context.loaders.gameTimingLoader.load(game.id);
    if (timing.pausedAt) {
      return timing.pausedAt;
    }
    return game.pausedAt;
  }

  // ============================================================
  // Duration Field Resolvers
  // ============================================================

  /**
   * The effective duration for this game in minutes.
   * Returns game-specific override if set, otherwise the game format's default.
   */
  @ResolveField('effectiveDuration', () => Number, {
    description:
      'Effective game duration in minutes (game override or format default)',
  })
  async effectiveDuration(
    @Parent() game: Game,
    @Context() context: GraphQLContext,
  ): Promise<number> {
    // If game has its own duration set, use it
    if (game.durationMinutes != null) {
      return game.durationMinutes;
    }
    // Otherwise, get the format's default duration
    const gameFormat = game.format
      ? game.format
      : await context.loaders.gameFormatLoader.load(game.gameFormatId);
    return gameFormat.durationMinutes;
  }
}

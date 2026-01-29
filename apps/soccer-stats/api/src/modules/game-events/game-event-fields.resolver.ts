import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';
import { User } from '../../entities/user.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { Game } from '../../entities/game.entity';
import { GraphQLContext } from '../dataloaders';

/**
 * Field resolver for GameEvent entity.
 *
 * Uses DataLoaders to batch database queries and solve the N+1 problem.
 * Each field resolver only triggers when that field is actually queried.
 *
 * This enables mutations and subscriptions to return base entities without
 * eager loading relations - GraphQL field resolution handles loading on-demand.
 */
@Resolver(() => GameEvent)
export class GameEventFieldsResolver {
  /**
   * Resolves the 'eventType' field on GameEvent.
   * Uses DataLoader to batch multiple event type lookups into a single query.
   */
  @ResolveField(() => EventType, {
    description: 'The type of event (GOAL, SUBSTITUTION_IN, etc.)',
  })
  async eventType(
    @Parent() gameEvent: GameEvent,
    @Context() context: GraphQLContext,
  ): Promise<EventType> {
    // If eventType was already loaded (e.g., via eager loading), return it
    if (gameEvent.eventType) {
      return gameEvent.eventType;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.eventTypeLoader.load(gameEvent.eventTypeId);
  }

  /**
   * Resolves the 'player' field on GameEvent.
   * Uses DataLoader to batch multiple user lookups into a single query.
   */
  @ResolveField(() => User, {
    nullable: true,
    description: 'The player who performed this event (if applicable)',
  })
  async player(
    @Parent() gameEvent: GameEvent,
    @Context() context: GraphQLContext,
  ): Promise<User | null> {
    // If player was already loaded, return it
    if (gameEvent.player !== undefined) {
      return gameEvent.player ?? null;
    }
    // If no playerId, return null
    if (!gameEvent.playerId) {
      return null;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.userLoader.load(gameEvent.playerId);
  }

  /**
   * Resolves the 'recordedByUser' field on GameEvent.
   * Uses DataLoader to batch multiple user lookups into a single query.
   */
  @ResolveField(() => User, {
    description: 'The user who recorded this event',
  })
  async recordedByUser(
    @Parent() gameEvent: GameEvent,
    @Context() context: GraphQLContext,
  ): Promise<User> {
    // If recordedByUser was already loaded, return it
    if (gameEvent.recordedByUser) {
      return gameEvent.recordedByUser;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.userLoader.load(gameEvent.recordedByUserId);
  }

  /**
   * Resolves the 'gameTeam' field on GameEvent.
   * Uses DataLoader to batch multiple game team lookups into a single query.
   */
  @ResolveField(() => GameTeam, {
    description: 'The game team this event belongs to',
  })
  async gameTeam(
    @Parent() gameEvent: GameEvent,
    @Context() context: GraphQLContext,
  ): Promise<GameTeam> {
    // If gameTeam was already loaded, return it
    if (gameEvent.gameTeam) {
      return gameEvent.gameTeam;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameTeamLoader.load(gameEvent.gameTeamId);
  }

  /**
   * Resolves the 'game' field on GameEvent.
   * Uses DataLoader to batch multiple game lookups into a single query.
   */
  @ResolveField(() => Game, {
    description: 'The game this event occurred in',
  })
  async game(
    @Parent() gameEvent: GameEvent,
    @Context() context: GraphQLContext,
  ): Promise<Game> {
    // If game was already loaded, return it
    if (gameEvent.game) {
      return gameEvent.game;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameLoader.load(gameEvent.gameId);
  }

  /**
   * Resolves the 'parentEvent' field on GameEvent.
   * Uses DataLoader to batch multiple event lookups into a single query.
   */
  @ResolveField(() => GameEvent, {
    nullable: true,
    description: 'The parent event (for hierarchical events like assists)',
  })
  async parentEvent(
    @Parent() gameEvent: GameEvent,
    @Context() context: GraphQLContext,
  ): Promise<GameEvent | null> {
    // If parentEvent was already loaded, return it
    if (gameEvent.parentEvent !== undefined) {
      return gameEvent.parentEvent ?? null;
    }
    // If no parentEventId, return null
    if (!gameEvent.parentEventId) {
      return null;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.gameEventLoader.load(gameEvent.parentEventId);
  }

  /**
   * Resolves the 'childEvents' field on GameEvent.
   * Uses DataLoader to batch multiple child event lookups into a single query.
   */
  @ResolveField(() => [GameEvent], {
    description: 'Child events (e.g., assists on a goal)',
  })
  async childEvents(
    @Parent() gameEvent: GameEvent,
    @Context() context: GraphQLContext,
  ): Promise<GameEvent[]> {
    // If childEvents was already loaded, return it
    if (gameEvent.childEvents !== undefined) {
      return gameEvent.childEvents;
    }
    // Otherwise, use DataLoader to batch the query
    return context.loaders.childEventsByParentIdLoader.load(gameEvent.id);
  }
}

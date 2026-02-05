import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { GameTeam } from '../../entities/game-team.entity';
import { Game } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { GraphQLContext } from '../dataloaders';
import { PlayerFullStats } from '../game-events/dto/player-full-stats.output';
import { LineupPlayer } from '../game-events/dto/game-lineup.output';
import { StatsService } from '../game-events/services/stats.service';

/**
 * Resolver for GameTeam entity field-level data loading.
 *
 * Uses DataLoaders to batch database queries and solve the N+1 problem.
 * Each field resolver only triggers when that field is actually queried.
 */
@Resolver(() => GameTeam)
export class GameTeamResolver {
  constructor(private readonly statsService: StatsService) {}

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

  /**
   * Resolves player stats for this team in this game (flat array).
   * Returns real-time playtime calculated at request time.
   * Use game.currentPeriod, game.currentPeriodSecond, and game.serverTimestamp
   * for client-side time interpolation.
   * @deprecated Use players.stats for nested structure
   */
  @ResolveField(() => [PlayerFullStats], {
    description: 'Player statistics for this team in this game',
    deprecationReason: 'Use players.stats for nested structure',
  })
  async playerStats(@Parent() gameTeam: GameTeam): Promise<PlayerFullStats[]> {
    return this.statsService.getPlayerStats({
      teamId: gameTeam.teamId,
      gameId: gameTeam.gameId,
    });
  }

  /**
   * Resolves players in the game roster for this team.
   * Each player has an optional stats field for detailed statistics.
   * Merges on-field status from currentOnField into gameRoster.
   *
   * Uses lineupByGameTeamLoader DataLoader for request-scoped caching:
   * - Multiple teams in the same request share batched lineup fetching
   * - Each gameTeamId is only looked up once per GraphQL request
   */
  @ResolveField(() => [LineupPlayer], {
    description: 'Players in the game roster for this team',
  })
  async players(
    @Parent() gameTeam: GameTeam,
    @Context() context: GraphQLContext,
  ): Promise<LineupPlayer[]> {
    const lineup = await context.loaders.lineupByGameTeamLoader.load(
      gameTeam.id,
    );

    // Build a set of on-field player keys
    const onFieldKeys = new Set<string>();
    const onFieldPositions = new Map<string, string>();

    for (const player of lineup.currentOnField) {
      const key =
        player.playerId || player.externalPlayerName || player.gameEventId;
      onFieldKeys.add(key);
      if (player.position) {
        onFieldPositions.set(key, player.position);
      }
    }

    // Merge on-field status into game roster
    return lineup.gameRoster.map((player) => {
      const key =
        player.playerId || player.externalPlayerName || player.gameEventId;
      const isOnField = onFieldKeys.has(key);
      return {
        ...player,
        isOnField,
        position: isOnField
          ? (onFieldPositions.get(key) ?? player.position)
          : player.position,
      };
    });
  }
}

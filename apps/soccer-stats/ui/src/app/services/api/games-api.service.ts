import { apolloClient } from '../apollo-client';
import {
  GET_GAMES,
  GET_GAME_BY_ID,
  CREATE_GAME,
  UPDATE_GAME,
  type Game,
  type CreateGameInput,
  type UpdateGameInput,
  type GamesResponse,
  type GameResponse,
  type CreateGameResponse,
  type UpdateGameResponse,
  GameStatus,
  GameFormat,
} from '../games-graphql.service';

export class GamesApiService {
  /**
   * Get all games
   */
  static async getGames(): Promise<Game[]> {
    try {
      const { data } = await apolloClient.query<GamesResponse>({
        query: GET_GAMES,
        fetchPolicy: 'cache-first',
      });
      return data?.games || [];
    } catch (error) {
      console.error('Error fetching games:', error);
      throw new Error('Failed to fetch games');
    }
  }

  /**
   * Get a game by ID
   */
  static async getGameById(id: string): Promise<Game> {
    try {
      const { data } = await apolloClient.query<GameResponse>({
        query: GET_GAME_BY_ID,
        variables: { id },
        fetchPolicy: 'cache-first',
      });

      if (!data?.game) {
        throw new Error(`Game with ID ${id} not found`);
      }

      return data.game;
    } catch (error) {
      console.error('Error fetching game by ID:', error);
      throw new Error(`Failed to fetch game with ID: ${id}`);
    }
  }

  /**
   * Create a new game
   */
  static async createGame(gameInput: CreateGameInput): Promise<Game> {
    try {
      const { data } = await apolloClient.mutate<CreateGameResponse>({
        mutation: CREATE_GAME,
        variables: { createGameInput: gameInput },
        update: (cache, { data }) => {
          if (data?.createGame) {
            // Add the new game to the cache
            const existingGames = cache.readQuery<GamesResponse>({
              query: GET_GAMES,
            });

            if (existingGames?.games) {
              cache.writeQuery<GamesResponse>({
                query: GET_GAMES,
                data: {
                  games: [...existingGames.games, data.createGame],
                },
              });
            }
          }
        },
      });

      if (!data?.createGame) {
        throw new Error('Failed to create game - no data received');
      }

      return data.createGame;
    } catch (error) {
      console.error('Error creating game:', error);
      throw new Error('Failed to create game');
    }
  }

  /**
   * Update an existing game
   */
  static async updateGame(
    id: string,
    updateInput: UpdateGameInput
  ): Promise<Game> {
    try {
      const { data } = await apolloClient.mutate<UpdateGameResponse>({
        mutation: UPDATE_GAME,
        variables: { id, updateGameInput: updateInput },
        update: (cache, { data }) => {
          if (data?.updateGame) {
            // Update the game in the cache
            cache.modify({
              id: `Game:${data.updateGame.id}`,
              fields: {
                name: () => data.updateGame.name,
                scheduledStart: () => data.updateGame.scheduledStart,
                notes: () => data.updateGame.notes,
                updatedAt: () => data.updateGame.updatedAt,
              },
            });
          }
        },
      });

      if (!data?.updateGame) {
        throw new Error('Failed to update game - no data received');
      }

      return data.updateGame;
    } catch (error) {
      console.error('Error updating game:', error);
      throw new Error(`Failed to update game with ID: ${id}`);
    }
  }

  /**
   * Clear all games cache
   */
  static async clearCache(): Promise<void> {
    try {
      await apolloClient.resetStore();
    } catch (error) {
      console.error('Error clearing games cache:', error);
    }
  }
}

// Export commonly used types and enums
export { GameStatus, GameFormat };

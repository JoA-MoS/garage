import { apolloClient } from '../apollo-client';
import {
  GET_GAMES,
  GET_GAME_BY_ID,
  CREATE_GAME,
  UPDATE_GAME,
  START_GAME,
  PAUSE_GAME,
  RESUME_GAME,
  FINISH_GAME,
  RECORD_GOAL,
  type Game,
  type CreateGameInput,
  type UpdateGameInput,
  type RecordGoalInput,
  type GamesResponse,
  type GameResponse,
  type CreateGameResponse,
  type UpdateGameResponse,
  type StartGameResponse,
  type PauseGameResponse,
  type ResumeGameResponse,
  type FinishGameResponse,
  type RecordGoalResponse,
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
   * Get a game by ID with full details
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
      console.error('Error fetching game:', error);
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
            // Update the cache to include the new game
            const existingGames = cache.readQuery<GamesResponse>({
              query: GET_GAMES,
            });

            if (existingGames) {
              cache.writeQuery({
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
        throw new Error('No data returned from create game mutation');
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
    gameInput: UpdateGameInput
  ): Promise<Game> {
    try {
      const { data } = await apolloClient.mutate<UpdateGameResponse>({
        mutation: UPDATE_GAME,
        variables: { id, updateGameInput: gameInput },
        update: (cache, { data }) => {
          if (data?.updateGame) {
            // Update the cache
            const gameRef = cache.identify({
              __typename: 'Game',
              id: data.updateGame.id,
            });
            if (gameRef) {
              cache.modify({
                id: gameRef,
                fields: {
                  status: () => data.updateGame.status,
                  currentTime: () => data.updateGame.currentTime,
                  endTime: () => data.updateGame.endTime,
                  updatedAt: () => data.updateGame.updatedAt,
                },
              });
            }
          }
        },
      });

      if (!data?.updateGame) {
        throw new Error('No data returned from update game mutation');
      }

      return data.updateGame;
    } catch (error) {
      console.error('Error updating game:', error);
      throw new Error(`Failed to update game with ID: ${id}`);
    }
  }

  /**
   * Start a game
   */
  static async startGame(
    id: string
  ): Promise<Pick<Game, 'id' | 'startTime' | 'status' | 'currentTime'>> {
    try {
      const { data } = await apolloClient.mutate<StartGameResponse>({
        mutation: START_GAME,
        variables: { id },
        refetchQueries: [{ query: GET_GAME_BY_ID, variables: { id } }],
      });

      if (!data?.startGame) {
        throw new Error('No data returned from start game mutation');
      }

      return data.startGame;
    } catch (error) {
      console.error('Error starting game:', error);
      throw new Error(`Failed to start game with ID: ${id}`);
    }
  }

  /**
   * Pause a game
   */
  static async pauseGame(
    id: string
  ): Promise<Pick<Game, 'id' | 'status' | 'currentTime'>> {
    try {
      const { data } = await apolloClient.mutate<PauseGameResponse>({
        mutation: PAUSE_GAME,
        variables: { id },
        refetchQueries: [{ query: GET_GAME_BY_ID, variables: { id } }],
      });

      if (!data?.pauseGame) {
        throw new Error('No data returned from pause game mutation');
      }

      return data.pauseGame;
    } catch (error) {
      console.error('Error pausing game:', error);
      throw new Error(`Failed to pause game with ID: ${id}`);
    }
  }

  /**
   * Resume a game
   */
  static async resumeGame(
    id: string
  ): Promise<Pick<Game, 'id' | 'status' | 'currentTime'>> {
    try {
      const { data } = await apolloClient.mutate<ResumeGameResponse>({
        mutation: RESUME_GAME,
        variables: { id },
        refetchQueries: [{ query: GET_GAME_BY_ID, variables: { id } }],
      });

      if (!data?.resumeGame) {
        throw new Error('No data returned from resume game mutation');
      }

      return data.resumeGame;
    } catch (error) {
      console.error('Error resuming game:', error);
      throw new Error(`Failed to resume game with ID: ${id}`);
    }
  }

  /**
   * Finish a game
   */
  static async finishGame(
    id: string
  ): Promise<Pick<Game, 'id' | 'endTime' | 'status' | 'currentTime'>> {
    try {
      const { data } = await apolloClient.mutate<FinishGameResponse>({
        mutation: FINISH_GAME,
        variables: { id },
        refetchQueries: [{ query: GET_GAME_BY_ID, variables: { id } }],
      });

      if (!data?.finishGame) {
        throw new Error('No data returned from finish game mutation');
      }

      return data.finishGame;
    } catch (error) {
      console.error('Error finishing game:', error);
      throw new Error(`Failed to finish game with ID: ${id}`);
    }
  }

  /**
   * Record a goal in a game
   */
  static async recordGoal(
    goalInput: RecordGoalInput
  ): Promise<RecordGoalResponse['recordGoal']> {
    try {
      const { data } = await apolloClient.mutate<RecordGoalResponse>({
        mutation: RECORD_GOAL,
        variables: { recordGoalInput: goalInput },
        refetchQueries: [
          { query: GET_GAME_BY_ID, variables: { id: goalInput.gameId } },
        ],
      });

      if (!data?.recordGoal) {
        throw new Error('No data returned from record goal mutation');
      }

      return data.recordGoal;
    } catch (error) {
      console.error('Error recording goal:', error);
      throw new Error('Failed to record goal');
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

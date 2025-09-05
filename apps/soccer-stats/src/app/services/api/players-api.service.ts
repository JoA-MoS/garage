import { apolloClient } from '../apollo-client';
import {
  GET_PLAYERS,
  CREATE_PLAYER,
  ADD_PLAYER_TO_TEAM,
  type Player,
  type CreatePlayerInput,
  type AddPlayerToTeamInput,
  type PlayersResponse,
  type CreatePlayerResponse,
  type AddPlayerToTeamResponse,
} from '../players-graphql.service';

export class PlayersApiService {
  /**
   * Get all players
   */
  static async getPlayers(): Promise<Player[]> {
    try {
      const { data } = await apolloClient.query<PlayersResponse>({
        query: GET_PLAYERS,
        fetchPolicy: 'cache-first',
      });
      return data?.players || [];
    } catch (error) {
      console.error('Error fetching players:', error);
      throw new Error('Failed to fetch players');
    }
  }

  /**
   * Create a new player
   */
  static async createPlayer(playerInput: CreatePlayerInput): Promise<Player> {
    try {
      const { data } = await apolloClient.mutate<CreatePlayerResponse>({
        mutation: CREATE_PLAYER,
        variables: { createPlayerInput: playerInput },
        update: (cache, { data }) => {
          if (data?.createPlayer) {
            // Update the cache to include the new player
            const existingPlayers = cache.readQuery<PlayersResponse>({
              query: GET_PLAYERS,
            });

            if (existingPlayers) {
              cache.writeQuery({
                query: GET_PLAYERS,
                data: {
                  players: [...existingPlayers.players, data.createPlayer],
                },
              });
            }
          }
        },
      });

      if (!data?.createPlayer) {
        throw new Error('No data returned from create player mutation');
      }

      return data.createPlayer;
    } catch (error) {
      console.error('Error creating player:', error);
      throw new Error('Failed to create player');
    }
  }

  /**
   * Add a player to a team
   */
  static async addPlayerToTeam(input: AddPlayerToTeamInput): Promise<void> {
    try {
      await apolloClient.mutate<AddPlayerToTeamResponse>({
        mutation: ADD_PLAYER_TO_TEAM,
        variables: { addPlayerToTeamInput: input },
      });
    } catch (error) {
      console.error('Error adding player to team:', error);
      throw new Error('Failed to add player to team');
    }
  }

  /**
   * Create a player and immediately add them to a team
   */
  static async createPlayerAndAddToTeam(
    playerInput: CreatePlayerInput,
    teamId: string,
    jersey: number
  ): Promise<Player> {
    try {
      // First create the player
      const player = await this.createPlayer(playerInput);

      // Then add them to the team
      await this.addPlayerToTeam({
        teamId,
        playerId: player.id,
        jersey,
      });

      return player;
    } catch (error) {
      console.error('Error creating player and adding to team:', error);
      throw new Error('Failed to create player and add to team');
    }
  }

  /**
   * Clear all players cache
   */
  static async clearCache(): Promise<void> {
    try {
      await apolloClient.resetStore();
    } catch (error) {
      console.error('Error clearing players cache:', error);
    }
  }
}

import { apolloClient } from '../apollo-client';
import {
  GET_TEAMS,
  GET_TEAM_BY_ID,
  CREATE_TEAM,
  UPDATE_TEAM,
  // ADD_PLAYER_TO_TEAM_WITH_DETAILS, // Disabled - not available in current GraphQL schema
  type Team,
  type TeamWithGames,
  type CreateTeamInput,
  type UpdateTeamInput,
  type AddPlayerToTeamInput,
  type TeamsResponse,
  type TeamResponse,
  type CreateTeamResponse,
  type UpdateTeamResponse,
  type AddPlayerToTeamResponse,
} from '../teams-graphql.service';

export class TeamsApiService {
  /**
   * Get all teams
   */
  static async getTeams(): Promise<Team[]> {
    try {
      const { data } = await apolloClient.query<TeamsResponse>({
        query: GET_TEAMS,
        fetchPolicy: 'cache-first',
      });
      return data?.teams || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw new Error('Failed to fetch teams');
    }
  }

  /**
   * Get a team by ID with its games
   */
  static async getTeamById(id: string): Promise<TeamWithGames> {
    try {
      const { data } = await apolloClient.query<TeamResponse>({
        query: GET_TEAM_BY_ID,
        variables: { id },
        fetchPolicy: 'cache-first',
      });
      if (!data?.team) {
        throw new Error(`Team with ID ${id} not found`);
      }

      return data.team;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw new Error(`Failed to fetch team with ID: ${id}`);
    }
  }

  /**
   * Create a new team
   */
  static async createTeam(teamInput: CreateTeamInput): Promise<Team> {
    try {
      const { data } = await apolloClient.mutate<CreateTeamResponse>({
        mutation: CREATE_TEAM,
        variables: { createTeamInput: teamInput },
        update: (cache, { data }) => {
          if (data?.createTeam) {
            // Update the cache to include the new team
            const existingTeams = cache.readQuery<TeamsResponse>({
              query: GET_TEAMS,
            });

            if (existingTeams) {
              cache.writeQuery({
                query: GET_TEAMS,
                data: {
                  teams: [...existingTeams.teams, data.createTeam],
                },
              });
            }
          }
        },
      });

      if (!data?.createTeam) {
        throw new Error('No data returned from create team mutation');
      }

      return data.createTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  }

  /**
   * Update an existing team
   */
  static async updateTeam(
    id: string,
    teamInput: UpdateTeamInput
  ): Promise<Team> {
    try {
      const { data } = await apolloClient.mutate<UpdateTeamResponse>({
        mutation: UPDATE_TEAM,
        variables: { id, updateTeamInput: teamInput },
        update: (cache, { data }) => {
          if (data?.updateTeam) {
            // Update the cache
            const teamRef = cache.identify({
              __typename: 'Team',
              id: data.updateTeam.id,
            });
            if (teamRef) {
              cache.modify({
                id: teamRef,
                fields: {
                  name: () => data.updateTeam.name,
                  homePrimaryColor: () => data.updateTeam.homePrimaryColor,
                  homeSecondaryColor: () => data.updateTeam.homeSecondaryColor,
                  logoUrl: () => data.updateTeam.logoUrl,
                  updatedAt: () => data.updateTeam.updatedAt,
                },
              });
            }
          }
        },
      });

      if (!data?.updateTeam) {
        throw new Error('No data returned from update team mutation');
      }

      return data.updateTeam;
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error(`Failed to update team with ID: ${id}`);
    }
  }

  /**
   * Add a player to a team
   */
  static async addPlayerToTeam(input: AddPlayerToTeamInput): Promise<void> {
    try {
      await apolloClient.mutate<AddPlayerToTeamResponse>({
        mutation: ADD_PLAYER_TO_TEAM_WITH_DETAILS,
        variables: { addPlayerToTeamInput: input },
        // Invalidate team cache to refetch with updated players
        refetchQueries: [
          { query: GET_TEAM_BY_ID, variables: { id: input.teamId } },
        ],
      });
    } catch (error) {
      console.error('Error adding player to team:', error);
      throw new Error('Failed to add player to team');
    }
  }

  /**
   * Clear all teams cache
   */
  static async clearCache(): Promise<void> {
    try {
      await apolloClient.resetStore();
    } catch (error) {
      console.error('Error clearing teams cache:', error);
    }
  }
}

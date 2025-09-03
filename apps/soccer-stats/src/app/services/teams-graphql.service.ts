import { gql } from '@apollo/client';

export const GET_TEAMS = gql`
  query GetTeams {
    teams {
      id
      name
      colors
      logo
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEAM_BY_ID = gql`
  query GetTeamById($id: ID!) {
    team(id: $id) {
      id
      name
      colors
      logo
      createdAt
      updatedAt
      gameTeams {
        id
        isHome
        game {
          id
          status
          startTime
        }
      }
    }
  }
`;

export const CREATE_TEAM = gql`
  mutation CreateTeam($createTeamInput: CreateTeamInput!) {
    createTeam(createTeamInput: $createTeamInput) {
      id
      name
      colors
      logo
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TEAM = gql`
  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {
    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {
      id
      name
      colors
      logo
      createdAt
      updatedAt
    }
  }
`;

export const ADD_PLAYER_TO_TEAM = gql`
  mutation AddPlayerToTeam($addPlayerToTeamInput: AddPlayerToTeamInput!) {
    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {
      id
      name
      colors
      logo
      createdAt
      updatedAt
      players {
        id
        name
        position
      }
    }
  }
`;

// TypeScript interfaces for the GraphQL responses
export interface Team {
  id: string;
  name: string;
  colors?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Game {
  id: string;
  status: string;
  startTime: string;
}

export interface GameTeam {
  id: string;
  isHome: boolean;
  game: Game;
}

export interface TeamWithGames extends Team {
  gameTeams: GameTeam[];
}

export interface TeamsResponse {
  teams: Team[];
}

export interface TeamResponse {
  team: TeamWithGames;
}

export interface CreateTeamInput {
  name: string;
  colors?: string;
  logo?: string;
}

export interface UpdateTeamInput {
  name?: string;
  colors?: string;
  logo?: string;
}

export interface CreateTeamResponse {
  createTeam: Team;
}

export interface UpdateTeamResponse {
  updateTeam: Team;
}

export interface AddPlayerToTeamInput {
  teamId: string;
  playerId: string;
}

export interface AddPlayerToTeamResponse {
  addPlayerToTeam: Team & {
    players: Array<{
      id: string;
      name: string;
      position: string;
    }>;
  };
}

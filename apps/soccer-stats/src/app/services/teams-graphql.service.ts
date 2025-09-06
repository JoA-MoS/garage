import { gql } from '@apollo/client';

import { Player } from './players-graphql.service';

export const GET_TEAMS = gql`
  query GetTeams {
    teams {
      id
      name
      colors
      logo
      gameFormat
      formation
      customPositions {
        id
        name
        abbreviation
        x
        y
      }
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
      gameFormat
      formation
      customPositions {
        id
        name
        abbreviation
        x
        y
      }
      createdAt
      updatedAt
      playersWithJersey {
        id
        name
        position
        jersey
        depthRank
        isActive
      }
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
      gameFormat
      formation
      customPositions {
        id
        name
        abbreviation
        x
        y
      }
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
      gameFormat
      formation
      customPositions {
        id
        name
        abbreviation
        x
        y
      }
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
export interface TeamPosition {
  id: string;
  name: string;
  abbreviation: string;
  x: number;
  y: number;
}

export interface PlayerWithJersey {
  id: string;
  name: string;
  position: string;
  jersey: number;
  depthRank?: number;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  colors?: string;
  logo?: string;
  gameFormat?: string;
  formation?: string;
  customPositions?: TeamPosition[];
  createdAt: string;
  updatedAt: string;
  players?: Player[];
  playersWithJersey?: PlayerWithJersey[];
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
  gameFormat?: string;
  formation?: string;
  customPositions?: TeamPosition[];
}

export interface UpdateTeamInput {
  name?: string;
  colors?: string;
  logo?: string;
  gameFormat?: string;
  formation?: string;
  customPositions?: TeamPosition[];
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
  jersey: number;
  depthRank?: number;
  isActive?: boolean;
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

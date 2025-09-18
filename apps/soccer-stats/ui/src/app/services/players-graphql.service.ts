import { graphql } from '../generated';

export const GET_PLAYERS = graphql(`
  query GetPlayers {
    players {
      id
      firstName
      lastName
      email
      dateOfBirth
      phone
      isActive
      createdAt
      updatedAt
      teams {
        id
        name
        shortName
      }
      teamPlayers {
        id
        jerseyNumber
        primaryPosition
        isActive
        team {
          id
          name
        }
      }
    }
  }
`);

export const CREATE_PLAYER = graphql(`
  mutation CreatePlayer($createPlayerInput: CreatePlayerInput!) {
    createPlayer(createPlayerInput: $createPlayerInput) {
      id
      firstName
      lastName
      email
      dateOfBirth
      phone
      isActive
      createdAt
      updatedAt
    }
  }
`);

export const ADD_PLAYER_TO_TEAM = graphql(`
  mutation AddPlayerToTeamBasic($addPlayerToTeamInput: AddPlayerToTeamInput!) {
    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {
      id
      name
    }
  }
`);

export const GET_PLAYER_BY_ID = graphql(`
  query GetPlayerById($id: ID!) {
    player(id: $id) {
      id
      firstName
      lastName
      email
      dateOfBirth
      phone
      isActive
      createdAt
      updatedAt
      teams {
        id
        name
        shortName
        homePrimaryColor
        homeSecondaryColor
        awayPrimaryColor
        awaySecondaryColor
        logoUrl
      }
      teamPlayers {
        id
        jerseyNumber
        primaryPosition
        isActive
        joinedDate
        leftDate
        team {
          id
          name
          shortName
        }
      }
      performedEvents {
        id
        gameMinute
        gameSecond
        description
        eventType {
          id
          name
          category
        }
        game {
          id
          name
          scheduledStart
        }
      }
    }
  }
`);

export const UPDATE_PLAYER = graphql(`
  mutation UpdatePlayer($id: ID!, $updatePlayerInput: UpdatePlayerInput!) {
    updatePlayer(id: $id, updatePlayerInput: $updatePlayerInput) {
      id
      firstName
      lastName
      email
      dateOfBirth
      phone
      isActive
      updatedAt
    }
  }
`);

export const REMOVE_PLAYER = graphql(`
  mutation RemovePlayer($id: ID!) {
    removePlayer(id: $id)
  }
`);

export const REMOVE_PLAYER_FROM_TEAM = graphql(`
  mutation RemovePlayerFromTeam($playerId: ID!, $teamId: ID!) {
    removePlayerFromTeam(playerId: $playerId, teamId: $teamId) {
      id
      name
      players {
        id
        firstName
        lastName
      }
    }
  }
`);

// TypeScript interfaces
export interface TeamPlayer {
  id: string;
  jerseyNumber: number;
  primaryPosition?: string;
  isActive: boolean;
  joinedDate?: string;
  leftDate?: string;
  team: {
    id: string;
    name: string;
    shortName?: string;
  };
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teamPlayers?: TeamPlayer[];
}

export interface CreatePlayerInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  dateOfBirth?: string;
  phone?: string;
}

export interface UpdatePlayerInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  passwordHash?: string;
  dateOfBirth?: string;
  phone?: string;
}

export interface AddPlayerToTeamInput {
  teamId: string;
  playerId: string;
  jersey: number;
  depthRank?: number;
  isActive?: boolean;
}

export interface PlayersResponse {
  players: Player[];
}

export interface CreatePlayerResponse {
  createPlayer: Player;
}

export interface AddPlayerToTeamResponse {
  addPlayerToTeam: {
    id: string;
    name: string;
    colors?: string;
    logo?: string;
  };
}

// Simplified interfaces for game setup
export interface GameSetupPlayerInput {
  firstName: string;
  lastName: string;
  jerseyNumber: number;
}

export interface CreateQuickPlayerInput {
  firstName: string;
  lastName: string;
  teamId: string;
  jerseyNumber: number;
}

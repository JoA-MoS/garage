import { gql } from '@apollo/client';

export const GET_PLAYERS = gql`
  query GetPlayers {
    players {
      id
      name
      position
    }
  }
`;

export const CREATE_PLAYER = gql`
  mutation CreatePlayer($createPlayerInput: CreatePlayerInput!) {
    createPlayer(createPlayerInput: $createPlayerInput) {
      id
      name
      position
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
    }
  }
`;

// TypeScript interfaces
export interface Player {
  id: string;
  name: string;
  position: string;
}

export interface CreatePlayerInput {
  name: string;
  position: string;
}

export interface AddPlayerToTeamInput {
  teamId: string;
  playerId: string;
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

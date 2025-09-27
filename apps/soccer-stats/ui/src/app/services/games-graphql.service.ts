import { graphql } from '../generated/gql';

export const GET_GAME_FORMATS = graphql(/* GraphQL */ `
  query GetGameFormats {
    gameFormats {
      id
      name
      playersPerTeam
      durationMinutes
      description
      allowsSubstitutions
      maxSubstitutions
      createdAt
      updatedAt
    }
  }
`);

export const GET_GAMES = graphql(/* GraphQL */ `
  query GetGames {
    games {
      id
      name
      scheduledStart
      notes
      venue
      weatherConditions
      gameFormat {
        id
        name
        playersPerTeam
        durationMinutes
      }
      gameTeams {
        id
        teamType
        finalScore
        formation
        team {
          id
          name
          shortName
          homePrimaryColor
          homeSecondaryColor
        }
      }
      createdAt
      updatedAt
    }
  }
`);

export const GET_GAME_BY_ID = graphql(/* GraphQL */ `
  query GetGameById($id: ID!) {
    game(id: $id) {
      id
      name
      scheduledStart
      notes
      venue
      weatherConditions
      gameFormat {
        id
        name
        playersPerTeam
        durationMinutes
      }
      gameTeams {
        id
        teamType
        finalScore
        formation
        team {
          id
          name
          shortName
          homePrimaryColor
          homeSecondaryColor
        }
      }
      createdAt
      updatedAt
    }
  }
`);

export const CREATE_GAME = graphql(/* GraphQL */ `
  mutation CreateGame($createGameInput: CreateGameInput!) {
    createGame(createGameInput: $createGameInput) {
      id
      name
      scheduledStart
      notes
      venue
      weatherConditions
      createdAt
      updatedAt
    }
  }
`);

export const UPDATE_GAME = graphql(/* GraphQL */ `
  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {
    updateGame(id: $id, updateGameInput: $updateGameInput) {
      id
      name
      scheduledStart
      notes
      venue
      weatherConditions
      createdAt
      updatedAt
    }
  }
`);

export const REMOVE_GAME = graphql(/* GraphQL */ `
  mutation RemoveGame($id: ID!) {
    removeGame(id: $id)
  }
`);

// TypeScript types - these would normally be generated
export interface Game {
  id: string;
  name: string;
  scheduledStart: string;
  notes?: string;
  venue?: string;
  weatherConditions?: string;
  gameFormat?: GameFormat;
  gameTeams?: GameTeam[];
  createdAt: string;
  updatedAt: string;
}

export interface GameFormat {
  id: string;
  name: string;
  playersPerTeam: number;
  durationMinutes: number;
  description?: string;
  allowsSubstitutions: boolean;
  maxSubstitutions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameTeam {
  id: string;
  teamType: string;
  finalScore?: number;
  formation?: string;
  team: {
    id: string;
    name: string;
    shortName?: string;
    homePrimaryColor?: string;
    homeSecondaryColor?: string;
  };
}

export interface CreateGameInput {
  name: string;
  scheduledStart: string;
  notes?: string;
  venue?: string;
  weatherConditions?: string;
  gameFormatId: string;
}

export interface UpdateGameInput {
  name?: string;
  scheduledStart?: string;
  notes?: string;
  venue?: string;
  weatherConditions?: string;
}

// Response types
export interface GamesResponse {
  games: Game[];
}

export interface GameResponse {
  game: Game;
}

export interface CreateGameResponse {
  createGame: Game;
}

export interface UpdateGameResponse {
  updateGame: Game;
}

// Enums
export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

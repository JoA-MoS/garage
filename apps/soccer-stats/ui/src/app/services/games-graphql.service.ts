import { gql } from '@apollo/client';

export const GET_GAME_FORMATS = gql`
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
`;

export const GET_GAMES = gql`
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
      createdAt
      updatedAt
      gameTeams {
        id
        teamType
        formation
        finalScore
        tacticalNotes
        team {
          id
          name
          homePrimaryColor
          homeSecondaryColor
          awayPrimaryColor
          awaySecondaryColor
          logoUrl
        }
      }
      gameEvents {
        id
        gameMinute
        gameSecond
        description
        position
        externalPlayerName
        externalPlayerNumber
        eventType {
          id
          name
          category
        }
        player {
          id
          firstName
          lastName
          email
        }
        recordedByUser {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

export const GET_GAME_BY_ID = gql`
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
        allowsSubstitutions
        maxSubstitutions
        description
      }
      createdAt
      updatedAt
      gameTeams {
        id
        teamType
        formation
        finalScore
        tacticalNotes
        team {
          id
          name
          homePrimaryColor
          homeSecondaryColor
          awayPrimaryColor
          awaySecondaryColor
          logoUrl
          playersWithJersey {
            id
            jersey
            depthRank
            isActive
            name
            position
          }
        }
      }
      gameEvents {
        id
        gameMinute
        gameSecond
        description
        position
        externalPlayerName
        externalPlayerNumber
        eventType {
          id
          name
          category
          requiresPosition
          allowsParent
        }
        player {
          id
          firstName
          lastName
          email
        }
        recordedByUser {
          id
          firstName
          lastName
        }
        parentEvent {
          id
          gameMinute
          gameSecond
        }
        childEvents {
          id
          gameMinute
          gameSecond
        }
      }
    }
  }
`;

export const CREATE_GAME = gql`
  mutation CreateGame($createGameInput: CreateGameInput!) {
    createGame(createGameInput: $createGameInput) {
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
      createdAt
      updatedAt
      gameTeams {
        id
        teamType
        formation
        finalScore
        team {
          id
          name
          homePrimaryColor
          homeSecondaryColor
          awayPrimaryColor
          awaySecondaryColor
          logoUrl
        }
      }
    }
  }
`;

export const UPDATE_GAME = gql`
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
`;

export const REMOVE_GAME = gql`
  mutation RemoveGame($id: ID!) {
    removeGame(id: $id)
  }
`;

// TypeScript interfaces for the GraphQL responses
export interface Player {
  id: string;
  name: string;
  position: string;
}

export interface Team {
  id: string;
  name: string;
  colors?: string;
  logo?: string;
}

export interface TeamPlayer {
  id: string;
  jersey: number;
  depthRank: number;
  isActive: boolean;
  player: Player;
}

export interface TeamWithPlayers extends Team {
  teamPlayers: TeamPlayer[];
}

export interface EventType {
  id: string;
  name: string;
  category: string;
}

export interface GameEvent {
  id: string;
  minute: number;
  timestamp: number;
  realTime: string;
  notes?: string;
  eventType: EventType;
  player: Player;
  relatedPlayer?: Player;
}

export interface GameTeam {
  __typename?: 'GameTeam';
  id: string;
  isHome: boolean;
  formation?: string;
  team: Team | TeamWithPlayers;
}

export interface GameParticipation {
  id: string;
  startMinute: number;
  endMinute?: number;
  isStarter: boolean;
  isOnField: boolean;
  minutesPlayed: number;
  player: Player;
  gameTeam?: {
    id: string;
    isHome: boolean;
    team: {
      id: string;
      name: string;
    };
  };
}

export enum GameStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export interface GameFormat {
  id: string;
  name: string;
  displayName: string;
  playersPerSide: number;
  minPlayers?: number;
  maxSubstitutions?: number;
  defaultDuration: number;
  description?: string;
  isActive: boolean;
}

export interface Game {
  __typename?: 'Game';
  id: string;
  name?: string;
  scheduledStart?: string;
  notes?: string;
  venue?: string;
  weatherConditions?: string;
  startTime?: string;
  endTime?: string;
  status: GameStatus;
  gameFormat: GameFormat;
  currentTime: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  gameTeams: GameTeam[];
  gameEvents?: GameEvent[];
  participations?: GameParticipation[];
  [key: string]: unknown; // Index signature for Apollo cache
}

export interface CreateGameInput {
  homeTeamId: string;
  awayTeamId: string;
  gameFormatId: string;
  duration: number; // Required with default 90
}

export interface UpdateGameInput {
  awayTeamId?: string;
  currentTime?: number;
  duration?: number;
  gameFormatId?: string;
  homeTeamId?: string;
  status?: GameStatus;
}

export interface RecordGoalInput {
  gameId: string;
  gameTeamId: string;
  playerId: string;
  assistPlayerId?: string;
  minute: number;
  timestamp: number;
  notes?: string;
}

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

export interface StartGameResponse {
  startGame: Pick<Game, 'id' | 'startTime' | 'status' | 'currentTime'>;
}

export interface PauseGameResponse {
  pauseGame: Pick<Game, 'id' | 'status' | 'currentTime'>;
}

export interface ResumeGameResponse {
  resumeGame: Pick<Game, 'id' | 'status' | 'currentTime'>;
}

export interface FinishGameResponse {
  finishGame: Pick<Game, 'id' | 'endTime' | 'status' | 'currentTime'>;
}

export interface RecordGoalResponse {
  recordGoal: GameEvent & {
    game: Pick<Game, 'id' | 'status'>;
    gameTeam: {
      id: string;
      isHome: boolean;
      team: Pick<Team, 'id' | 'name'>;
    };
  };
}

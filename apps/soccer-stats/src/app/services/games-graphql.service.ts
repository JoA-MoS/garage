import { gql } from '@apollo/client';

export const GET_GAME_FORMATS = gql`
  query GetGameFormats {
    gameFormats {
      id
      name
      displayName
      playersPerSide
      minPlayers
      maxSubstitutions
      defaultDuration
      description
      isActive
    }
  }
`;

export const GET_GAMES = gql`
  query GetGames {
    games {
      id
      startTime
      endTime
      status
      gameFormat {
        id
        name
        displayName
        playersPerSide
        defaultDuration
      }
      currentTime
      duration
      createdAt
      updatedAt
      gameTeams {
        id
        isHome
        formation
        team {
          id
          name
          colors
          logo
        }
      }
      gameEvents {
        id
        minute
        timestamp
        realTime
        notes
        eventType {
          id
          name
          category
        }
        player {
          id
          name
          position
        }
        relatedPlayer {
          id
          name
          position
        }
      }
      participations {
        id
        startMinute
        endMinute
        isStarter
        isOnField
        minutesPlayed
        player {
          id
          name
          position
        }
      }
    }
  }
`;

export const GET_GAME_BY_ID = gql`
  query GetGameById($id: ID!) {
    game(id: $id) {
      id
      startTime
      endTime
      status
      gameFormat {
        id
        name
        displayName
        playersPerSide
        minPlayers
        maxSubstitutions
        defaultDuration
        description
        isActive
      }
      currentTime
      duration
      createdAt
      updatedAt
      gameTeams {
        id
        isHome
        formation
        team {
          id
          name
          colors
          logo
          teamPlayers {
            id
            jersey
            depthRank
            isActive
            player {
              id
              name
              position
            }
          }
        }
      }
      gameEvents {
        id
        minute
        timestamp
        realTime
        notes
        eventType {
          id
          name
          category
        }
        player {
          id
          name
          position
        }
        relatedPlayer {
          id
          name
          position
        }
      }
      participations {
        id
        startMinute
        endMinute
        isStarter
        isOnField
        minutesPlayed
        player {
          id
          name
          position
        }
        gameTeam {
          id
          isHome
          team {
            id
            name
          }
        }
      }
    }
  }
`;

export const CREATE_GAME = gql`
  mutation CreateGame($createGameInput: CreateGameInput!) {
    createGame(createGameInput: $createGameInput) {
      id
      startTime
      endTime
      status
      gameFormat {
        id
        name
        displayName
        playersPerSide
        defaultDuration
      }
      currentTime
      duration
      createdAt
      updatedAt
      gameTeams {
        id
        isHome
        formation
        team {
          id
          name
          colors
          logo
        }
      }
    }
  }
`;

export const UPDATE_GAME = gql`
  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {
    updateGame(id: $id, updateGameInput: $updateGameInput) {
      id
      startTime
      endTime
      status
      format
      currentTime
      duration
      createdAt
      updatedAt
    }
  }
`;

export const START_GAME = gql`
  mutation StartGame($id: ID!) {
    startGame(id: $id) {
      id
      startTime
      status
      currentTime
    }
  }
`;

export const PAUSE_GAME = gql`
  mutation PauseGame($id: ID!) {
    pauseGame(id: $id) {
      id
      status
      currentTime
    }
  }
`;

export const RESUME_GAME = gql`
  mutation ResumeGame($id: ID!) {
    resumeGame(id: $id) {
      id
      status
      currentTime
    }
  }
`;

export const FINISH_GAME = gql`
  mutation FinishGame($id: ID!) {
    finishGame(id: $id) {
      id
      endTime
      status
      currentTime
    }
  }
`;

export const RECORD_GOAL = gql`
  mutation RecordGoal($recordGoalInput: RecordGoalInput!) {
    recordGoal(recordGoalInput: $recordGoalInput) {
      id
      minute
      timestamp
      realTime
      notes
      eventType {
        id
        name
        category
      }
      player {
        id
        name
        position
      }
      relatedPlayer {
        id
        name
        position
      }
      game {
        id
        status
      }
      gameTeam {
        id
        isHome
        team {
          id
          name
        }
      }
    }
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
  id: string;
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
}

export interface CreateGameInput {
  homeTeamId: string;
  awayTeamId: string;
  gameFormatId: string;
  duration?: number;
}

export interface UpdateGameInput {
  status?: GameStatus;
  currentTime?: number;
  endTime?: string;
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

/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any };
};

export type AddPlayerToTeamInput = {
  depthRank?: Scalars['Int']['input'];
  isActive?: Scalars['Boolean']['input'];
  jersey: Scalars['Int']['input'];
  playerId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
};

export type CreateGameFormatInput = {
  allowsSubstitutions?: Scalars['Boolean']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  displayName: Scalars['String']['input'];
  durationMinutes?: Scalars['Int']['input'];
  maxSubstitutions?: InputMaybe<Scalars['Int']['input']>;
  minPlayers?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  playersPerTeam: Scalars['Int']['input'];
};

export type CreateGameInput = {
  awayTeamId: Scalars['ID']['input'];
  duration?: Scalars['Int']['input'];
  gameFormatId: Scalars['ID']['input'];
  homeTeamId: Scalars['ID']['input'];
};

export type CreatePlayerInput = {
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  passwordHash: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTeamInput = {
  colors?: InputMaybe<Scalars['String']['input']>;
  customPositions?: InputMaybe<Array<TeamPositionInput>>;
  formation?: InputMaybe<Scalars['String']['input']>;
  gameFormat?: InputMaybe<Scalars['String']['input']>;
  logo?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type EventType = {
  __typename?: 'EventType';
  allowsParent: Scalars['Boolean']['output'];
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  gameEvents: Array<GameEvent>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  requiresPosition: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Game = {
  __typename?: 'Game';
  createdAt: Scalars['DateTime']['output'];
  gameEvents: Array<GameEvent>;
  gameFormat: GameFormat;
  gameFormatId: Scalars['ID']['output'];
  gameTeams: Array<GameTeam>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  scheduledStart?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  venue?: Maybe<Scalars['String']['output']>;
  weatherConditions?: Maybe<Scalars['String']['output']>;
};

export type GameEvent = {
  __typename?: 'GameEvent';
  childEvents: Array<GameEvent>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  eventType: EventType;
  eventTypeId: Scalars['ID']['output'];
  externalPlayerName?: Maybe<Scalars['String']['output']>;
  externalPlayerNumber?: Maybe<Scalars['String']['output']>;
  game: Game;
  gameId: Scalars['ID']['output'];
  gameMinute: Scalars['Int']['output'];
  gameSecond: Scalars['Int']['output'];
  gameTeam: GameTeam;
  gameTeamId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  parentEvent?: Maybe<GameEvent>;
  parentEventId?: Maybe<Scalars['ID']['output']>;
  player?: Maybe<User>;
  playerId?: Maybe<Scalars['ID']['output']>;
  position?: Maybe<Scalars['String']['output']>;
  recordedByUser: User;
  recordedByUserId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type GameFormat = {
  __typename?: 'GameFormat';
  allowsSubstitutions: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  durationMinutes: Scalars['Int']['output'];
  games: Array<Game>;
  id: Scalars['ID']['output'];
  maxSubstitutions?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  playersPerTeam: Scalars['Int']['output'];
  teamConfigurations: Array<TeamConfiguration>;
  updatedAt: Scalars['DateTime']['output'];
};

export type GameTeam = {
  __typename?: 'GameTeam';
  createdAt: Scalars['DateTime']['output'];
  finalScore?: Maybe<Scalars['Int']['output']>;
  formation?: Maybe<Scalars['String']['output']>;
  game: Game;
  gameEvents: Array<GameEvent>;
  gameId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  tacticalNotes?: Maybe<Scalars['String']['output']>;
  team: Team;
  teamId: Scalars['ID']['output'];
  teamType: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addPlayerToTeam: Team;
  createGame: Game;
  createGameFormat: GameFormat;
  createPlayer: User;
  createTeam: Team;
  createUnmanagedTeam: Team;
  findOrCreateUnmanagedTeam: Team;
  removeGame: Scalars['Boolean']['output'];
  removePlayer: Scalars['Boolean']['output'];
  removePlayerFromTeam: Team;
  removeTeam: Scalars['Boolean']['output'];
  seedGameFormats: Scalars['Boolean']['output'];
  updateGame: Game;
  updatePlayer: User;
  updateTeam: Team;
  upgradeToManagedTeam: Team;
};

export type MutationAddPlayerToTeamArgs = {
  addPlayerToTeamInput: AddPlayerToTeamInput;
};

export type MutationCreateGameArgs = {
  createGameInput: CreateGameInput;
};

export type MutationCreateGameFormatArgs = {
  input: CreateGameFormatInput;
};

export type MutationCreatePlayerArgs = {
  createPlayerInput: CreatePlayerInput;
};

export type MutationCreateTeamArgs = {
  createTeamInput: CreateTeamInput;
};

export type MutationCreateUnmanagedTeamArgs = {
  name: Scalars['String']['input'];
  shortName?: InputMaybe<Scalars['String']['input']>;
};

export type MutationFindOrCreateUnmanagedTeamArgs = {
  name: Scalars['String']['input'];
  shortName?: InputMaybe<Scalars['String']['input']>;
};

export type MutationRemoveGameArgs = {
  id: Scalars['ID']['input'];
};

export type MutationRemovePlayerArgs = {
  id: Scalars['ID']['input'];
};

export type MutationRemovePlayerFromTeamArgs = {
  playerId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
};

export type MutationRemoveTeamArgs = {
  id: Scalars['ID']['input'];
};

export type MutationUpdateGameArgs = {
  id: Scalars['ID']['input'];
  updateGameInput: UpdateGameInput;
};

export type MutationUpdatePlayerArgs = {
  id: Scalars['ID']['input'];
  updatePlayerInput: UpdatePlayerInput;
};

export type MutationUpdateTeamArgs = {
  id: Scalars['ID']['input'];
  updateTeamInput: UpdateTeamInput;
};

export type MutationUpgradeToManagedTeamArgs = {
  id: Scalars['ID']['input'];
  upgradeTeamInput: UpgradeTeamInput;
};

export type Query = {
  __typename?: 'Query';
  game: Game;
  gameFormat: GameFormat;
  gameFormats: Array<GameFormat>;
  games: Array<Game>;
  managedTeams: Array<Team>;
  player: User;
  players: Array<User>;
  playersByName: Array<User>;
  playersByPosition: Array<User>;
  team: Team;
  teams: Array<Team>;
  teamsByManagedStatus: Array<Team>;
  teamsByName: Array<Team>;
  unmanagedTeams: Array<Team>;
};

export type QueryGameArgs = {
  id: Scalars['ID']['input'];
};

export type QueryGameFormatArgs = {
  id: Scalars['ID']['input'];
};

export type QueryPlayerArgs = {
  id: Scalars['ID']['input'];
};

export type QueryPlayersByNameArgs = {
  name: Scalars['String']['input'];
};

export type QueryPlayersByPositionArgs = {
  position: Scalars['String']['input'];
};

export type QueryTeamArgs = {
  id: Scalars['ID']['input'];
};

export type QueryTeamsByManagedStatusArgs = {
  isManaged: Scalars['Boolean']['input'];
};

export type QueryTeamsByNameArgs = {
  name: Scalars['String']['input'];
};

/** The source of team data - internal (user created) or external (imported) */
export enum SourceType {
  External = 'EXTERNAL',
  Internal = 'INTERNAL',
}

export type Subscription = {
  __typename?: 'Subscription';
  gameCreated: Game;
  gameUpdated: Game;
  playerCreated: User;
  playerUpdated: User;
  teamCreated: Team;
  teamUpdated: Team;
};

export type Team = {
  __typename?: 'Team';
  awayPrimaryColor?: Maybe<Scalars['String']['output']>;
  awaySecondaryColor?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  externalReference?: Maybe<Scalars['String']['output']>;
  gameTeams: Array<GameTeam>;
  homePrimaryColor?: Maybe<Scalars['String']['output']>;
  homeSecondaryColor?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isManaged: Scalars['Boolean']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  players: Array<User>;
  playersWithJersey: Array<TeamPlayerWithJersey>;
  shortName?: Maybe<Scalars['String']['output']>;
  sourceType: SourceType;
  teamCoaches: Array<TeamCoach>;
  teamConfiguration?: Maybe<TeamConfiguration>;
  teamPlayers: Array<TeamPlayer>;
  updatedAt: Scalars['DateTime']['output'];
};

export type TeamCoach = {
  __typename?: 'TeamCoach';
  createdAt: Scalars['DateTime']['output'];
  endDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  role: Scalars['String']['output'];
  startDate: Scalars['DateTime']['output'];
  team: Team;
  teamId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type TeamConfiguration = {
  __typename?: 'TeamConfiguration';
  createdAt: Scalars['DateTime']['output'];
  defaultFormation: Scalars['String']['output'];
  defaultGameDuration: Scalars['Int']['output'];
  defaultGameFormat: GameFormat;
  defaultGameFormatId: Scalars['ID']['output'];
  defaultPlayerCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  team: Team;
  teamId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TeamPlayer = {
  __typename?: 'TeamPlayer';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  jerseyNumber?: Maybe<Scalars['String']['output']>;
  joinedDate?: Maybe<Scalars['DateTime']['output']>;
  leftDate?: Maybe<Scalars['DateTime']['output']>;
  primaryPosition?: Maybe<Scalars['String']['output']>;
  team: Team;
  teamId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type TeamPlayerWithJersey = {
  __typename?: 'TeamPlayerWithJersey';
  depthRank?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  jersey: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  position: Scalars['String']['output'];
};

export type TeamPositionInput = {
  abbreviation: Scalars['String']['input'];
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};

export type UpdateGameInput = {
  awayTeamId?: InputMaybe<Scalars['ID']['input']>;
  duration?: InputMaybe<Scalars['Int']['input']>;
  gameFormatId?: InputMaybe<Scalars['ID']['input']>;
  homeTeamId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdatePlayerInput = {
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  passwordHash?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTeamInput = {
  colors?: InputMaybe<Scalars['String']['input']>;
  customPositions?: InputMaybe<Array<TeamPositionInput>>;
  formation?: InputMaybe<Scalars['String']['input']>;
  gameFormat?: InputMaybe<Scalars['String']['input']>;
  logo?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpgradeTeamInput = {
  colors?: InputMaybe<Scalars['String']['input']>;
  customPositions?: InputMaybe<Array<TeamPositionInput>>;
  formation?: InputMaybe<Scalars['String']['input']>;
  gameFormat?: InputMaybe<Scalars['String']['input']>;
  logo?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  teamId: Scalars['ID']['input'];
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  dateOfBirth?: Maybe<Scalars['DateTime']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastName: Scalars['String']['output'];
  performedEvents: Array<GameEvent>;
  phone?: Maybe<Scalars['String']['output']>;
  recordedEvents: Array<GameEvent>;
  teamCoaches: Array<TeamCoach>;
  teamPlayers: Array<TeamPlayer>;
  teams: Array<Team>;
  updatedAt: Scalars['DateTime']['output'];
};

export type DebugGetTeamsQueryVariables = Exact<{ [key: string]: never }>;

export type DebugGetTeamsQuery = {
  __typename?: 'Query';
  teams: Array<{
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    description?: string | null;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
    awayPrimaryColor?: string | null;
    awaySecondaryColor?: string | null;
    logoUrl?: string | null;
    isActive: boolean;
    isManaged: boolean;
    sourceType: SourceType;
    createdAt: any;
    updatedAt: any;
  }>;
};

export type GetGameFormatsQueryVariables = Exact<{ [key: string]: never }>;

export type GetGameFormatsQuery = {
  __typename?: 'Query';
  gameFormats: Array<{
    __typename?: 'GameFormat';
    id: string;
    name: string;
    playersPerTeam: number;
    durationMinutes: number;
    description?: string | null;
    allowsSubstitutions: boolean;
    maxSubstitutions?: number | null;
    createdAt: any;
    updatedAt: any;
  }>;
};

export type GetGamesQueryVariables = Exact<{ [key: string]: never }>;

export type GetGamesQuery = {
  __typename?: 'Query';
  games: Array<{
    __typename?: 'Game';
    id: string;
    name?: string | null;
    scheduledStart?: any | null;
    notes?: string | null;
    venue?: string | null;
    weatherConditions?: string | null;
    createdAt: any;
    updatedAt: any;
    gameFormat: {
      __typename?: 'GameFormat';
      id: string;
      name: string;
      playersPerTeam: number;
      durationMinutes: number;
    };
    gameTeams: Array<{
      __typename?: 'GameTeam';
      id: string;
      teamType: string;
      formation?: string | null;
      finalScore?: number | null;
      tacticalNotes?: string | null;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        homePrimaryColor?: string | null;
        homeSecondaryColor?: string | null;
        awayPrimaryColor?: string | null;
        awaySecondaryColor?: string | null;
        logoUrl?: string | null;
      };
    }>;
    gameEvents: Array<{
      __typename?: 'GameEvent';
      id: string;
      gameMinute: number;
      gameSecond: number;
      description?: string | null;
      position?: string | null;
      externalPlayerName?: string | null;
      externalPlayerNumber?: string | null;
      eventType: {
        __typename?: 'EventType';
        id: string;
        name: string;
        category: string;
      };
      player?: {
        __typename?: 'User';
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      } | null;
      recordedByUser: {
        __typename?: 'User';
        id: string;
        firstName: string;
        lastName: string;
      };
    }>;
  }>;
};

export type GetGameByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetGameByIdQuery = {
  __typename?: 'Query';
  game: {
    __typename?: 'Game';
    id: string;
    name?: string | null;
    scheduledStart?: any | null;
    notes?: string | null;
    venue?: string | null;
    weatherConditions?: string | null;
    createdAt: any;
    updatedAt: any;
    gameFormat: {
      __typename?: 'GameFormat';
      id: string;
      name: string;
      playersPerTeam: number;
      durationMinutes: number;
      allowsSubstitutions: boolean;
      maxSubstitutions?: number | null;
      description?: string | null;
    };
    gameTeams: Array<{
      __typename?: 'GameTeam';
      id: string;
      teamType: string;
      formation?: string | null;
      finalScore?: number | null;
      tacticalNotes?: string | null;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        homePrimaryColor?: string | null;
        homeSecondaryColor?: string | null;
        awayPrimaryColor?: string | null;
        awaySecondaryColor?: string | null;
        logoUrl?: string | null;
        playersWithJersey: Array<{
          __typename?: 'TeamPlayerWithJersey';
          id: string;
          jersey: number;
          depthRank?: number | null;
          isActive: boolean;
          name: string;
          position: string;
        }>;
      };
    }>;
    gameEvents: Array<{
      __typename?: 'GameEvent';
      id: string;
      gameMinute: number;
      gameSecond: number;
      description?: string | null;
      position?: string | null;
      externalPlayerName?: string | null;
      externalPlayerNumber?: string | null;
      eventType: {
        __typename?: 'EventType';
        id: string;
        name: string;
        category: string;
        requiresPosition: boolean;
        allowsParent: boolean;
      };
      player?: {
        __typename?: 'User';
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      } | null;
      recordedByUser: {
        __typename?: 'User';
        id: string;
        firstName: string;
        lastName: string;
      };
      parentEvent?: {
        __typename?: 'GameEvent';
        id: string;
        gameMinute: number;
        gameSecond: number;
      } | null;
      childEvents: Array<{
        __typename?: 'GameEvent';
        id: string;
        gameMinute: number;
        gameSecond: number;
      }>;
    }>;
  };
};

export type CreateGameMutationVariables = Exact<{
  createGameInput: CreateGameInput;
}>;

export type CreateGameMutation = {
  __typename?: 'Mutation';
  createGame: {
    __typename?: 'Game';
    id: string;
    name?: string | null;
    scheduledStart?: any | null;
    notes?: string | null;
    venue?: string | null;
    weatherConditions?: string | null;
    createdAt: any;
    updatedAt: any;
    gameFormat: {
      __typename?: 'GameFormat';
      id: string;
      name: string;
      playersPerTeam: number;
      durationMinutes: number;
    };
    gameTeams: Array<{
      __typename?: 'GameTeam';
      id: string;
      teamType: string;
      formation?: string | null;
      finalScore?: number | null;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        homePrimaryColor?: string | null;
        homeSecondaryColor?: string | null;
        awayPrimaryColor?: string | null;
        awaySecondaryColor?: string | null;
        logoUrl?: string | null;
      };
    }>;
  };
};

export type UpdateGameMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  updateGameInput: UpdateGameInput;
}>;

export type UpdateGameMutation = {
  __typename?: 'Mutation';
  updateGame: {
    __typename?: 'Game';
    id: string;
    name?: string | null;
    scheduledStart?: any | null;
    notes?: string | null;
    venue?: string | null;
    weatherConditions?: string | null;
    createdAt: any;
    updatedAt: any;
  };
};

export type RemoveGameMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type RemoveGameMutation = {
  __typename?: 'Mutation';
  removeGame: boolean;
};

export type GetPlayersQueryVariables = Exact<{ [key: string]: never }>;

export type GetPlayersQuery = {
  __typename?: 'Query';
  players: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
    teams: Array<{
      __typename?: 'Team';
      id: string;
      name: string;
      shortName?: string | null;
    }>;
    teamPlayers: Array<{
      __typename?: 'TeamPlayer';
      id: string;
      jerseyNumber?: string | null;
      primaryPosition?: string | null;
      isActive: boolean;
      team: { __typename?: 'Team'; id: string; name: string };
    }>;
  }>;
};

export type CreatePlayerMutationVariables = Exact<{
  createPlayerInput: CreatePlayerInput;
}>;

export type CreatePlayerMutation = {
  __typename?: 'Mutation';
  createPlayer: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
  };
};

export type AddPlayerToTeamBasicMutationVariables = Exact<{
  addPlayerToTeamInput: AddPlayerToTeamInput;
}>;

export type AddPlayerToTeamBasicMutation = {
  __typename?: 'Mutation';
  addPlayerToTeam: { __typename?: 'Team'; id: string; name: string };
};

export type GetPlayerByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetPlayerByIdQuery = {
  __typename?: 'Query';
  player: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
    teams: Array<{
      __typename?: 'Team';
      id: string;
      name: string;
      shortName?: string | null;
      homePrimaryColor?: string | null;
      homeSecondaryColor?: string | null;
      awayPrimaryColor?: string | null;
      awaySecondaryColor?: string | null;
      logoUrl?: string | null;
    }>;
    teamPlayers: Array<{
      __typename?: 'TeamPlayer';
      id: string;
      jerseyNumber?: string | null;
      primaryPosition?: string | null;
      isActive: boolean;
      joinedDate?: any | null;
      leftDate?: any | null;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        shortName?: string | null;
      };
    }>;
    performedEvents: Array<{
      __typename?: 'GameEvent';
      id: string;
      gameMinute: number;
      gameSecond: number;
      description?: string | null;
      eventType: {
        __typename?: 'EventType';
        id: string;
        name: string;
        category: string;
      };
      game: {
        __typename?: 'Game';
        id: string;
        name?: string | null;
        scheduledStart?: any | null;
      };
    }>;
  };
};

export type UpdatePlayerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  updatePlayerInput: UpdatePlayerInput;
}>;

export type UpdatePlayerMutation = {
  __typename?: 'Mutation';
  updatePlayer: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    updatedAt: any;
  };
};

export type RemovePlayerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type RemovePlayerMutation = {
  __typename?: 'Mutation';
  removePlayer: boolean;
};

export type RemovePlayerFromTeamMutationVariables = Exact<{
  playerId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
}>;

export type RemovePlayerFromTeamMutation = {
  __typename?: 'Mutation';
  removePlayerFromTeam: {
    __typename?: 'Team';
    id: string;
    name: string;
    players: Array<{
      __typename?: 'User';
      id: string;
      firstName: string;
      lastName: string;
    }>;
  };
};

export type GetTeamsQueryVariables = Exact<{ [key: string]: never }>;

export type GetTeamsQuery = {
  __typename?: 'Query';
  teams: Array<{
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    description?: string | null;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
    awayPrimaryColor?: string | null;
    awaySecondaryColor?: string | null;
    logoUrl?: string | null;
    isActive: boolean;
    isManaged: boolean;
    sourceType: SourceType;
    createdAt: any;
    updatedAt: any;
  }>;
};

export type GetTeamByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetTeamByIdQuery = {
  __typename?: 'Query';
  team: {
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    description?: string | null;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
    awayPrimaryColor?: string | null;
    awaySecondaryColor?: string | null;
    logoUrl?: string | null;
    isActive: boolean;
    isManaged: boolean;
    sourceType: SourceType;
    createdAt: any;
    updatedAt: any;
    playersWithJersey: Array<{
      __typename?: 'TeamPlayerWithJersey';
      id: string;
      name: string;
      position: string;
      jersey: number;
      depthRank?: number | null;
      isActive: boolean;
    }>;
    teamPlayers: Array<{
      __typename?: 'TeamPlayer';
      id: string;
      jerseyNumber?: string | null;
      primaryPosition?: string | null;
      isActive: boolean;
      joinedDate?: any | null;
      leftDate?: any | null;
      user: {
        __typename?: 'User';
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
    teamConfiguration?: {
      __typename?: 'TeamConfiguration';
      id: string;
      defaultFormation: string;
      defaultGameDuration: number;
      defaultPlayerCount: number;
      defaultGameFormat: {
        __typename?: 'GameFormat';
        id: string;
        name: string;
        playersPerTeam: number;
        durationMinutes: number;
      };
    } | null;
    gameTeams: Array<{
      __typename?: 'GameTeam';
      id: string;
      teamType: string;
      finalScore?: number | null;
      formation?: string | null;
      game: {
        __typename?: 'Game';
        id: string;
        name?: string | null;
        scheduledStart?: any | null;
      };
    }>;
  };
};

export type CreateTeamMutationVariables = Exact<{
  createTeamInput: CreateTeamInput;
}>;

export type CreateTeamMutation = {
  __typename?: 'Mutation';
  createTeam: {
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    description?: string | null;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
    awayPrimaryColor?: string | null;
    awaySecondaryColor?: string | null;
    logoUrl?: string | null;
    isActive: boolean;
    isManaged: boolean;
    sourceType: SourceType;
    createdAt: any;
    updatedAt: any;
  };
};

export type UpdateTeamMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  updateTeamInput: UpdateTeamInput;
}>;

export type UpdateTeamMutation = {
  __typename?: 'Mutation';
  updateTeam: {
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    description?: string | null;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
    awayPrimaryColor?: string | null;
    awaySecondaryColor?: string | null;
    logoUrl?: string | null;
    isActive: boolean;
    isManaged: boolean;
    createdAt: any;
    updatedAt: any;
  };
};

export type AddPlayerToTeamWithDetailsMutationVariables = Exact<{
  addPlayerToTeamInput: AddPlayerToTeamInput;
}>;

export type AddPlayerToTeamWithDetailsMutation = {
  __typename?: 'Mutation';
  addPlayerToTeam: {
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
    awayPrimaryColor?: string | null;
    awaySecondaryColor?: string | null;
    logoUrl?: string | null;
    createdAt: any;
    updatedAt: any;
    players: Array<{
      __typename?: 'User';
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>;
    playersWithJersey: Array<{
      __typename?: 'TeamPlayerWithJersey';
      id: string;
      name: string;
      position: string;
      jersey: number;
      depthRank?: number | null;
      isActive: boolean;
    }>;
  };
};

export type CreateUnmanagedTeamMutationVariables = Exact<{
  name: Scalars['String']['input'];
  shortName?: InputMaybe<Scalars['String']['input']>;
}>;

export type CreateUnmanagedTeamMutation = {
  __typename?: 'Mutation';
  createUnmanagedTeam: {
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    isManaged: boolean;
    sourceType: SourceType;
    createdAt: any;
    updatedAt: any;
  };
};

export type FindOrCreateUnmanagedTeamMutationVariables = Exact<{
  name: Scalars['String']['input'];
  shortName?: InputMaybe<Scalars['String']['input']>;
}>;

export type FindOrCreateUnmanagedTeamMutation = {
  __typename?: 'Mutation';
  findOrCreateUnmanagedTeam: {
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    isManaged: boolean;
    sourceType: SourceType;
    createdAt: any;
    updatedAt: any;
  };
};

export type GetManagedTeamsQueryVariables = Exact<{ [key: string]: never }>;

export type GetManagedTeamsQuery = {
  __typename?: 'Query';
  managedTeams: Array<{
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
    awayPrimaryColor?: string | null;
    awaySecondaryColor?: string | null;
    logoUrl?: string | null;
    isActive: boolean;
    isManaged: boolean;
    sourceType: SourceType;
    createdAt: any;
    updatedAt: any;
  }>;
};

export type GetUnmanagedTeamsQueryVariables = Exact<{ [key: string]: never }>;

export type GetUnmanagedTeamsQuery = {
  __typename?: 'Query';
  unmanagedTeams: Array<{
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    isManaged: boolean;
    sourceType: SourceType;
    createdAt: any;
    updatedAt: any;
  }>;
};

export type GetTeamsByManagedStatusQueryVariables = Exact<{
  isManaged: Scalars['Boolean']['input'];
}>;

export type GetTeamsByManagedStatusQuery = {
  __typename?: 'Query';
  teamsByManagedStatus: Array<{
    __typename?: 'Team';
    id: string;
    name: string;
    shortName?: string | null;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
    awayPrimaryColor?: string | null;
    awaySecondaryColor?: string | null;
    logoUrl?: string | null;
    isActive: boolean;
    isManaged: boolean;
    sourceType: SourceType;
    createdAt: any;
    updatedAt: any;
  }>;
};

export const DebugGetTeamsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'DebugGetTeams' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'teams' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homePrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homeSecondaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awayPrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awaySecondaryColor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'logoUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DebugGetTeamsQuery, DebugGetTeamsQueryVariables>;
export const GetGameFormatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetGameFormats' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'gameFormats' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'playersPerTeam' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'durationMinutes' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'allowsSubstitutions' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'maxSubstitutions' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetGameFormatsQuery, GetGameFormatsQueryVariables>;
export const GetGamesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetGames' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'games' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'scheduledStart' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'venue' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'weatherConditions' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'gameFormat' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playersPerTeam' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'durationMinutes' },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'gameTeams' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'teamType' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'formation' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'finalScore' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tacticalNotes' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'homePrimaryColor' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'homeSecondaryColor',
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'awayPrimaryColor' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'awaySecondaryColor',
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'logoUrl' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'gameEvents' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameMinute' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameSecond' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'description' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'externalPlayerName' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'externalPlayerNumber' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'eventType' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'category' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'player' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'firstName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'lastName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'email' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'recordedByUser' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'firstName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'lastName' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetGamesQuery, GetGamesQueryVariables>;
export const GetGameByIdDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetGameById' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'game' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'scheduledStart' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'venue' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'weatherConditions' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'gameFormat' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playersPerTeam' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'durationMinutes' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'allowsSubstitutions' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'maxSubstitutions' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'description' },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'gameTeams' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'teamType' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'formation' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'finalScore' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tacticalNotes' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'homePrimaryColor' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'homeSecondaryColor',
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'awayPrimaryColor' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'awaySecondaryColor',
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'logoUrl' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'playersWithJersey',
                              },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'jersey' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'depthRank' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'isActive' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'name' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'position' },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'gameEvents' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameMinute' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameSecond' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'description' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'externalPlayerName' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'externalPlayerNumber' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'eventType' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'category' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'requiresPosition' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'allowsParent' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'player' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'firstName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'lastName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'email' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'recordedByUser' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'firstName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'lastName' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'parentEvent' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'gameMinute' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'gameSecond' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'childEvents' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'gameMinute' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'gameSecond' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetGameByIdQuery, GetGameByIdQueryVariables>;
export const CreateGameDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateGame' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'createGameInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CreateGameInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createGame' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'createGameInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'createGameInput' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'scheduledStart' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'venue' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'weatherConditions' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'gameFormat' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playersPerTeam' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'durationMinutes' },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'gameTeams' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'teamType' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'formation' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'finalScore' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'homePrimaryColor' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'homeSecondaryColor',
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'awayPrimaryColor' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'awaySecondaryColor',
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'logoUrl' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateGameMutation, CreateGameMutationVariables>;
export const UpdateGameDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateGame' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'updateGameInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateGameInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateGame' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'updateGameInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'updateGameInput' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'scheduledStart' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'venue' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'weatherConditions' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateGameMutation, UpdateGameMutationVariables>;
export const RemoveGameDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveGame' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'removeGame' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RemoveGameMutation, RemoveGameMutationVariables>;
export const GetPlayersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetPlayers' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'players' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dateOfBirth' } },
                { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teams' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'shortName' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamPlayers' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'jerseyNumber' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'primaryPosition' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'isActive' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetPlayersQuery, GetPlayersQueryVariables>;
export const CreatePlayerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreatePlayer' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'createPlayerInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CreatePlayerInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createPlayer' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'createPlayerInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'createPlayerInput' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dateOfBirth' } },
                { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  CreatePlayerMutation,
  CreatePlayerMutationVariables
>;
export const AddPlayerToTeamBasicDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddPlayerToTeamBasic' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'addPlayerToTeamInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'AddPlayerToTeamInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addPlayerToTeam' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'addPlayerToTeamInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'addPlayerToTeamInput' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  AddPlayerToTeamBasicMutation,
  AddPlayerToTeamBasicMutationVariables
>;
export const GetPlayerByIdDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetPlayerById' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'player' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dateOfBirth' } },
                { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teams' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'shortName' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'homePrimaryColor' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'homeSecondaryColor' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'awayPrimaryColor' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'awaySecondaryColor' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'logoUrl' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamPlayers' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'jerseyNumber' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'primaryPosition' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'isActive' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'joinedDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'leftDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'shortName' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'performedEvents' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameMinute' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameSecond' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'description' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'eventType' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'category' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'game' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'scheduledStart' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetPlayerByIdQuery, GetPlayerByIdQueryVariables>;
export const UpdatePlayerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdatePlayer' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'updatePlayerInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdatePlayerInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatePlayer' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'updatePlayerInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'updatePlayerInput' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dateOfBirth' } },
                { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdatePlayerMutation,
  UpdatePlayerMutationVariables
>;
export const RemovePlayerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemovePlayer' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'removePlayer' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  RemovePlayerMutation,
  RemovePlayerMutationVariables
>;
export const RemovePlayerFromTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemovePlayerFromTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'playerId' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'teamId' },
          },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'removePlayerFromTeam' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'playerId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'playerId' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'teamId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'teamId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'players' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'firstName' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lastName' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  RemovePlayerFromTeamMutation,
  RemovePlayerFromTeamMutationVariables
>;
export const GetTeamsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetTeams' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'teams' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homePrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homeSecondaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awayPrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awaySecondaryColor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'logoUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetTeamsQuery, GetTeamsQueryVariables>;
export const GetTeamByIdDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetTeamById' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'team' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homePrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homeSecondaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awayPrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awaySecondaryColor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'logoUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'playersWithJersey' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'jersey' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'depthRank' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'isActive' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamPlayers' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'jerseyNumber' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'primaryPosition' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'isActive' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'joinedDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'leftDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'user' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'firstName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'lastName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'email' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamConfiguration' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'defaultFormation' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'defaultGameDuration' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'defaultPlayerCount' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'defaultGameFormat' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'playersPerTeam' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'durationMinutes' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'gameTeams' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'teamType' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'finalScore' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'formation' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'game' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'scheduledStart' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetTeamByIdQuery, GetTeamByIdQueryVariables>;
export const CreateTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'createTeamInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CreateTeamInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createTeam' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'createTeamInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'createTeamInput' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homePrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homeSecondaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awayPrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awaySecondaryColor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'logoUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateTeamMutation, CreateTeamMutationVariables>;
export const UpdateTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'updateTeamInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateTeamInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateTeam' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'updateTeamInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'updateTeamInput' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homePrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homeSecondaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awayPrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awaySecondaryColor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'logoUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateTeamMutation, UpdateTeamMutationVariables>;
export const AddPlayerToTeamWithDetailsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddPlayerToTeamWithDetails' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'addPlayerToTeamInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'AddPlayerToTeamInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addPlayerToTeam' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'addPlayerToTeamInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'addPlayerToTeamInput' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homePrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homeSecondaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awayPrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awaySecondaryColor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'logoUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'players' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'firstName' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lastName' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'playersWithJersey' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'jersey' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'depthRank' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'isActive' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  AddPlayerToTeamWithDetailsMutation,
  AddPlayerToTeamWithDetailsMutationVariables
>;
export const CreateUnmanagedTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateUnmanagedTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'shortName' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createUnmanagedTeam' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'name' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'shortName' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'shortName' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  CreateUnmanagedTeamMutation,
  CreateUnmanagedTeamMutationVariables
>;
export const FindOrCreateUnmanagedTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'FindOrCreateUnmanagedTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'shortName' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'findOrCreateUnmanagedTeam' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'name' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'shortName' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'shortName' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  FindOrCreateUnmanagedTeamMutation,
  FindOrCreateUnmanagedTeamMutationVariables
>;
export const GetManagedTeamsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetManagedTeams' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'managedTeams' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homePrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homeSecondaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awayPrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awaySecondaryColor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'logoUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetManagedTeamsQuery,
  GetManagedTeamsQueryVariables
>;
export const GetUnmanagedTeamsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetUnmanagedTeams' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'unmanagedTeams' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetUnmanagedTeamsQuery,
  GetUnmanagedTeamsQueryVariables
>;
export const GetTeamsByManagedStatusDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetTeamsByManagedStatus' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'isManaged' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Boolean' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'teamsByManagedStatus' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'isManaged' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'isManaged' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'shortName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homePrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'homeSecondaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awayPrimaryColor' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'awaySecondaryColor' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'logoUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isManaged' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sourceType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetTeamsByManagedStatusQuery,
  GetTeamsByManagedStatusQueryVariables
>;

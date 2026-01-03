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

export type AddToBenchInput = {
  externalPlayerName?: InputMaybe<Scalars['String']['input']>;
  externalPlayerNumber?: InputMaybe<Scalars['String']['input']>;
  gameTeamId: Scalars['ID']['input'];
  playerId?: InputMaybe<Scalars['ID']['input']>;
};

export type AddToLineupInput = {
  externalPlayerName?: InputMaybe<Scalars['String']['input']>;
  externalPlayerNumber?: InputMaybe<Scalars['String']['input']>;
  gameTeamId: Scalars['ID']['input'];
  playerId?: InputMaybe<Scalars['ID']['input']>;
  position: Scalars['String']['input'];
};

export type BatchLineupChangesInput = {
  /** Game minute when changes occur */
  gameMinute: Scalars['Int']['input'];
  /** Game second when changes occur */
  gameSecond?: Scalars['Int']['input'];
  gameTeamId: Scalars['ID']['input'];
  /** List of substitutions to process (processed first) */
  substitutions?: Array<BatchSubstitutionInput>;
  /** List of position swaps to process (processed after substitutions) */
  swaps?: Array<BatchSwapInput>;
};

export type BatchSubstitutionInput = {
  /** External player name if substituting in an opponent player */
  externalPlayerInName?: InputMaybe<Scalars['String']['input']>;
  /** External player number if substituting in an opponent player */
  externalPlayerInNumber?: InputMaybe<Scalars['String']['input']>;
  /** Player ID if substituting in a managed roster player */
  playerInId?: InputMaybe<Scalars['ID']['input']>;
  /** The GameEvent ID of the player being substituted out */
  playerOutEventId: Scalars['ID']['input'];
};

export type BatchSwapInput = {
  /** First player reference (will get player2 position). Use eventId for on-field players, or substitutionIndex to reference an incoming player from a queued substitution. */
  player1: BatchSwapPlayerRef;
  /** Second player reference (will get player1 position). Use eventId for on-field players, or substitutionIndex to reference an incoming player from a queued substitution. */
  player2: BatchSwapPlayerRef;
};

export type BatchSwapPlayerRef = {
  /** The GameEvent ID for an on-field player */
  eventId?: InputMaybe<Scalars['ID']['input']>;
  /** Index of a substitution in the batch (0-based) to reference the incoming player */
  substitutionIndex?: InputMaybe<Scalars['Int']['input']>;
};

export type ConflictInfo = {
  __typename?: 'ConflictInfo';
  conflictId: Scalars['ID']['output'];
  conflictingEvents: Array<ConflictingEvent>;
  eventType: Scalars['String']['output'];
  gameMinute: Scalars['Int']['output'];
  gameSecond: Scalars['Int']['output'];
};

export type ConflictingEvent = {
  __typename?: 'ConflictingEvent';
  eventId: Scalars['ID']['output'];
  playerId?: Maybe<Scalars['ID']['output']>;
  playerName: Scalars['String']['output'];
  recordedByUserName: Scalars['String']['output'];
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
  awayPrimaryColor?: InputMaybe<Scalars['String']['input']>;
  awaySecondaryColor?: InputMaybe<Scalars['String']['input']>;
  colors?: InputMaybe<Scalars['String']['input']>;
  customPositions?: InputMaybe<Array<TeamPositionInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  formation?: InputMaybe<Scalars['String']['input']>;
  gameFormat?: InputMaybe<Scalars['String']['input']>;
  homePrimaryColor?: InputMaybe<Scalars['String']['input']>;
  homeSecondaryColor?: InputMaybe<Scalars['String']['input']>;
  logo?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  shortName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateUserInput = {
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  passwordHash?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type DependentEvent = {
  __typename?: 'DependentEvent';
  description?: Maybe<Scalars['String']['output']>;
  eventType: Scalars['String']['output'];
  gameMinute: Scalars['Int']['output'];
  gameSecond: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  playerName?: Maybe<Scalars['String']['output']>;
};

export type DependentEventsResult = {
  __typename?: 'DependentEventsResult';
  canDelete: Scalars['Boolean']['output'];
  count: Scalars['Int']['output'];
  dependentEvents: Array<DependentEvent>;
  warningMessage?: Maybe<Scalars['String']['output']>;
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
  actualEnd?: Maybe<Scalars['DateTime']['output']>;
  actualStart?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  firstHalfEnd?: Maybe<Scalars['DateTime']['output']>;
  gameEvents?: Maybe<Array<GameEvent>>;
  gameFormat: GameFormat;
  gameFormatId: Scalars['ID']['output'];
  gameTeams?: Maybe<Array<GameTeam>>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  /** When the game clock was paused (null = not paused) */
  pausedAt?: Maybe<Scalars['DateTime']['output']>;
  scheduledStart?: Maybe<Scalars['DateTime']['output']>;
  secondHalfStart?: Maybe<Scalars['DateTime']['output']>;
  /** Override for stats tracking level (null = use team default) */
  statsTrackingLevel?: Maybe<StatsTrackingLevel>;
  status: GameStatus;
  updatedAt: Scalars['DateTime']['output'];
  venue?: Maybe<Scalars['String']['output']>;
  weatherConditions?: Maybe<Scalars['String']['output']>;
};

export type GameEvent = {
  __typename?: 'GameEvent';
  childEvents: Array<GameEvent>;
  conflictId?: Maybe<Scalars['ID']['output']>;
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

/** The type of action that occurred on a game event */
export enum GameEventAction {
  ConflictDetected = 'CONFLICT_DETECTED',
  Created = 'CREATED',
  Deleted = 'DELETED',
  DuplicateDetected = 'DUPLICATE_DETECTED',
  Updated = 'UPDATED',
}

export type GameEventSubscriptionPayload = {
  __typename?: 'GameEventSubscriptionPayload';
  action: GameEventAction;
  conflict?: Maybe<ConflictInfo>;
  deletedEventId?: Maybe<Scalars['ID']['output']>;
  event?: Maybe<GameEvent>;
  gameId: Scalars['ID']['output'];
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

export type GameLineup = {
  __typename?: 'GameLineup';
  bench: Array<LineupPlayer>;
  currentOnField: Array<LineupPlayer>;
  formation?: Maybe<Scalars['String']['output']>;
  gameTeamId: Scalars['ID']['output'];
  starters: Array<LineupPlayer>;
};

/** The status of a game */
export enum GameStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  FirstHalf = 'FIRST_HALF',
  Halftime = 'HALFTIME',
  InProgress = 'IN_PROGRESS',
  Scheduled = 'SCHEDULED',
  SecondHalf = 'SECOND_HALF',
}

export type GameTeam = {
  __typename?: 'GameTeam';
  createdAt: Scalars['DateTime']['output'];
  finalScore?: Maybe<Scalars['Int']['output']>;
  formation?: Maybe<Scalars['String']['output']>;
  game: Game;
  gameEvents?: Maybe<Array<GameEvent>>;
  gameId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  tacticalNotes?: Maybe<Scalars['String']['output']>;
  team: Team;
  teamId: Scalars['ID']['output'];
  teamType: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Controls visibility of last name to other users */
export enum LastNameVisibility {
  Public = 'PUBLIC',
  TeamOnly = 'TEAM_ONLY',
}

export type LineupPlayer = {
  __typename?: 'LineupPlayer';
  externalPlayerName?: Maybe<Scalars['String']['output']>;
  externalPlayerNumber?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  gameEventId: Scalars['ID']['output'];
  isOnField: Scalars['Boolean']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  playerId?: Maybe<Scalars['ID']['output']>;
  playerName?: Maybe<Scalars['String']['output']>;
  position?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addCoachToTeam: TeamCoach;
  addPlayerToBench: GameEvent;
  addPlayerToLineup: GameEvent;
  addPlayerToTeam: TeamPlayer;
  addTeamMember: TeamMember;
  /** Backfill ownership for teams created by the current user that do not have an owner. Returns the list of teams that were updated. */
  backfillMyTeamOwners: Array<Team>;
  /** Process multiple lineup changes (substitutions and swaps) in a single request */
  batchLineupChanges: Array<GameEvent>;
  createCoach: User;
  createGame: Game;
  createGameFormat: GameFormat;
  createPlayer: User;
  createTeam: Team;
  createUnmanagedTeam: Team;
  createUser: User;
  deleteEventWithCascade: Scalars['Boolean']['output'];
  deleteGoal: Scalars['Boolean']['output'];
  deletePositionSwap: Scalars['Boolean']['output'];
  deleteStarterEntry: Scalars['Boolean']['output'];
  deleteSubstitution: Scalars['Boolean']['output'];
  findOrCreateUnmanagedTeam: Team;
  promoteGuestCoach: TeamMember;
  recordGoal: GameEvent;
  removeCoachFromTeam: Scalars['Boolean']['output'];
  removeFromLineup: Scalars['Boolean']['output'];
  removeGame: Scalars['Boolean']['output'];
  removePlayer: Scalars['Boolean']['output'];
  removePlayerFromTeam: Scalars['Boolean']['output'];
  removeTeam: Scalars['Boolean']['output'];
  removeTeamMember: Scalars['Boolean']['output'];
  removeUser: Scalars['Boolean']['output'];
  resolveEventConflict: GameEvent;
  seedGameFormats: Scalars['Boolean']['output'];
  substitutePlayer: Array<GameEvent>;
  swapPositions: Array<GameEvent>;
  /** Returns the new owner */
  transferTeamOwnership: TeamMember;
  updateCoach: User;
  updateGame: Game;
  updateGoal: GameEvent;
  updatePlayer: User;
  updatePlayerPosition: GameEvent;
  updateTeam: Team;
  /** Update team configuration settings (defaults for stats tracking, formation, lineup) */
  updateTeamConfiguration: TeamConfiguration;
  updateTeamMemberRole: TeamMember;
  updateUser: User;
  upgradeToManagedTeam: Team;
};

export type MutationAddCoachToTeamArgs = {
  role: Scalars['String']['input'];
  startDate: Scalars['DateTime']['input'];
  teamId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type MutationAddPlayerToBenchArgs = {
  input: AddToBenchInput;
};

export type MutationAddPlayerToLineupArgs = {
  input: AddToLineupInput;
};

export type MutationAddPlayerToTeamArgs = {
  jerseyNumber?: InputMaybe<Scalars['String']['input']>;
  joinedDate?: InputMaybe<Scalars['DateTime']['input']>;
  primaryPosition?: InputMaybe<Scalars['String']['input']>;
  teamId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type MutationAddTeamMemberArgs = {
  isGuest?: InputMaybe<Scalars['Boolean']['input']>;
  linkedPlayerId?: InputMaybe<Scalars['ID']['input']>;
  role: TeamRole;
  teamId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type MutationBatchLineupChangesArgs = {
  input: BatchLineupChangesInput;
};

export type MutationCreateCoachArgs = {
  createCoachInput: CreateUserInput;
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

export type MutationCreateUserArgs = {
  createUserInput: CreateUserInput;
};

export type MutationDeleteEventWithCascadeArgs = {
  eventType: Scalars['String']['input'];
  gameEventId: Scalars['ID']['input'];
};

export type MutationDeleteGoalArgs = {
  gameEventId: Scalars['ID']['input'];
};

export type MutationDeletePositionSwapArgs = {
  gameEventId: Scalars['ID']['input'];
};

export type MutationDeleteStarterEntryArgs = {
  gameEventId: Scalars['ID']['input'];
};

export type MutationDeleteSubstitutionArgs = {
  gameEventId: Scalars['ID']['input'];
};

export type MutationFindOrCreateUnmanagedTeamArgs = {
  name: Scalars['String']['input'];
  shortName?: InputMaybe<Scalars['String']['input']>;
};

export type MutationPromoteGuestCoachArgs = {
  membershipId: Scalars['ID']['input'];
};

export type MutationRecordGoalArgs = {
  input: RecordGoalInput;
};

export type MutationRemoveCoachFromTeamArgs = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  teamId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type MutationRemoveFromLineupArgs = {
  gameEventId: Scalars['ID']['input'];
};

export type MutationRemoveGameArgs = {
  id: Scalars['ID']['input'];
};

export type MutationRemovePlayerArgs = {
  id: Scalars['ID']['input'];
};

export type MutationRemovePlayerFromTeamArgs = {
  leftDate?: InputMaybe<Scalars['DateTime']['input']>;
  teamId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type MutationRemoveTeamArgs = {
  id: Scalars['ID']['input'];
};

export type MutationRemoveTeamMemberArgs = {
  membershipId: Scalars['ID']['input'];
};

export type MutationRemoveUserArgs = {
  id: Scalars['ID']['input'];
};

export type MutationResolveEventConflictArgs = {
  conflictId: Scalars['ID']['input'];
  keepAll?: InputMaybe<Scalars['Boolean']['input']>;
  selectedEventId: Scalars['ID']['input'];
};

export type MutationSubstitutePlayerArgs = {
  input: SubstitutePlayerInput;
};

export type MutationSwapPositionsArgs = {
  input: SwapPositionsInput;
};

export type MutationTransferTeamOwnershipArgs = {
  newOwnerId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
};

export type MutationUpdateCoachArgs = {
  id: Scalars['ID']['input'];
  updateCoachInput: UpdateUserInput;
};

export type MutationUpdateGameArgs = {
  id: Scalars['ID']['input'];
  updateGameInput: UpdateGameInput;
};

export type MutationUpdateGoalArgs = {
  input: UpdateGoalInput;
};

export type MutationUpdatePlayerArgs = {
  id: Scalars['ID']['input'];
  updatePlayerInput: UpdatePlayerInput;
};

export type MutationUpdatePlayerPositionArgs = {
  gameEventId: Scalars['ID']['input'];
  position: Scalars['String']['input'];
};

export type MutationUpdateTeamArgs = {
  id: Scalars['ID']['input'];
  updateTeamInput: UpdateTeamInput;
};

export type MutationUpdateTeamConfigurationArgs = {
  input: UpdateTeamConfigurationInput;
  teamId: Scalars['ID']['input'];
};

export type MutationUpdateTeamMemberRoleArgs = {
  membershipId: Scalars['ID']['input'];
  newRole: TeamRole;
};

export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  updateUserInput: UpdateUserInput;
};

export type MutationUpgradeToManagedTeamArgs = {
  id: Scalars['ID']['input'];
  upgradeTeamInput: UpgradeTeamInput;
};

/** User-scoped data accessible via the `my` query */
export type MyData = {
  __typename?: 'MyData';
  /** Games currently in progress across all teams */
  liveGames: Array<Game>;
  /** Teams where the user is OWNER or MANAGER */
  managedTeams: Array<Team>;
  /** Teams where the user is OWNER */
  ownedTeams: Array<Team>;
  /** Recent completed games across all teams */
  recentGames: Array<Game>;
  /** All teams the user belongs to */
  teams: Array<Team>;
  /** Upcoming games across all teams (scheduled, not completed) */
  upcomingGames: Array<Game>;
  /** The authenticated user */
  user: User;
};

/** User-scoped data accessible via the `my` query */
export type MyDataRecentGamesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

/** User-scoped data accessible via the `my` query */
export type MyDataUpcomingGamesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type PlayerFullStats = {
  __typename?: 'PlayerFullStats';
  assists: Scalars['Int']['output'];
  externalPlayerName?: Maybe<Scalars['String']['output']>;
  externalPlayerNumber?: Maybe<Scalars['String']['output']>;
  gamesPlayed: Scalars['Int']['output'];
  goals: Scalars['Int']['output'];
  isOnField?: Maybe<Scalars['Boolean']['output']>;
  lastEntryGameSeconds?: Maybe<Scalars['Int']['output']>;
  playerId?: Maybe<Scalars['ID']['output']>;
  playerName?: Maybe<Scalars['String']['output']>;
  positionTimes: Array<PositionTime>;
  redCards?: Maybe<Scalars['Int']['output']>;
  saves?: Maybe<Scalars['Int']['output']>;
  totalMinutes: Scalars['Int']['output'];
  totalSeconds: Scalars['Int']['output'];
  yellowCards?: Maybe<Scalars['Int']['output']>;
};

export type PlayerPositionStats = {
  __typename?: 'PlayerPositionStats';
  externalPlayerName?: Maybe<Scalars['String']['output']>;
  externalPlayerNumber?: Maybe<Scalars['String']['output']>;
  playerId?: Maybe<Scalars['ID']['output']>;
  playerName?: Maybe<Scalars['String']['output']>;
  positionTimes: Array<PositionTime>;
  totalMinutes: Scalars['Int']['output'];
  totalSeconds: Scalars['Int']['output'];
};

export type PlayerStatsInput = {
  /** Optional: End date for date range filter (e.g., season end) */
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Optional: Filter to a single game */
  gameId?: InputMaybe<Scalars['ID']['input']>;
  /** Optional: Start date for date range filter (e.g., season start) */
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Required: Team ID to get player stats for */
  teamId: Scalars['ID']['input'];
};

export type PositionTime = {
  __typename?: 'PositionTime';
  minutes: Scalars['Int']['output'];
  position: Scalars['String']['output'];
  seconds: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  amITeamMember: Scalars['Boolean']['output'];
  coaches: Array<User>;
  coachesByName: Array<User>;
  coachesByRole: Array<User>;
  coachesByTeam: Array<User>;
  dependentEvents: DependentEventsResult;
  eventType?: Maybe<EventType>;
  eventTypeByName?: Maybe<EventType>;
  eventTypes: Array<EventType>;
  eventTypesByCategory: Array<EventType>;
  game: Game;
  gameEvent?: Maybe<GameEvent>;
  gameEvents: Array<GameEvent>;
  gameFormat: GameFormat;
  gameFormats: Array<GameFormat>;
  gameLineup: GameLineup;
  games: Array<Game>;
  managedTeams: Array<Team>;
  /** Get data for the authenticated user. Returns null if not authenticated. */
  my?: Maybe<MyData>;
  myRoleInTeam?: Maybe<TeamMember>;
  myTeamMemberships: Array<TeamMember>;
  /** Get teams the current user has access to (created, plays on, or coaches) */
  myTeams: Array<Team>;
  player: User;
  playerPositionStats: Array<PlayerPositionStats>;
  playerStats: Array<PlayerFullStats>;
  players: Array<User>;
  playersByName: Array<User>;
  playersByPosition: Array<User>;
  playersByTeam: Array<User>;
  team: Team;
  teamMember?: Maybe<TeamMember>;
  teamMembers: Array<TeamMember>;
  teams: Array<Team>;
  teamsByManagedStatus: Array<Team>;
  teamsByName: Array<Team>;
  unmanagedTeams: Array<Team>;
  user: User;
  users: Array<User>;
  usersByName: Array<User>;
  usersByTeam: Array<User>;
};

export type QueryAmITeamMemberArgs = {
  teamId: Scalars['ID']['input'];
};

export type QueryCoachesByNameArgs = {
  name: Scalars['String']['input'];
};

export type QueryCoachesByRoleArgs = {
  role: Scalars['String']['input'];
};

export type QueryCoachesByTeamArgs = {
  teamId: Scalars['ID']['input'];
};

export type QueryDependentEventsArgs = {
  gameEventId: Scalars['ID']['input'];
};

export type QueryEventTypeArgs = {
  id: Scalars['ID']['input'];
};

export type QueryEventTypeByNameArgs = {
  name: Scalars['String']['input'];
};

export type QueryEventTypesByCategoryArgs = {
  category: Scalars['String']['input'];
};

export type QueryGameArgs = {
  id: Scalars['ID']['input'];
};

export type QueryGameEventArgs = {
  id: Scalars['ID']['input'];
};

export type QueryGameEventsArgs = {
  gameTeamId: Scalars['ID']['input'];
};

export type QueryGameFormatArgs = {
  id: Scalars['ID']['input'];
};

export type QueryGameLineupArgs = {
  gameTeamId: Scalars['ID']['input'];
};

export type QueryMyRoleInTeamArgs = {
  teamId: Scalars['ID']['input'];
};

export type QueryPlayerArgs = {
  id: Scalars['ID']['input'];
};

export type QueryPlayerPositionStatsArgs = {
  gameTeamId: Scalars['ID']['input'];
};

export type QueryPlayerStatsArgs = {
  input: PlayerStatsInput;
};

export type QueryPlayersByNameArgs = {
  name: Scalars['String']['input'];
};

export type QueryPlayersByPositionArgs = {
  position: Scalars['String']['input'];
};

export type QueryPlayersByTeamArgs = {
  teamId: Scalars['ID']['input'];
};

export type QueryTeamArgs = {
  id: Scalars['ID']['input'];
};

export type QueryTeamMemberArgs = {
  id: Scalars['ID']['input'];
};

export type QueryTeamMembersArgs = {
  teamId: Scalars['ID']['input'];
};

export type QueryTeamsByManagedStatusArgs = {
  isManaged: Scalars['Boolean']['input'];
};

export type QueryTeamsByNameArgs = {
  name: Scalars['String']['input'];
};

export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

export type QueryUsersByNameArgs = {
  name: Scalars['String']['input'];
};

export type QueryUsersByTeamArgs = {
  teamId: Scalars['ID']['input'];
};

export type RecordGoalInput = {
  /** Player ID for managed team assister */
  assisterId?: InputMaybe<Scalars['ID']['input']>;
  /** External player name for opponent assister */
  externalAssisterName?: InputMaybe<Scalars['String']['input']>;
  /** External player jersey number for assister */
  externalAssisterNumber?: InputMaybe<Scalars['String']['input']>;
  /** External player name for opponent scorer */
  externalScorerName?: InputMaybe<Scalars['String']['input']>;
  /** External player jersey number */
  externalScorerNumber?: InputMaybe<Scalars['String']['input']>;
  gameMinute: Scalars['Int']['input'];
  gameSecond?: Scalars['Int']['input'];
  gameTeamId: Scalars['ID']['input'];
  /** Player ID for managed team scorer */
  scorerId?: InputMaybe<Scalars['ID']['input']>;
};

/** The source of team data - internal (user created) or external (imported) */
export enum SourceType {
  External = 'EXTERNAL',
  Internal = 'INTERNAL',
}

/** Level of detail for tracking game statistics */
export enum StatsTrackingLevel {
  Full = 'FULL',
  GoalsOnly = 'GOALS_ONLY',
  ScorerOnly = 'SCORER_ONLY',
}

export type Subscription = {
  __typename?: 'Subscription';
  gameCreated: Game;
  gameEventChanged: GameEventSubscriptionPayload;
  gameUpdated: Game;
  playerCreated: User;
  playerUpdated: User;
  teamCreated: Team;
  teamUpdated: Team;
  userCreated: User;
  userUpdated: User;
};

export type SubscriptionGameEventChangedArgs = {
  gameId: Scalars['ID']['input'];
};

export type SubscriptionGameUpdatedArgs = {
  gameId: Scalars['ID']['input'];
};

export type SubstitutePlayerInput = {
  /** External player name if substituting in an opponent player */
  externalPlayerInName?: InputMaybe<Scalars['String']['input']>;
  /** External player number if substituting in an opponent player */
  externalPlayerInNumber?: InputMaybe<Scalars['String']['input']>;
  gameMinute: Scalars['Int']['input'];
  gameSecond?: Scalars['Int']['input'];
  gameTeamId: Scalars['ID']['input'];
  /** Player ID if substituting in a managed roster player */
  playerInId?: InputMaybe<Scalars['ID']['input']>;
  /** The GameEvent ID of the player being substituted out */
  playerOutEventId: Scalars['ID']['input'];
};

export type SwapPositionsInput = {
  gameMinute: Scalars['Int']['input'];
  gameSecond?: Scalars['Int']['input'];
  gameTeamId: Scalars['ID']['input'];
  /** The GameEvent ID of the first player (will get player2 position) */
  player1EventId: Scalars['ID']['input'];
  /** The GameEvent ID of the second player (will get player1 position) */
  player2EventId: Scalars['ID']['input'];
};

export type Team = {
  __typename?: 'Team';
  awayPrimaryColor?: Maybe<Scalars['String']['output']>;
  awaySecondaryColor?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Clerk user ID of the team creator/owner */
  createdById?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  externalReference?: Maybe<Scalars['String']['output']>;
  gameTeams?: Maybe<Array<GameTeam>>;
  homePrimaryColor?: Maybe<Scalars['String']['output']>;
  homeSecondaryColor?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isManaged: Scalars['Boolean']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  /** The owner of the team (TeamMember with OWNER role) */
  owner?: Maybe<TeamMember>;
  players: Array<User>;
  playersWithJersey: Array<TeamPlayerWithJersey>;
  shortName?: Maybe<Scalars['String']['output']>;
  sourceType: SourceType;
  teamCoaches?: Maybe<Array<TeamCoach>>;
  teamConfiguration?: Maybe<TeamConfiguration>;
  teamMembers?: Maybe<Array<TeamMember>>;
  teamPlayers?: Maybe<Array<TeamPlayer>>;
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
  defaultGameFormat?: Maybe<GameFormat>;
  defaultGameFormatId?: Maybe<Scalars['ID']['output']>;
  defaultPlayerCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  statsTrackingLevel: StatsTrackingLevel;
  team: Team;
  teamId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type TeamMember = {
  __typename?: 'TeamMember';
  acceptedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  invitedAt?: Maybe<Scalars['DateTime']['output']>;
  invitedBy?: Maybe<User>;
  invitedById?: Maybe<Scalars['ID']['output']>;
  isGuest: Scalars['Boolean']['output'];
  linkedPlayer?: Maybe<User>;
  linkedPlayerId?: Maybe<Scalars['ID']['output']>;
  role: TeamRole;
  team: Team;
  teamId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['ID']['output'];
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

/** Role of a user within a team */
export enum TeamRole {
  Coach = 'COACH',
  Manager = 'MANAGER',
  Owner = 'OWNER',
  ParentFan = 'PARENT_FAN',
  Player = 'PLAYER',
}

export type UpdateGameInput = {
  actualEnd?: InputMaybe<Scalars['DateTime']['input']>;
  actualStart?: InputMaybe<Scalars['DateTime']['input']>;
  awayTeamId?: InputMaybe<Scalars['ID']['input']>;
  /** If true (with resetGame), also deletes all game events */
  clearEvents?: InputMaybe<Scalars['Boolean']['input']>;
  duration?: InputMaybe<Scalars['Int']['input']>;
  firstHalfEnd?: InputMaybe<Scalars['DateTime']['input']>;
  gameFormatId?: InputMaybe<Scalars['ID']['input']>;
  homeTeamId?: InputMaybe<Scalars['ID']['input']>;
  /** When the game clock was paused (null to unpause) */
  pausedAt?: InputMaybe<Scalars['DateTime']['input']>;
  /** If true, resets the game to SCHEDULED status and clears all timestamps */
  resetGame?: InputMaybe<Scalars['Boolean']['input']>;
  secondHalfStart?: InputMaybe<Scalars['DateTime']['input']>;
  /** Override stats tracking level for this game (null = use team default) */
  statsTrackingLevel?: InputMaybe<StatsTrackingLevel>;
  status?: InputMaybe<GameStatus>;
};

export type UpdateGoalInput = {
  /** Player ID for managed team assister */
  assisterId?: InputMaybe<Scalars['ID']['input']>;
  /** Set to true to clear the assist */
  clearAssist?: InputMaybe<Scalars['Boolean']['input']>;
  /** External player name for opponent assister */
  externalAssisterName?: InputMaybe<Scalars['String']['input']>;
  /** External player jersey number for assister */
  externalAssisterNumber?: InputMaybe<Scalars['String']['input']>;
  /** External player name for opponent scorer */
  externalScorerName?: InputMaybe<Scalars['String']['input']>;
  /** External player jersey number */
  externalScorerNumber?: InputMaybe<Scalars['String']['input']>;
  /** The goal event ID to update */
  gameEventId: Scalars['ID']['input'];
  gameMinute?: InputMaybe<Scalars['Int']['input']>;
  gameSecond?: InputMaybe<Scalars['Int']['input']>;
  /** Player ID for managed team scorer */
  scorerId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdatePlayerInput = {
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  passwordHash?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTeamConfigurationInput = {
  defaultFormation?: InputMaybe<Scalars['String']['input']>;
  defaultGameDuration?: InputMaybe<Scalars['Float']['input']>;
  defaultGameFormatId?: InputMaybe<Scalars['ID']['input']>;
  defaultPlayerCount?: InputMaybe<Scalars['Float']['input']>;
  statsTrackingLevel?: InputMaybe<StatsTrackingLevel>;
};

export type UpdateTeamInput = {
  awayPrimaryColor?: InputMaybe<Scalars['String']['input']>;
  awaySecondaryColor?: InputMaybe<Scalars['String']['input']>;
  colors?: InputMaybe<Scalars['String']['input']>;
  customPositions?: InputMaybe<Array<TeamPositionInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  formation?: InputMaybe<Scalars['String']['input']>;
  gameFormat?: InputMaybe<Scalars['String']['input']>;
  homePrimaryColor?: InputMaybe<Scalars['String']['input']>;
  homeSecondaryColor?: InputMaybe<Scalars['String']['input']>;
  logo?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  shortName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  passwordHash?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type UpgradeTeamInput = {
  awayPrimaryColor?: InputMaybe<Scalars['String']['input']>;
  awaySecondaryColor?: InputMaybe<Scalars['String']['input']>;
  colors?: InputMaybe<Scalars['String']['input']>;
  customPositions?: InputMaybe<Array<TeamPositionInput>>;
  description?: InputMaybe<Scalars['String']['input']>;
  formation?: InputMaybe<Scalars['String']['input']>;
  gameFormat?: InputMaybe<Scalars['String']['input']>;
  homePrimaryColor?: InputMaybe<Scalars['String']['input']>;
  homeSecondaryColor?: InputMaybe<Scalars['String']['input']>;
  logo?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  shortName?: InputMaybe<Scalars['String']['input']>;
  teamId: Scalars['ID']['input'];
};

export type User = {
  __typename?: 'User';
  clerkId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dateOfBirth?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastName: Scalars['String']['output'];
  lastNameVisibility: LastNameVisibility;
  performedEvents: Array<GameEvent>;
  phone?: Maybe<Scalars['String']['output']>;
  recordedEvents: Array<GameEvent>;
  teamCoaches: Array<TeamCoach>;
  teamMemberships: Array<TeamMember>;
  teamPlayers: Array<TeamPlayer>;
  teams: Array<Team>;
  updatedAt: Scalars['DateTime']['output'];
};

export type GetUsersForListQueryVariables = Exact<{ [key: string]: never }>;

export type GetUsersForListQuery = {
  __typename?: 'Query';
  users: Array<
    { __typename?: 'User' } & {
      ' $fragmentRefs'?: { UserCardFragment: UserCardFragment };
    }
  >;
};

export type GameEventFragmentFragment = {
  __typename?: 'GameEvent';
  id: string;
  createdAt: any;
  gameMinute: number;
  gameSecond: number;
  position?: string | null;
  playerId?: string | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  player?: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  } | null;
  eventType: {
    __typename?: 'EventType';
    id: string;
    name: string;
    category: string;
  };
} & { ' $fragmentName'?: 'GameEventFragmentFragment' };

export type PlayerCardDataFragment = {
  __typename?: 'User';
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: any | null;
  isActive: boolean;
  teamPlayers: Array<{
    __typename?: 'TeamPlayer';
    id: string;
    jerseyNumber?: string | null;
    primaryPosition?: string | null;
    isActive: boolean;
    team: { __typename?: 'Team'; id: string; name: string };
  }>;
} & { ' $fragmentName'?: 'PlayerCardDataFragment' };

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

export type GetMyTeamsForListQueryVariables = Exact<{ [key: string]: never }>;

export type GetMyTeamsForListQuery = {
  __typename?: 'Query';
  myTeams: Array<{
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
    createdById?: string | null;
    createdAt: any;
    updatedAt: any;
  }>;
};

export type UserCardFragment = {
  __typename?: 'User';
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  teamPlayers: Array<{
    __typename?: 'TeamPlayer';
    id: string;
    jerseyNumber?: string | null;
    primaryPosition?: string | null;
    team: {
      __typename?: 'Team';
      id: string;
      name: string;
      shortName?: string | null;
    };
  }>;
} & { ' $fragmentName'?: 'UserCardFragment' };

export type QuickCreateTeamMutationVariables = Exact<{
  input: CreateTeamInput;
}>;

export type QuickCreateTeamMutation = {
  __typename?: 'Mutation';
  createTeam: {
    __typename?: 'Team';
    id: string;
    name: string;
    homePrimaryColor?: string | null;
    homeSecondaryColor?: string | null;
    awayPrimaryColor?: string | null;
    awaySecondaryColor?: string | null;
    logoUrl?: string | null;
  };
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
    gameTeams?: Array<{
      __typename?: 'GameTeam';
      id: string;
      teamType: string;
      finalScore?: number | null;
      formation?: string | null;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        shortName?: string | null;
        homePrimaryColor?: string | null;
        homeSecondaryColor?: string | null;
      };
    }> | null;
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
    status: GameStatus;
    actualStart?: any | null;
    firstHalfEnd?: any | null;
    secondHalfStart?: any | null;
    actualEnd?: any | null;
    pausedAt?: any | null;
    statsTrackingLevel?: StatsTrackingLevel | null;
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
    gameTeams?: Array<{
      __typename?: 'GameTeam';
      id: string;
      teamType: string;
      finalScore?: number | null;
      formation?: string | null;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        shortName?: string | null;
        homePrimaryColor?: string | null;
        homeSecondaryColor?: string | null;
        isManaged: boolean;
        teamPlayers?: Array<{
          __typename?: 'TeamPlayer';
          id: string;
          userId: string;
          jerseyNumber?: string | null;
          primaryPosition?: string | null;
          isActive: boolean;
          user: {
            __typename?: 'User';
            id: string;
            email?: string | null;
            firstName: string;
            lastName: string;
          };
        }> | null;
      };
      gameEvents?: Array<{
        __typename?: 'GameEvent';
        id: string;
        createdAt: any;
        gameMinute: number;
        gameSecond: number;
        position?: string | null;
        playerId?: string | null;
        externalPlayerName?: string | null;
        externalPlayerNumber?: string | null;
        player?: {
          __typename?: 'User';
          id: string;
          firstName: string;
          lastName: string;
          email?: string | null;
        } | null;
        eventType: {
          __typename?: 'EventType';
          id: string;
          name: string;
          category: string;
        };
      }> | null;
    }> | null;
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
    status: GameStatus;
    actualStart?: any | null;
    firstHalfEnd?: any | null;
    secondHalfStart?: any | null;
    actualEnd?: any | null;
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

export type GetGameLineupQueryVariables = Exact<{
  gameTeamId: Scalars['ID']['input'];
}>;

export type GetGameLineupQuery = {
  __typename?: 'Query';
  gameLineup: {
    __typename?: 'GameLineup';
    gameTeamId: string;
    formation?: string | null;
    starters: Array<{
      __typename?: 'LineupPlayer';
      gameEventId: string;
      playerId?: string | null;
      playerName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      externalPlayerName?: string | null;
      externalPlayerNumber?: string | null;
      position?: string | null;
      isOnField: boolean;
    }>;
    bench: Array<{
      __typename?: 'LineupPlayer';
      gameEventId: string;
      playerId?: string | null;
      playerName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      externalPlayerName?: string | null;
      externalPlayerNumber?: string | null;
      position?: string | null;
      isOnField: boolean;
    }>;
    currentOnField: Array<{
      __typename?: 'LineupPlayer';
      gameEventId: string;
      playerId?: string | null;
      playerName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      externalPlayerName?: string | null;
      externalPlayerNumber?: string | null;
      position?: string | null;
      isOnField: boolean;
    }>;
  };
};

export type GetEventTypesQueryVariables = Exact<{ [key: string]: never }>;

export type GetEventTypesQuery = {
  __typename?: 'Query';
  eventTypes: Array<{
    __typename?: 'EventType';
    id: string;
    name: string;
    category: string;
    description?: string | null;
    requiresPosition: boolean;
    allowsParent: boolean;
  }>;
};

export type AddPlayerToLineupMutationVariables = Exact<{
  input: AddToLineupInput;
}>;

export type AddPlayerToLineupMutation = {
  __typename?: 'Mutation';
  addPlayerToLineup: {
    __typename?: 'GameEvent';
    id: string;
    gameMinute: number;
    gameSecond: number;
    position?: string | null;
    playerId?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    eventType: { __typename?: 'EventType'; id: string; name: string };
  };
};

export type AddPlayerToBenchMutationVariables = Exact<{
  input: AddToBenchInput;
}>;

export type AddPlayerToBenchMutation = {
  __typename?: 'Mutation';
  addPlayerToBench: {
    __typename?: 'GameEvent';
    id: string;
    gameMinute: number;
    gameSecond: number;
    position?: string | null;
    playerId?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    eventType: { __typename?: 'EventType'; id: string; name: string };
  };
};

export type RemoveFromLineupMutationVariables = Exact<{
  gameEventId: Scalars['ID']['input'];
}>;

export type RemoveFromLineupMutation = {
  __typename?: 'Mutation';
  removeFromLineup: boolean;
};

export type UpdatePlayerPositionMutationVariables = Exact<{
  gameEventId: Scalars['ID']['input'];
  position: Scalars['String']['input'];
}>;

export type UpdatePlayerPositionMutation = {
  __typename?: 'Mutation';
  updatePlayerPosition: {
    __typename?: 'GameEvent';
    id: string;
    position?: string | null;
  };
};

export type SubstitutePlayerMutationVariables = Exact<{
  input: SubstitutePlayerInput;
}>;

export type SubstitutePlayerMutation = {
  __typename?: 'Mutation';
  substitutePlayer: Array<{
    __typename?: 'GameEvent';
    id: string;
    gameMinute: number;
    gameSecond: number;
    position?: string | null;
    playerId?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    eventType: { __typename?: 'EventType'; id: string; name: string };
  }>;
};

export type RecordGoalMutationVariables = Exact<{
  input: RecordGoalInput;
}>;

export type RecordGoalMutation = {
  __typename?: 'Mutation';
  recordGoal: {
    __typename?: 'GameEvent';
    id: string;
    gameMinute: number;
    gameSecond: number;
    playerId?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    eventType: { __typename?: 'EventType'; id: string; name: string };
    childEvents: Array<{
      __typename?: 'GameEvent';
      id: string;
      playerId?: string | null;
      externalPlayerName?: string | null;
      externalPlayerNumber?: string | null;
      eventType: { __typename?: 'EventType'; id: string; name: string };
    }>;
  };
};

export type DeleteGoalMutationVariables = Exact<{
  gameEventId: Scalars['ID']['input'];
}>;

export type DeleteGoalMutation = {
  __typename?: 'Mutation';
  deleteGoal: boolean;
};

export type DeleteSubstitutionMutationVariables = Exact<{
  gameEventId: Scalars['ID']['input'];
}>;

export type DeleteSubstitutionMutation = {
  __typename?: 'Mutation';
  deleteSubstitution: boolean;
};

export type DeletePositionSwapMutationVariables = Exact<{
  gameEventId: Scalars['ID']['input'];
}>;

export type DeletePositionSwapMutation = {
  __typename?: 'Mutation';
  deletePositionSwap: boolean;
};

export type DeleteStarterEntryMutationVariables = Exact<{
  gameEventId: Scalars['ID']['input'];
}>;

export type DeleteStarterEntryMutation = {
  __typename?: 'Mutation';
  deleteStarterEntry: boolean;
};

export type GetDependentEventsQueryVariables = Exact<{
  gameEventId: Scalars['ID']['input'];
}>;

export type GetDependentEventsQuery = {
  __typename?: 'Query';
  dependentEvents: {
    __typename?: 'DependentEventsResult';
    count: number;
    canDelete: boolean;
    warningMessage?: string | null;
    dependentEvents: Array<{
      __typename?: 'DependentEvent';
      id: string;
      eventType: string;
      gameMinute: number;
      gameSecond: number;
      playerName?: string | null;
      description?: string | null;
    }>;
  };
};

export type DeleteEventWithCascadeMutationVariables = Exact<{
  gameEventId: Scalars['ID']['input'];
  eventType: Scalars['String']['input'];
}>;

export type DeleteEventWithCascadeMutation = {
  __typename?: 'Mutation';
  deleteEventWithCascade: boolean;
};

export type ResolveEventConflictMutationVariables = Exact<{
  conflictId: Scalars['ID']['input'];
  selectedEventId: Scalars['ID']['input'];
  keepAll?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type ResolveEventConflictMutation = {
  __typename?: 'Mutation';
  resolveEventConflict: {
    __typename?: 'GameEvent';
    id: string;
    gameMinute: number;
    gameSecond: number;
    playerId?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    conflictId?: string | null;
    eventType: { __typename?: 'EventType'; id: string; name: string };
  };
};

export type UpdateGoalMutationVariables = Exact<{
  input: UpdateGoalInput;
}>;

export type UpdateGoalMutation = {
  __typename?: 'Mutation';
  updateGoal: {
    __typename?: 'GameEvent';
    id: string;
    gameMinute: number;
    gameSecond: number;
    playerId?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    eventType: { __typename?: 'EventType'; id: string; name: string };
    childEvents: Array<{
      __typename?: 'GameEvent';
      id: string;
      playerId?: string | null;
      externalPlayerName?: string | null;
      externalPlayerNumber?: string | null;
      eventType: { __typename?: 'EventType'; id: string; name: string };
    }>;
  };
};

export type SwapPositionsMutationVariables = Exact<{
  input: SwapPositionsInput;
}>;

export type SwapPositionsMutation = {
  __typename?: 'Mutation';
  swapPositions: Array<{
    __typename?: 'GameEvent';
    id: string;
    gameMinute: number;
    gameSecond: number;
    position?: string | null;
    playerId?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    eventType: { __typename?: 'EventType'; id: string; name: string };
  }>;
};

export type BatchLineupChangesMutationVariables = Exact<{
  input: BatchLineupChangesInput;
}>;

export type BatchLineupChangesMutation = {
  __typename?: 'Mutation';
  batchLineupChanges: Array<{
    __typename?: 'GameEvent';
    id: string;
    gameMinute: number;
    gameSecond: number;
    position?: string | null;
    playerId?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    eventType: { __typename?: 'EventType'; id: string; name: string };
  }>;
};

export type GetPlayerPositionStatsQueryVariables = Exact<{
  gameTeamId: Scalars['ID']['input'];
}>;

export type GetPlayerPositionStatsQuery = {
  __typename?: 'Query';
  playerPositionStats: Array<{
    __typename?: 'PlayerPositionStats';
    playerId?: string | null;
    playerName?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    totalMinutes: number;
    totalSeconds: number;
    positionTimes: Array<{
      __typename?: 'PositionTime';
      position: string;
      minutes: number;
      seconds: number;
    }>;
  }>;
};

export type GetPlayerStatsQueryVariables = Exact<{
  input: PlayerStatsInput;
}>;

export type GetPlayerStatsQuery = {
  __typename?: 'Query';
  playerStats: Array<{
    __typename?: 'PlayerFullStats';
    playerId?: string | null;
    playerName?: string | null;
    externalPlayerName?: string | null;
    externalPlayerNumber?: string | null;
    totalMinutes: number;
    totalSeconds: number;
    goals: number;
    assists: number;
    gamesPlayed: number;
    yellowCards?: number | null;
    redCards?: number | null;
    saves?: number | null;
    isOnField?: boolean | null;
    lastEntryGameSeconds?: number | null;
    positionTimes: Array<{
      __typename?: 'PositionTime';
      position: string;
      minutes: number;
      seconds: number;
    }>;
  }>;
};

export type GameEventChangedSubscriptionVariables = Exact<{
  gameId: Scalars['ID']['input'];
}>;

export type GameEventChangedSubscription = {
  __typename?: 'Subscription';
  gameEventChanged: {
    __typename?: 'GameEventSubscriptionPayload';
    action: GameEventAction;
    gameId: string;
    deletedEventId?: string | null;
    event?: {
      __typename?: 'GameEvent';
      id: string;
      gameTeamId: string;
      gameMinute: number;
      gameSecond: number;
      position?: string | null;
      playerId?: string | null;
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
      } | null;
      recordedByUser: {
        __typename?: 'User';
        id: string;
        firstName: string;
        lastName: string;
      };
      childEvents: Array<{
        __typename?: 'GameEvent';
        id: string;
        gameMinute: number;
        gameSecond: number;
        playerId?: string | null;
        externalPlayerName?: string | null;
        externalPlayerNumber?: string | null;
        eventType: {
          __typename?: 'EventType';
          id: string;
          name: string;
          category: string;
        };
      }>;
    } | null;
    conflict?: {
      __typename?: 'ConflictInfo';
      conflictId: string;
      eventType: string;
      gameMinute: number;
      gameSecond: number;
      conflictingEvents: Array<{
        __typename?: 'ConflictingEvent';
        eventId: string;
        playerName: string;
        playerId?: string | null;
        recordedByUserName: string;
      }>;
    } | null;
  };
};

export type GameUpdatedSubscriptionVariables = Exact<{
  gameId: Scalars['ID']['input'];
}>;

export type GameUpdatedSubscription = {
  __typename?: 'Subscription';
  gameUpdated: {
    __typename?: 'Game';
    id: string;
    name?: string | null;
    status: GameStatus;
    actualStart?: any | null;
    firstHalfEnd?: any | null;
    secondHalfStart?: any | null;
    actualEnd?: any | null;
    pausedAt?: any | null;
  };
};

export type GetMyDashboardQueryVariables = Exact<{
  upcomingLimit?: InputMaybe<Scalars['Int']['input']>;
  recentLimit?: InputMaybe<Scalars['Int']['input']>;
}>;

export type GetMyDashboardQuery = {
  __typename?: 'Query';
  my?: {
    __typename?: 'MyData';
    user: {
      __typename?: 'User';
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
    };
    teams: Array<{
      __typename?: 'Team';
      id: string;
      name: string;
      shortName?: string | null;
      homePrimaryColor?: string | null;
      homeSecondaryColor?: string | null;
      isManaged: boolean;
    }>;
    ownedTeams: Array<{ __typename?: 'Team'; id: string; name: string }>;
    managedTeams: Array<{ __typename?: 'Team'; id: string; name: string }>;
    upcomingGames: Array<{
      __typename?: 'Game';
      id: string;
      name?: string | null;
      scheduledStart?: any | null;
      status: GameStatus;
      venue?: string | null;
      gameTeams?: Array<{
        __typename?: 'GameTeam';
        id: string;
        teamType: string;
        team: {
          __typename?: 'Team';
          id: string;
          name: string;
          shortName?: string | null;
          homePrimaryColor?: string | null;
        };
      }> | null;
    }>;
    recentGames: Array<{
      __typename?: 'Game';
      id: string;
      name?: string | null;
      status: GameStatus;
      actualEnd?: any | null;
      gameTeams?: Array<{
        __typename?: 'GameTeam';
        id: string;
        teamType: string;
        finalScore?: number | null;
        team: {
          __typename?: 'Team';
          id: string;
          name: string;
          shortName?: string | null;
          homePrimaryColor?: string | null;
        };
      }> | null;
    }>;
    liveGames: Array<{
      __typename?: 'Game';
      id: string;
      name?: string | null;
      status: GameStatus;
      actualStart?: any | null;
      gameTeams?: Array<{
        __typename?: 'GameTeam';
        id: string;
        teamType: string;
        finalScore?: number | null;
        team: {
          __typename?: 'Team';
          id: string;
          name: string;
          shortName?: string | null;
          homePrimaryColor?: string | null;
        };
      }> | null;
    }>;
  } | null;
};

export type GetMyTeamsViewerQueryVariables = Exact<{ [key: string]: never }>;

export type GetMyTeamsViewerQuery = {
  __typename?: 'Query';
  my?: {
    __typename?: 'MyData';
    teams: Array<{
      __typename?: 'Team';
      id: string;
      name: string;
      shortName?: string | null;
      homePrimaryColor?: string | null;
      homeSecondaryColor?: string | null;
      isManaged: boolean;
    }>;
    ownedTeams: Array<{ __typename?: 'Team'; id: string; name: string }>;
  } | null;
};

export type GetMyLiveGamesQueryVariables = Exact<{ [key: string]: never }>;

export type GetMyLiveGamesQuery = {
  __typename?: 'Query';
  my?: {
    __typename?: 'MyData';
    liveGames: Array<{
      __typename?: 'Game';
      id: string;
      name?: string | null;
      status: GameStatus;
      actualStart?: any | null;
      pausedAt?: any | null;
      gameTeams?: Array<{
        __typename?: 'GameTeam';
        id: string;
        teamType: string;
        finalScore?: number | null;
        team: {
          __typename?: 'Team';
          id: string;
          name: string;
          shortName?: string | null;
          homePrimaryColor?: string | null;
        };
      }> | null;
    }>;
  } | null;
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
    owner?: {
      __typename?: 'TeamMember';
      id: string;
      role: TeamRole;
      user: {
        __typename?: 'User';
        id: string;
        firstName: string;
        lastName: string;
        email?: string | null;
      };
    } | null;
    playersWithJersey: Array<{
      __typename?: 'TeamPlayerWithJersey';
      id: string;
      name: string;
      position: string;
      jersey: number;
      depthRank?: number | null;
      isActive: boolean;
    }>;
    teamPlayers?: Array<{
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
        email?: string | null;
      };
    }> | null;
    teamConfiguration?: {
      __typename?: 'TeamConfiguration';
      id: string;
      defaultFormation: string;
      defaultGameDuration: number;
      defaultPlayerCount: number;
      statsTrackingLevel: StatsTrackingLevel;
      defaultGameFormat?: {
        __typename?: 'GameFormat';
        id: string;
        name: string;
        playersPerTeam: number;
        durationMinutes: number;
      } | null;
    } | null;
    gameTeams?: Array<{
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
    }> | null;
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
    createdById?: string | null;
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

export type UpdateTeamConfigurationMutationVariables = Exact<{
  teamId: Scalars['ID']['input'];
  input: UpdateTeamConfigurationInput;
}>;

export type UpdateTeamConfigurationMutation = {
  __typename?: 'Mutation';
  updateTeamConfiguration: {
    __typename?: 'TeamConfiguration';
    id: string;
    teamId: string;
    defaultFormation: string;
    defaultGameDuration: number;
    defaultPlayerCount: number;
    statsTrackingLevel: StatsTrackingLevel;
    defaultGameFormat?: {
      __typename?: 'GameFormat';
      id: string;
      name: string;
      playersPerTeam: number;
      durationMinutes: number;
    } | null;
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

export type GetMyTeamsQueryVariables = Exact<{ [key: string]: never }>;

export type GetMyTeamsQuery = {
  __typename?: 'Query';
  myTeams: Array<{
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
    createdById?: string | null;
    createdAt: any;
    updatedAt: any;
  }>;
};

export type GetAllUsersQueryVariables = Exact<{ [key: string]: never }>;

export type GetAllUsersQuery = {
  __typename?: 'Query';
  users: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
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
      joinedDate?: any | null;
      leftDate?: any | null;
      isActive: boolean;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        shortName?: string | null;
      };
    }>;
    teamCoaches: Array<{
      __typename?: 'TeamCoach';
      id: string;
      role: string;
      startDate: any;
      endDate?: any | null;
      isActive: boolean;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        shortName?: string | null;
      };
    }>;
  }>;
};

export type GetUsersByTeamQueryVariables = Exact<{
  teamId: Scalars['ID']['input'];
}>;

export type GetUsersByTeamQuery = {
  __typename?: 'Query';
  usersByTeam: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    isActive: boolean;
    teamPlayers: Array<{
      __typename?: 'TeamPlayer';
      id: string;
      jerseyNumber?: string | null;
      primaryPosition?: string | null;
      joinedDate?: any | null;
      isActive: boolean;
    }>;
    teamCoaches: Array<{
      __typename?: 'TeamCoach';
      id: string;
      role: string;
      startDate: any;
      isActive: boolean;
    }>;
  }>;
};

export type SearchUsersByNameQueryVariables = Exact<{
  name: Scalars['String']['input'];
}>;

export type SearchUsersByNameQuery = {
  __typename?: 'Query';
  usersByName: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    teamPlayers: Array<{
      __typename?: 'TeamPlayer';
      primaryPosition?: string | null;
      team: { __typename?: 'Team'; name: string };
    }>;
    teamCoaches: Array<{
      __typename?: 'TeamCoach';
      role: string;
      team: { __typename?: 'Team'; name: string };
    }>;
  }>;
};

export type GetUsersCompleteQueryVariables = Exact<{ [key: string]: never }>;

export type GetUsersCompleteQuery = {
  __typename?: 'Query';
  players: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
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
      joinedDate?: any | null;
      leftDate?: any | null;
      isActive: boolean;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        shortName?: string | null;
      };
    }>;
  }>;
};

export type GetPlayersByTeamQueryVariables = Exact<{
  teamId: Scalars['ID']['input'];
}>;

export type GetPlayersByTeamQuery = {
  __typename?: 'Query';
  playersByTeam: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    teamPlayers: Array<{
      __typename?: 'TeamPlayer';
      id: string;
      jerseyNumber?: string | null;
      primaryPosition?: string | null;
      joinedDate?: any | null;
      isActive: boolean;
    }>;
  }>;
};

export type GetPlayersByPositionQueryVariables = Exact<{
  position: Scalars['String']['input'];
}>;

export type GetPlayersByPositionQuery = {
  __typename?: 'Query';
  playersByPosition: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    teamPlayers: Array<{
      __typename?: 'TeamPlayer';
      id: string;
      jerseyNumber?: string | null;
      team: { __typename?: 'Team'; name: string };
    }>;
  }>;
};

export type SearchPlayersByNameQueryVariables = Exact<{
  name: Scalars['String']['input'];
}>;

export type SearchPlayersByNameQuery = {
  __typename?: 'Query';
  playersByName: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    teamPlayers: Array<{
      __typename?: 'TeamPlayer';
      primaryPosition?: string | null;
      jerseyNumber?: string | null;
      team: { __typename?: 'Team'; name: string };
    }>;
  }>;
};

export type GetCoachesQueryVariables = Exact<{ [key: string]: never }>;

export type GetCoachesQuery = {
  __typename?: 'Query';
  coaches: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
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
    teamCoaches: Array<{
      __typename?: 'TeamCoach';
      id: string;
      role: string;
      startDate: any;
      endDate?: any | null;
      isActive: boolean;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        shortName?: string | null;
      };
    }>;
  }>;
};

export type GetCoachesByTeamQueryVariables = Exact<{
  teamId: Scalars['ID']['input'];
}>;

export type GetCoachesByTeamQuery = {
  __typename?: 'Query';
  coachesByTeam: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    teamCoaches: Array<{
      __typename?: 'TeamCoach';
      id: string;
      role: string;
      startDate: any;
      isActive: boolean;
    }>;
  }>;
};

export type GetCoachesByRoleQueryVariables = Exact<{
  role: Scalars['String']['input'];
}>;

export type GetCoachesByRoleQuery = {
  __typename?: 'Query';
  coachesByRole: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    teamCoaches: Array<{
      __typename?: 'TeamCoach';
      id: string;
      startDate: any;
      team: { __typename?: 'Team'; name: string };
    }>;
  }>;
};

export type SearchCoachesByNameQueryVariables = Exact<{
  name: Scalars['String']['input'];
}>;

export type SearchCoachesByNameQuery = {
  __typename?: 'Query';
  coachesByName: Array<{
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    teamCoaches: Array<{
      __typename?: 'TeamCoach';
      role: string;
      team: { __typename?: 'Team'; name: string };
    }>;
  }>;
};

export type GetUserByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetUserByIdQuery = {
  __typename?: 'Query';
  user: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
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
      joinedDate?: any | null;
      leftDate?: any | null;
      isActive: boolean;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        shortName?: string | null;
      };
    }>;
    teamCoaches: Array<{
      __typename?: 'TeamCoach';
      id: string;
      role: string;
      startDate: any;
      endDate?: any | null;
      isActive: boolean;
      team: {
        __typename?: 'Team';
        id: string;
        name: string;
        shortName?: string | null;
      };
    }>;
  };
};

export type CreateUserMutationVariables = Exact<{
  createUserInput: CreateUserInput;
}>;

export type CreateUserMutation = {
  __typename?: 'Mutation';
  createUser: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
  };
};

export type UpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  updateUserInput: UpdateUserInput;
}>;

export type UpdateUserMutation = {
  __typename?: 'Mutation';
  updateUser: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    updatedAt: any;
  };
};

export type RemoveUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type RemoveUserMutation = {
  __typename?: 'Mutation';
  removeUser: boolean;
};

export type AddPlayerToTeamMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
  jerseyNumber?: InputMaybe<Scalars['String']['input']>;
  primaryPosition?: InputMaybe<Scalars['String']['input']>;
  joinedDate?: InputMaybe<Scalars['DateTime']['input']>;
}>;

export type AddPlayerToTeamMutation = {
  __typename?: 'Mutation';
  addPlayerToTeam: {
    __typename?: 'TeamPlayer';
    id: string;
    jerseyNumber?: string | null;
    primaryPosition?: string | null;
    joinedDate?: any | null;
    isActive: boolean;
    team: { __typename?: 'Team'; id: string; name: string };
  };
};

export type RemoveUserFromTeamMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
  leftDate?: InputMaybe<Scalars['DateTime']['input']>;
}>;

export type RemoveUserFromTeamMutation = {
  __typename?: 'Mutation';
  removePlayerFromTeam: boolean;
};

export type AddCoachToTeamMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
  role: Scalars['String']['input'];
  startDate: Scalars['DateTime']['input'];
}>;

export type AddCoachToTeamMutation = {
  __typename?: 'Mutation';
  addCoachToTeam: {
    __typename?: 'TeamCoach';
    id: string;
    role: string;
    startDate: any;
    isActive: boolean;
    team: { __typename?: 'Team'; id: string; name: string };
  };
};

export type RemoveCoachFromTeamMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
}>;

export type RemoveCoachFromTeamMutation = {
  __typename?: 'Mutation';
  removeCoachFromTeam: boolean;
};

export type CreateUserAccountMutationVariables = Exact<{
  createPlayerInput: CreatePlayerInput;
}>;

export type CreateUserAccountMutation = {
  __typename?: 'Mutation';
  createPlayer: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
  };
};

export type CreateCoachMutationVariables = Exact<{
  createCoachInput: CreateUserInput;
}>;

export type CreateCoachMutation = {
  __typename?: 'Mutation';
  createCoach: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
  };
};

export type UpdateUserAccountMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  updatePlayerInput: UpdatePlayerInput;
}>;

export type UpdateUserAccountMutation = {
  __typename?: 'Mutation';
  updatePlayer: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    updatedAt: any;
  };
};

export type UpdateCoachMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  updateCoachInput: UpdateUserInput;
}>;

export type UpdateCoachMutation = {
  __typename?: 'Mutation';
  updateCoach: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    dateOfBirth?: any | null;
    phone?: string | null;
    isActive: boolean;
    updatedAt: any;
  };
};

export type UserUpdatedSubscriptionVariables = Exact<{ [key: string]: never }>;

export type UserUpdatedSubscription = {
  __typename?: 'Subscription';
  userUpdated: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    isActive: boolean;
    updatedAt: any;
  };
};

export type UserCreatedSubscriptionVariables = Exact<{ [key: string]: never }>;

export type UserCreatedSubscription = {
  __typename?: 'Subscription';
  userCreated: {
    __typename?: 'User';
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    isActive: boolean;
    createdAt: any;
  };
};

export const GameEventFragmentFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'GameEventFragment' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'GameEvent' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'gameMinute' } },
          { kind: 'Field', name: { kind: 'Name', value: 'gameSecond' } },
          { kind: 'Field', name: { kind: 'Name', value: 'position' } },
          { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
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
            name: { kind: 'Name', value: 'player' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'eventType' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'category' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GameEventFragmentFragment, unknown>;
export const PlayerCardDataFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PlayerCardData' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'User' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
          { kind: 'Field', name: { kind: 'Name', value: 'dateOfBirth' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
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
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'team' },
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
      },
    },
  ],
} as unknown as DocumentNode<PlayerCardDataFragment, unknown>;
export const UserCardFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserCard' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'User' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
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
                  name: { kind: 'Name', value: 'team' },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserCardFragment, unknown>;
export const GetUsersForListDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetUsersForList' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'users' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'FragmentSpread',
                  name: { kind: 'Name', value: 'UserCard' },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'UserCard' },
      typeCondition: {
        kind: 'NamedType',
        name: { kind: 'Name', value: 'User' },
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
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
                  name: { kind: 'Name', value: 'team' },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetUsersForListQuery,
  GetUsersForListQueryVariables
>;
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
export const GetMyTeamsForListDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMyTeamsForList' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myTeams' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'createdById' } },
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
  GetMyTeamsForListQuery,
  GetMyTeamsForListQueryVariables
>;
export const QuickCreateTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'QuickCreateTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
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
                  name: { kind: 'Name', value: 'input' },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  QuickCreateTeamMutation,
  QuickCreateTeamMutationVariables
>;
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
                          ],
                        },
                      },
                    ],
                  },
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
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'actualStart' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'firstHalfEnd' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'secondHalfStart' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'actualEnd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'pausedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'statsTrackingLevel' },
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
                              name: { kind: 'Name', value: 'isManaged' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'teamPlayers' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'userId' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'jerseyNumber',
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'primaryPosition',
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'isActive' },
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
                                          name: {
                                            kind: 'Name',
                                            value: 'email',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'firstName',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'lastName',
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
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameEvents' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'createdAt' },
                            },
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
                              name: { kind: 'Name', value: 'position' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'playerId' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'externalPlayerName',
                              },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'externalPlayerNumber',
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
                          ],
                        },
                      },
                    ],
                  },
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
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
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
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'actualStart' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'firstHalfEnd' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'secondHalfStart' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'actualEnd' } },
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
export const GetGameLineupDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetGameLineup' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameTeamId' },
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
            name: { kind: 'Name', value: 'gameLineup' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameTeamId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameTeamId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'gameTeamId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'formation' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'starters' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameEventId' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playerId' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playerName' },
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
                        name: { kind: 'Name', value: 'externalPlayerName' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'externalPlayerNumber' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'isOnField' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'bench' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameEventId' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playerId' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playerName' },
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
                        name: { kind: 'Name', value: 'externalPlayerName' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'externalPlayerNumber' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'isOnField' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'currentOnField' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameEventId' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playerId' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playerName' },
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
                        name: { kind: 'Name', value: 'externalPlayerName' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'externalPlayerNumber' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'isOnField' },
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
} as unknown as DocumentNode<GetGameLineupQuery, GetGameLineupQueryVariables>;
export const GetEventTypesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetEventTypes' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'eventTypes' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'category' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
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
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetEventTypesQuery, GetEventTypesQueryVariables>;
export const AddPlayerToLineupDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddPlayerToLineup' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'AddToLineupInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addPlayerToLineup' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameMinute' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameSecond' } },
                { kind: 'Field', name: { kind: 'Name', value: 'position' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
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
  AddPlayerToLineupMutation,
  AddPlayerToLineupMutationVariables
>;
export const AddPlayerToBenchDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddPlayerToBench' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'AddToBenchInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addPlayerToBench' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameMinute' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameSecond' } },
                { kind: 'Field', name: { kind: 'Name', value: 'position' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
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
  AddPlayerToBenchMutation,
  AddPlayerToBenchMutationVariables
>;
export const RemoveFromLineupDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveFromLineup' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameEventId' },
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
            name: { kind: 'Name', value: 'removeFromLineup' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameEventId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameEventId' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  RemoveFromLineupMutation,
  RemoveFromLineupMutationVariables
>;
export const UpdatePlayerPositionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdatePlayerPosition' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameEventId' },
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
            name: { kind: 'Name', value: 'position' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatePlayerPosition' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameEventId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameEventId' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'position' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'position' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'position' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdatePlayerPositionMutation,
  UpdatePlayerPositionMutationVariables
>;
export const SubstitutePlayerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SubstitutePlayer' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'SubstitutePlayerInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'substitutePlayer' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameMinute' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameSecond' } },
                { kind: 'Field', name: { kind: 'Name', value: 'position' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
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
  SubstitutePlayerMutation,
  SubstitutePlayerMutationVariables
>;
export const RecordGoalDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RecordGoal' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'RecordGoalInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'recordGoal' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameMinute' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameSecond' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'childEvents' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playerId' },
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
} as unknown as DocumentNode<RecordGoalMutation, RecordGoalMutationVariables>;
export const DeleteGoalDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteGoal' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameEventId' },
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
            name: { kind: 'Name', value: 'deleteGoal' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameEventId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameEventId' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteGoalMutation, DeleteGoalMutationVariables>;
export const DeleteSubstitutionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteSubstitution' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameEventId' },
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
            name: { kind: 'Name', value: 'deleteSubstitution' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameEventId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameEventId' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  DeleteSubstitutionMutation,
  DeleteSubstitutionMutationVariables
>;
export const DeletePositionSwapDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeletePositionSwap' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameEventId' },
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
            name: { kind: 'Name', value: 'deletePositionSwap' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameEventId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameEventId' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  DeletePositionSwapMutation,
  DeletePositionSwapMutationVariables
>;
export const DeleteStarterEntryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteStarterEntry' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameEventId' },
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
            name: { kind: 'Name', value: 'deleteStarterEntry' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameEventId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameEventId' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  DeleteStarterEntryMutation,
  DeleteStarterEntryMutationVariables
>;
export const GetDependentEventsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetDependentEvents' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameEventId' },
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
            name: { kind: 'Name', value: 'dependentEvents' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameEventId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameEventId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'dependentEvents' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'eventType' },
                      },
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
                        name: { kind: 'Name', value: 'playerName' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'description' },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'count' } },
                { kind: 'Field', name: { kind: 'Name', value: 'canDelete' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'warningMessage' },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetDependentEventsQuery,
  GetDependentEventsQueryVariables
>;
export const DeleteEventWithCascadeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteEventWithCascade' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameEventId' },
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
            name: { kind: 'Name', value: 'eventType' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteEventWithCascade' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameEventId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameEventId' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'eventType' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'eventType' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  DeleteEventWithCascadeMutation,
  DeleteEventWithCascadeMutationVariables
>;
export const ResolveEventConflictDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ResolveEventConflict' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'conflictId' },
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
            name: { kind: 'Name', value: 'selectedEventId' },
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
            name: { kind: 'Name', value: 'keepAll' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'resolveEventConflict' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'conflictId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'conflictId' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'selectedEventId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'selectedEventId' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'keepAll' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'keepAll' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameMinute' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameSecond' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'externalPlayerName' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'externalPlayerNumber' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'conflictId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'eventType' },
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
      },
    },
  ],
} as unknown as DocumentNode<
  ResolveEventConflictMutation,
  ResolveEventConflictMutationVariables
>;
export const UpdateGoalDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateGoal' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateGoalInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateGoal' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameMinute' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameSecond' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'childEvents' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playerId' },
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
} as unknown as DocumentNode<UpdateGoalMutation, UpdateGoalMutationVariables>;
export const SwapPositionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SwapPositions' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'SwapPositionsInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'swapPositions' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameMinute' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameSecond' } },
                { kind: 'Field', name: { kind: 'Name', value: 'position' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
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
  SwapPositionsMutation,
  SwapPositionsMutationVariables
>;
export const BatchLineupChangesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'BatchLineupChanges' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'BatchLineupChangesInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'batchLineupChanges' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameMinute' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameSecond' } },
                { kind: 'Field', name: { kind: 'Name', value: 'position' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
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
  BatchLineupChangesMutation,
  BatchLineupChangesMutationVariables
>;
export const GetPlayerPositionStatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetPlayerPositionStats' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameTeamId' },
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
            name: { kind: 'Name', value: 'playerPositionStats' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameTeamId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameTeamId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerName' } },
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
                  name: { kind: 'Name', value: 'totalMinutes' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'totalSeconds' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'positionTimes' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'minutes' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'seconds' },
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
  GetPlayerPositionStatsQuery,
  GetPlayerPositionStatsQueryVariables
>;
export const GetPlayerStatsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetPlayerStats' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'PlayerStatsInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'playerStats' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'playerId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'playerName' } },
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
                  name: { kind: 'Name', value: 'totalMinutes' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'totalSeconds' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'positionTimes' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'minutes' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'seconds' },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'goals' } },
                { kind: 'Field', name: { kind: 'Name', value: 'assists' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gamesPlayed' } },
                { kind: 'Field', name: { kind: 'Name', value: 'yellowCards' } },
                { kind: 'Field', name: { kind: 'Name', value: 'redCards' } },
                { kind: 'Field', name: { kind: 'Name', value: 'saves' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isOnField' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lastEntryGameSeconds' },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetPlayerStatsQuery, GetPlayerStatsQueryVariables>;
export const GameEventChangedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'GameEventChanged' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameId' },
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
            name: { kind: 'Name', value: 'gameEventChanged' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'action' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gameId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'event' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameTeamId' },
                      },
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
                        name: { kind: 'Name', value: 'position' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'playerId' },
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
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'playerId' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'externalPlayerName',
                              },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'externalPlayerNumber',
                              },
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
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'deletedEventId' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'conflict' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'conflictId' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'eventType' },
                      },
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
                        name: { kind: 'Name', value: 'conflictingEvents' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'eventId' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'playerName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'playerId' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'recordedByUserName',
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
      },
    },
  ],
} as unknown as DocumentNode<
  GameEventChangedSubscription,
  GameEventChangedSubscriptionVariables
>;
export const GameUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'GameUpdated' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'gameId' },
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
            name: { kind: 'Name', value: 'gameUpdated' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gameId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'gameId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'actualStart' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'firstHalfEnd' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'secondHalfStart' },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'actualEnd' } },
                { kind: 'Field', name: { kind: 'Name', value: 'pausedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GameUpdatedSubscription,
  GameUpdatedSubscriptionVariables
>;
export const GetMyDashboardDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMyDashboard' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'upcomingLimit' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'recentLimit' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'my' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
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
                        name: { kind: 'Name', value: 'isManaged' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'ownedTeams' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'managedTeams' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'upcomingGames' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'limit' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'upcomingLimit' },
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
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'status' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'venue' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameTeams' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'teamType' },
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
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'homePrimaryColor',
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'recentGames' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'limit' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'recentLimit' },
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
                        name: { kind: 'Name', value: 'status' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'actualEnd' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameTeams' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
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
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'homePrimaryColor',
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'liveGames' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'status' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'actualStart' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameTeams' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
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
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'homePrimaryColor',
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
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetMyDashboardQuery, GetMyDashboardQueryVariables>;
export const GetMyTeamsViewerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMyTeamsViewer' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'my' },
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
                        name: { kind: 'Name', value: 'isManaged' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'ownedTeams' },
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
      },
    },
  ],
} as unknown as DocumentNode<
  GetMyTeamsViewerQuery,
  GetMyTeamsViewerQueryVariables
>;
export const GetMyLiveGamesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMyLiveGames' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'my' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'liveGames' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'status' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'actualStart' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pausedAt' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'gameTeams' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
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
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'homePrimaryColor',
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
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetMyLiveGamesQuery, GetMyLiveGamesQueryVariables>;
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
                  name: { kind: 'Name', value: 'owner' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
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
                        name: { kind: 'Name', value: 'statsTrackingLevel' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'createdById' } },
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
export const UpdateTeamConfigurationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateTeamConfiguration' },
      variableDefinitions: [
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
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateTeamConfigurationInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateTeamConfiguration' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'teamId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'teamId' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'teamId' } },
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
                  name: { kind: 'Name', value: 'statsTrackingLevel' },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'defaultGameFormat' },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdateTeamConfigurationMutation,
  UpdateTeamConfigurationMutationVariables
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
export const GetMyTeamsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMyTeams' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myTeams' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'createdById' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetMyTeamsQuery, GetMyTeamsQueryVariables>;
export const GetAllUsersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetAllUsers' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'users' },
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
                        name: { kind: 'Name', value: 'joinedDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'leftDate' },
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
                  name: { kind: 'Name', value: 'teamCoaches' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'startDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'endDate' },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetAllUsersQuery, GetAllUsersQueryVariables>;
export const GetUsersByTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetUsersByTeam' },
      variableDefinitions: [
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
            name: { kind: 'Name', value: 'usersByTeam' },
            arguments: [
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
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
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
                        name: { kind: 'Name', value: 'joinedDate' },
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
                  name: { kind: 'Name', value: 'teamCoaches' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'startDate' },
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
} as unknown as DocumentNode<GetUsersByTeamQuery, GetUsersByTeamQueryVariables>;
export const SearchUsersByNameDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SearchUsersByName' },
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
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'usersByName' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'name' },
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamPlayers' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'primaryPosition' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamCoaches' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
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
  SearchUsersByNameQuery,
  SearchUsersByNameQueryVariables
>;
export const GetUsersCompleteDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetUsersComplete' },
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
                        name: { kind: 'Name', value: 'joinedDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'leftDate' },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetUsersCompleteQuery,
  GetUsersCompleteQueryVariables
>;
export const GetPlayersByTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetPlayersByTeam' },
      variableDefinitions: [
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
            name: { kind: 'Name', value: 'playersByTeam' },
            arguments: [
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
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
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
                        name: { kind: 'Name', value: 'joinedDate' },
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
  GetPlayersByTeamQuery,
  GetPlayersByTeamQueryVariables
>;
export const GetPlayersByPositionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetPlayersByPosition' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'position' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'playersByPosition' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'position' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'position' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
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
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
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
} as unknown as DocumentNode<
  GetPlayersByPositionQuery,
  GetPlayersByPositionQueryVariables
>;
export const SearchPlayersByNameDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SearchPlayersByName' },
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
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'playersByName' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'name' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamPlayers' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'primaryPosition' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'jerseyNumber' },
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
  SearchPlayersByNameQuery,
  SearchPlayersByNameQueryVariables
>;
export const GetCoachesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetCoaches' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'coaches' },
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
                  name: { kind: 'Name', value: 'teamCoaches' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'startDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'endDate' },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetCoachesQuery, GetCoachesQueryVariables>;
export const GetCoachesByTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetCoachesByTeam' },
      variableDefinitions: [
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
            name: { kind: 'Name', value: 'coachesByTeam' },
            arguments: [
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
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamCoaches' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'startDate' },
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
  GetCoachesByTeamQuery,
  GetCoachesByTeamQueryVariables
>;
export const GetCoachesByRoleDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetCoachesByRole' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'role' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'coachesByRole' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'role' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'role' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamCoaches' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'startDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
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
} as unknown as DocumentNode<
  GetCoachesByRoleQuery,
  GetCoachesByRoleQueryVariables
>;
export const SearchCoachesByNameDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SearchCoachesByName' },
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
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'coachesByName' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'name' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teamCoaches' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'team' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
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
  SearchCoachesByNameQuery,
  SearchCoachesByNameQueryVariables
>;
export const GetUserByIdDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetUserById' },
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
            name: { kind: 'Name', value: 'user' },
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
                        name: { kind: 'Name', value: 'joinedDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'leftDate' },
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
                  name: { kind: 'Name', value: 'teamCoaches' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'startDate' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'endDate' },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetUserByIdQuery, GetUserByIdQueryVariables>;
export const CreateUserDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateUser' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'createUserInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CreateUserInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createUser' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'createUserInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'createUserInput' },
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
} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
export const UpdateUserDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateUser' },
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
            name: { kind: 'Name', value: 'updateUserInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateUserInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateUser' },
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
                name: { kind: 'Name', value: 'updateUserInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'updateUserInput' },
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
} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;
export const RemoveUserDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveUser' },
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
            name: { kind: 'Name', value: 'removeUser' },
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
} as unknown as DocumentNode<RemoveUserMutation, RemoveUserMutationVariables>;
export const AddPlayerToTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddPlayerToTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'userId' },
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
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'jerseyNumber' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'primaryPosition' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'joinedDate' },
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'DateTime' },
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
                name: { kind: 'Name', value: 'userId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'userId' },
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
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'jerseyNumber' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'jerseyNumber' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'primaryPosition' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'primaryPosition' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'joinedDate' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'joinedDate' },
                },
              },
            ],
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
                { kind: 'Field', name: { kind: 'Name', value: 'joinedDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'team' },
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
      },
    },
  ],
} as unknown as DocumentNode<
  AddPlayerToTeamMutation,
  AddPlayerToTeamMutationVariables
>;
export const RemoveUserFromTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveUserFromTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'userId' },
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
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'leftDate' },
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'DateTime' },
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
                name: { kind: 'Name', value: 'userId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'userId' },
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
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'leftDate' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'leftDate' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  RemoveUserFromTeamMutation,
  RemoveUserFromTeamMutationVariables
>;
export const AddCoachToTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddCoachToTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'userId' },
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
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'role' } },
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
            name: { kind: 'Name', value: 'startDate' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'DateTime' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addCoachToTeam' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'userId' },
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
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'role' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'role' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'startDate' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'startDate' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                { kind: 'Field', name: { kind: 'Name', value: 'startDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'team' },
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
      },
    },
  ],
} as unknown as DocumentNode<
  AddCoachToTeamMutation,
  AddCoachToTeamMutationVariables
>;
export const RemoveCoachFromTeamDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveCoachFromTeam' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'userId' },
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
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'endDate' },
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'DateTime' },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'removeCoachFromTeam' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'userId' },
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
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'endDate' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'endDate' },
                },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  RemoveCoachFromTeamMutation,
  RemoveCoachFromTeamMutationVariables
>;
export const CreateUserAccountDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateUserAccount' },
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
  CreateUserAccountMutation,
  CreateUserAccountMutationVariables
>;
export const CreateCoachDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateCoach' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'createCoachInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CreateUserInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createCoach' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'createCoachInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'createCoachInput' },
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
} as unknown as DocumentNode<CreateCoachMutation, CreateCoachMutationVariables>;
export const UpdateUserAccountDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateUserAccount' },
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
  UpdateUserAccountMutation,
  UpdateUserAccountMutationVariables
>;
export const UpdateCoachDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateCoach' },
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
            name: { kind: 'Name', value: 'updateCoachInput' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateUserInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateCoach' },
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
                name: { kind: 'Name', value: 'updateCoachInput' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'updateCoachInput' },
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
} as unknown as DocumentNode<UpdateCoachMutation, UpdateCoachMutationVariables>;
export const UserUpdatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'UserUpdated' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'userUpdated' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
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
  UserUpdatedSubscription,
  UserUpdatedSubscriptionVariables
>;
export const UserCreatedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'UserCreated' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'userCreated' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UserCreatedSubscription,
  UserCreatedSubscriptionVariables
>;

import { graphql } from '@garage/soccer-stats/graphql-codegen';

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
      status
      actualStart
      firstHalfEnd
      secondHalfStart
      actualEnd
      pausedAt
      statsTrackingLevel
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
        statsTrackingLevel
        team {
          id
          name
          shortName
          homePrimaryColor
          homeSecondaryColor
          isManaged
          teamPlayers {
            id
            userId
            jerseyNumber
            primaryPosition
            isActive
            user {
              id
              email
              firstName
              lastName
            }
          }
        }
        gameEvents {
          id
          createdAt
          gameMinute
          gameSecond
          position
          formation
          playerId
          externalPlayerName
          externalPlayerNumber
          period
          player {
            id
            firstName
            lastName
            email
          }
          eventType {
            id
            name
            category
          }
          childEvents {
            id
            playerId
            externalPlayerName
            externalPlayerNumber
            position
            player {
              id
              firstName
              lastName
            }
            eventType {
              id
              name
            }
          }
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
      status
      actualStart
      firstHalfEnd
      secondHalfStart
      actualEnd
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

export const REOPEN_GAME = graphql(/* GraphQL */ `
  mutation ReopenGame($id: ID!) {
    reopenGame(id: $id) {
      id
      status
      actualEnd
    }
  }
`);

export const UPDATE_GAME_TEAM = graphql(/* GraphQL */ `
  mutation UpdateGameTeam(
    $gameTeamId: ID!
    $updateGameTeamInput: UpdateGameTeamInput!
  ) {
    updateGameTeam(
      gameTeamId: $gameTeamId
      updateGameTeamInput: $updateGameTeamInput
    ) {
      id
      teamType
      formation
      statsTrackingLevel
      tacticalNotes
      team {
        id
        name
      }
    }
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
  homeTeamId: string;
  awayTeamId: string;
  gameFormatId: string;
  duration?: number;
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

// Lineup-related queries and mutations
export const GET_GAME_LINEUP = graphql(/* GraphQL */ `
  query GetGameLineup($gameTeamId: ID!) {
    gameLineup(gameTeamId: $gameTeamId) {
      gameTeamId
      formation
      starters {
        gameEventId
        playerId
        playerName
        firstName
        lastName
        externalPlayerName
        externalPlayerNumber
        position
        isOnField
      }
      bench {
        gameEventId
        playerId
        playerName
        firstName
        lastName
        externalPlayerName
        externalPlayerNumber
        position
        isOnField
      }
      currentOnField {
        gameEventId
        playerId
        playerName
        firstName
        lastName
        externalPlayerName
        externalPlayerNumber
        position
        isOnField
      }
    }
  }
`);

export const GET_EVENT_TYPES = graphql(/* GraphQL */ `
  query GetEventTypes {
    eventTypes {
      id
      name
      category
      description
      requiresPosition
      allowsParent
    }
  }
`);

export const ADD_PLAYER_TO_LINEUP = graphql(/* GraphQL */ `
  mutation AddPlayerToLineup($input: AddToLineupInput!) {
    addPlayerToLineup(input: $input) {
      id
      gameMinute
      gameSecond
      position
      playerId
      externalPlayerName
      externalPlayerNumber
      eventType {
        id
        name
      }
    }
  }
`);

export const ADD_PLAYER_TO_BENCH = graphql(/* GraphQL */ `
  mutation AddPlayerToBench($input: AddToBenchInput!) {
    addPlayerToBench(input: $input) {
      id
      gameMinute
      gameSecond
      position
      playerId
      externalPlayerName
      externalPlayerNumber
      eventType {
        id
        name
      }
    }
  }
`);

export const REMOVE_FROM_LINEUP = graphql(/* GraphQL */ `
  mutation RemoveFromLineup($gameEventId: ID!) {
    removeFromLineup(gameEventId: $gameEventId)
  }
`);

export const UPDATE_PLAYER_POSITION = graphql(/* GraphQL */ `
  mutation UpdatePlayerPosition($gameEventId: ID!, $position: String!) {
    updatePlayerPosition(gameEventId: $gameEventId, position: $position) {
      id
      position
    }
  }
`);

export const SUBSTITUTE_PLAYER = graphql(/* GraphQL */ `
  mutation SubstitutePlayer($input: SubstitutePlayerInput!) {
    substitutePlayer(input: $input) {
      id
      gameMinute
      gameSecond
      position
      playerId
      externalPlayerName
      externalPlayerNumber
      eventType {
        id
        name
      }
    }
  }
`);

export const RECORD_FORMATION_CHANGE = graphql(/* GraphQL */ `
  mutation RecordFormationChange($input: RecordFormationChangeInput!) {
    recordFormationChange(input: $input) {
      id
      gameMinute
      gameSecond
      eventType {
        id
        name
      }
    }
  }
`);

export const RECORD_POSITION_CHANGE = graphql(/* GraphQL */ `
  mutation RecordPositionChange($input: RecordPositionChangeInput!) {
    recordPositionChange(input: $input) {
      id
      gameMinute
      gameSecond
      position
      eventType {
        id
        name
      }
    }
  }
`);

export const RECORD_GOAL = graphql(/* GraphQL */ `
  mutation RecordGoal($input: RecordGoalInput!) {
    recordGoal(input: $input) {
      id
      gameMinute
      gameSecond
      playerId
      externalPlayerName
      externalPlayerNumber
      eventType {
        id
        name
      }
      childEvents {
        id
        playerId
        externalPlayerName
        externalPlayerNumber
        eventType {
          id
          name
        }
      }
    }
  }
`);

export const DELETE_GOAL = graphql(/* GraphQL */ `
  mutation DeleteGoal($gameEventId: ID!) {
    deleteGoal(gameEventId: $gameEventId)
  }
`);

export const DELETE_SUBSTITUTION = graphql(/* GraphQL */ `
  mutation DeleteSubstitution($gameEventId: ID!) {
    deleteSubstitution(gameEventId: $gameEventId)
  }
`);

export const DELETE_POSITION_SWAP = graphql(/* GraphQL */ `
  mutation DeletePositionSwap($gameEventId: ID!) {
    deletePositionSwap(gameEventId: $gameEventId)
  }
`);

export const DELETE_STARTER_ENTRY = graphql(/* GraphQL */ `
  mutation DeleteStarterEntry($gameEventId: ID!) {
    deleteStarterEntry(gameEventId: $gameEventId)
  }
`);

export const GET_DEPENDENT_EVENTS = graphql(/* GraphQL */ `
  query GetDependentEvents($gameEventId: ID!) {
    dependentEvents(gameEventId: $gameEventId) {
      dependentEvents {
        id
        eventType
        gameMinute
        gameSecond
        playerName
        description
      }
      count
      canDelete
      warningMessage
    }
  }
`);

export const DELETE_EVENT_WITH_CASCADE = graphql(/* GraphQL */ `
  mutation DeleteEventWithCascade($gameEventId: ID!, $eventType: String!) {
    deleteEventWithCascade(gameEventId: $gameEventId, eventType: $eventType)
  }
`);

export const RESOLVE_EVENT_CONFLICT = graphql(/* GraphQL */ `
  mutation ResolveEventConflict(
    $conflictId: ID!
    $selectedEventId: ID!
    $keepAll: Boolean
  ) {
    resolveEventConflict(
      conflictId: $conflictId
      selectedEventId: $selectedEventId
      keepAll: $keepAll
    ) {
      id
      gameMinute
      gameSecond
      playerId
      externalPlayerName
      externalPlayerNumber
      conflictId
      eventType {
        id
        name
      }
    }
  }
`);

export const UPDATE_GOAL = graphql(/* GraphQL */ `
  mutation UpdateGoal($input: UpdateGoalInput!) {
    updateGoal(input: $input) {
      id
      gameMinute
      gameSecond
      playerId
      externalPlayerName
      externalPlayerNumber
      eventType {
        id
        name
      }
      childEvents {
        id
        playerId
        externalPlayerName
        externalPlayerNumber
        eventType {
          id
          name
        }
      }
    }
  }
`);

export const SWAP_POSITIONS = graphql(/* GraphQL */ `
  mutation SwapPositions($input: SwapPositionsInput!) {
    swapPositions(input: $input) {
      id
      gameMinute
      gameSecond
      position
      playerId
      externalPlayerName
      externalPlayerNumber
      eventType {
        id
        name
      }
    }
  }
`);

export const BATCH_LINEUP_CHANGES = graphql(/* GraphQL */ `
  mutation BatchLineupChanges($input: BatchLineupChangesInput!) {
    batchLineupChanges(input: $input) {
      id
      gameMinute
      gameSecond
      position
      playerId
      externalPlayerName
      externalPlayerNumber
      eventType {
        id
        name
      }
    }
  }
`);

export const GET_PLAYER_POSITION_STATS = graphql(/* GraphQL */ `
  query GetPlayerPositionStats($gameTeamId: ID!) {
    playerPositionStats(gameTeamId: $gameTeamId) {
      playerId
      playerName
      externalPlayerName
      externalPlayerNumber
      totalMinutes
      totalSeconds
      positionTimes {
        position
        minutes
        seconds
      }
    }
  }
`);

export const GET_PLAYER_STATS = graphql(/* GraphQL */ `
  query GetPlayerStats($input: PlayerStatsInput!) {
    playerStats(input: $input) {
      playerId
      playerName
      externalPlayerName
      externalPlayerNumber
      totalMinutes
      totalSeconds
      positionTimes {
        position
        minutes
        seconds
      }
      goals
      assists
      gamesPlayed
      yellowCards
      redCards
      saves
      isOnField
      lastEntryGameSeconds
    }
  }
`);

// Subscription for real-time game event updates
export const GAME_EVENT_CHANGED = graphql(/* GraphQL */ `
  subscription GameEventChanged($gameId: ID!) {
    gameEventChanged(gameId: $gameId) {
      action
      gameId
      event {
        id
        gameTeamId
        gameMinute
        gameSecond
        position
        period
        playerId
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
        }
        recordedByUser {
          id
          firstName
          lastName
        }
        childEvents {
          id
          gameMinute
          gameSecond
          playerId
          externalPlayerName
          externalPlayerNumber
          position
          player {
            id
            firstName
            lastName
          }
          eventType {
            id
            name
            category
          }
        }
      }
      deletedEventId
      conflict {
        conflictId
        eventType
        gameMinute
        gameSecond
        conflictingEvents {
          eventId
          playerName
          playerId
          recordedByUserName
        }
      }
    }
  }
`);

// Subscription for real-time game state updates (start, pause, half-time, end, reset)
export const GAME_UPDATED = graphql(/* GraphQL */ `
  subscription GameUpdated($gameId: ID!) {
    gameUpdated(gameId: $gameId) {
      id
      name
      status
      actualStart
      firstHalfEnd
      secondHalfStart
      actualEnd
      pausedAt
    }
  }
`);

// Bring a player onto the field during a game (halftime or mid-game)
export const BRING_PLAYER_ONTO_FIELD = graphql(/* GraphQL */ `
  mutation BringPlayerOntoField($input: BringPlayerOntoFieldInput!) {
    bringPlayerOntoField(input: $input) {
      id
      gameMinute
      gameSecond
      position
      playerId
      externalPlayerName
      externalPlayerNumber
      eventType {
        id
        name
      }
    }
  }
`);

// Set second half lineup - subs everyone out/in at halftime with new positions
export const SET_SECOND_HALF_LINEUP = graphql(/* GraphQL */ `
  mutation SetSecondHalfLineup($input: SetSecondHalfLineupInput!) {
    setSecondHalfLineup(input: $input) {
      events {
        id
        gameMinute
        gameSecond
        position
        playerId
        externalPlayerName
        externalPlayerNumber
        eventType {
          id
          name
        }
      }
      substitutionsOut
      substitutionsIn
    }
  }
`);

// Start a period - creates PERIOD_START event and SUB_IN events for lineup
export const START_PERIOD = graphql(/* GraphQL */ `
  mutation StartPeriod($input: StartPeriodInput!) {
    startPeriod(input: $input) {
      periodEvent {
        id
        gameMinute
        gameSecond
        period
        eventType {
          id
          name
        }
        childEvents {
          id
          playerId
          externalPlayerName
          externalPlayerNumber
          position
          eventType {
            id
            name
          }
        }
      }
      substitutionEvents {
        id
        gameMinute
        gameSecond
        position
        period
        playerId
        externalPlayerName
        externalPlayerNumber
        eventType {
          id
          name
        }
      }
      period
      substitutionCount
    }
  }
`);

// End a period - creates PERIOD_END event and SUB_OUT events for all on-field players
export const END_PERIOD = graphql(/* GraphQL */ `
  mutation EndPeriod($input: EndPeriodInput!) {
    endPeriod(input: $input) {
      periodEvent {
        id
        gameMinute
        gameSecond
        period
        eventType {
          id
          name
        }
        childEvents {
          id
          playerId
          externalPlayerName
          externalPlayerNumber
          position
          eventType {
            id
            name
          }
        }
      }
      substitutionEvents {
        id
        gameMinute
        gameSecond
        position
        period
        playerId
        externalPlayerName
        externalPlayerNumber
        eventType {
          id
          name
        }
      }
      period
      substitutionCount
    }
  }
`);

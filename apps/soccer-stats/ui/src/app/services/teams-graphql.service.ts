import { graphql } from '../generated/gql';
import { StatsTrackingLevel } from '../generated/graphql';

export const GET_TEAMS = graphql(/* GraphQL */ `
  query GetTeams {
    teams {
      id
      name
      shortName
      description
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
      isActive
      isManaged
      sourceType
      createdAt
      updatedAt
    }
  }
`);

export const GET_TEAM_BY_ID = graphql(/* GraphQL */ `
  query GetTeamById($id: ID!) {
    team(id: $id) {
      id
      name
      shortName
      description
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
      isActive
      isManaged
      sourceType
      createdAt
      updatedAt
      owner {
        id
        role
        user {
          id
          firstName
          lastName
          email
        }
      }
      playersWithJersey {
        id
        name
        position
        jersey
        depthRank
        isActive
      }
      teamPlayers {
        id
        jerseyNumber
        primaryPosition
        isActive
        joinedDate
        leftDate
        user {
          id
          firstName
          lastName
          email
        }
      }
      teamConfiguration {
        id
        defaultFormation
        defaultGameDuration
        defaultPlayerCount
        statsTrackingLevel
        defaultGameFormat {
          id
          name
          playersPerTeam
          durationMinutes
        }
      }
      gameTeams {
        id
        teamType
        finalScore
        formation
        game {
          id
          name
          scheduledStart
        }
      }
    }
  }
`);

export const CREATE_TEAM = graphql(/* GraphQL */ `
  mutation CreateTeam($createTeamInput: CreateTeamInput!) {
    createTeam(createTeamInput: $createTeamInput) {
      id
      name
      shortName
      description
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
      isActive
      isManaged
      sourceType
      createdById
      createdAt
      updatedAt
    }
  }
`);

export const UPDATE_TEAM = graphql(/* GraphQL */ `
  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {
    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {
      id
      name
      shortName
      description
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
      isActive
      isManaged
      createdAt
      updatedAt
    }
  }
`);

export const UPDATE_TEAM_CONFIGURATION = graphql(/* GraphQL */ `
  mutation UpdateTeamConfiguration(
    $teamId: ID!
    $input: UpdateTeamConfigurationInput!
  ) {
    updateTeamConfiguration(teamId: $teamId, input: $input) {
      id
      teamId
      defaultFormation
      defaultGameDuration
      defaultPlayerCount
      statsTrackingLevel
      defaultGameFormat {
        id
        name
        playersPerTeam
        durationMinutes
      }
    }
  }
`);

// Temporarily disable problematic mutation until schema is fixed
// export const ADD_PLAYER_TO_TEAM_WITH_DETAILS = graphql(/* GraphQL */ `
//   mutation AddPlayerToTeamWithDetails($addPlayerToTeamInput: AddPlayerToTeamInput!) {
//     addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {
//       id
//       name
//       shortName
//       homePrimaryColor
//       homeSecondaryColor
//       awayPrimaryColor
//       awaySecondaryColor
//       logoUrl
//       createdAt
//       updatedAt
//       players {
//         id
//         firstName
//         lastName
//         email
//       }
//       playersWithJersey {
//         id
//         name
//         position
//         jersey
//         depthRank
//         isActive
//       }
//     }
//   }
// `);

// MVP-specific mutations for managed/unmanaged team workflow
export const CREATE_UNMANAGED_TEAM = graphql(/* GraphQL */ `
  mutation CreateUnmanagedTeam($name: String!, $shortName: String) {
    createUnmanagedTeam(name: $name, shortName: $shortName) {
      id
      name
      shortName
      isManaged
      sourceType
      createdAt
      updatedAt
    }
  }
`);

export const FIND_OR_CREATE_UNMANAGED_TEAM = graphql(/* GraphQL */ `
  mutation FindOrCreateUnmanagedTeam($name: String!, $shortName: String) {
    findOrCreateUnmanagedTeam(name: $name, shortName: $shortName) {
      id
      name
      shortName
      isManaged
      sourceType
      createdAt
      updatedAt
    }
  }
`);

// MVP-specific queries for team filtering
export const GET_MANAGED_TEAMS = graphql(/* GraphQL */ `
  query GetManagedTeams {
    managedTeams {
      id
      name
      shortName
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
      isActive
      isManaged
      sourceType
      createdAt
      updatedAt
    }
  }
`);

export const GET_UNMANAGED_TEAMS = graphql(/* GraphQL */ `
  query GetUnmanagedTeams {
    unmanagedTeams {
      id
      name
      shortName
      isManaged
      sourceType
      createdAt
      updatedAt
    }
  }
`);

export const GET_TEAMS_BY_MANAGED_STATUS = graphql(/* GraphQL */ `
  query GetTeamsByManagedStatus($isManaged: Boolean!) {
    teamsByManagedStatus(isManaged: $isManaged) {
      id
      name
      shortName
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
      isActive
      isManaged
      sourceType
      createdAt
      updatedAt
    }
  }
`);

// Get teams the current user has access to (requires authentication)
export const GET_MY_TEAMS = graphql(/* GraphQL */ `
  query GetMyTeams {
    myTeams {
      id
      name
      shortName
      description
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
      isActive
      isManaged
      sourceType
      createdById
      createdAt
      updatedAt
    }
  }
`);

// TypeScript types - these would normally be generated
export interface Team {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  homePrimaryColor?: string;
  homeSecondaryColor?: string;
  awayPrimaryColor?: string;
  awaySecondaryColor?: string;
  logoUrl?: string;
  isActive: boolean;
  isManaged: boolean;
  sourceType: string;
  createdAt: string;
  updatedAt: string;
  playersWithJersey?: PlayerWithJersey[];
  teamPlayers?: TeamPlayer[];
  teamConfiguration?: TeamConfiguration;
  gameTeams?: GameTeam[];
}

export interface TeamWithGames extends Team {
  gameTeams: GameTeam[];
}

export interface PlayerWithJersey {
  id: string;
  name: string;
  position: string;
  jersey: string;
  depthRank: number;
  isActive: boolean;
}

export interface TeamPlayer {
  id: string;
  jerseyNumber?: string;
  primaryPosition: string;
  isActive: boolean;
  joinedDate: string;
  leftDate?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TeamConfiguration {
  id: string;
  teamId?: string;
  defaultFormation: string;
  defaultGameDuration: number;
  defaultPlayerCount: number;
  statsTrackingLevel: StatsTrackingLevel;
  // TODO: Add defaultLineup when implementing lineup defaults feature
  defaultGameFormat: {
    id: string;
    name: string;
    playersPerTeam: number;
    durationMinutes: number;
  };
}

export interface UpdateTeamConfigurationInput {
  defaultGameFormatId?: string;
  defaultFormation?: string;
  defaultGameDuration?: number;
  defaultPlayerCount?: number;
  statsTrackingLevel?: StatsTrackingLevel;
  // TODO: Add defaultLineup when implementing lineup defaults feature
}

export interface UpdateTeamConfigurationResponse {
  updateTeamConfiguration: TeamConfiguration;
}

export interface GameTeam {
  id: string;
  teamType: string;
  finalScore?: number;
  formation?: string;
  game: {
    id: string;
    name: string;
    scheduledStart: string;
  };
}

export interface CreateTeamInput {
  name: string;
  shortName?: string;
  description?: string;
  homePrimaryColor?: string;
  homeSecondaryColor?: string;
  awayPrimaryColor?: string;
  awaySecondaryColor?: string;
  logoUrl?: string;
}

export interface UpdateTeamInput {
  name?: string;
  shortName?: string;
  description?: string;
  homePrimaryColor?: string;
  homeSecondaryColor?: string;
  awayPrimaryColor?: string;
  awaySecondaryColor?: string;
  logoUrl?: string;
}

export interface AddPlayerToTeamInput {
  teamId: string;
  playerId: string;
  jerseyNumber?: string;
  primaryPosition: string;
}

// Response types
export interface TeamsResponse {
  teams: Team[];
}

export interface TeamResponse {
  team: Team;
}

export interface CreateTeamResponse {
  createTeam: Team;
}

export interface UpdateTeamResponse {
  updateTeam: Team;
}

export interface AddPlayerToTeamResponse {
  addPlayerToTeam: Team;
}

// Re-export from generated types for consumers
export { StatsTrackingLevel };

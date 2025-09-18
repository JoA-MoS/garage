import { gql } from '@apollo/client';

import { Player } from './players-graphql.service';

export const GET_TEAMS = gql`
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
`;

export const GET_TEAM_BY_ID = gql`
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
`;

export const CREATE_TEAM = gql`
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
`;

export const ADD_PLAYER_TO_TEAM_WITH_DETAILS = gql`
  mutation AddPlayerToTeamWithDetails(
    $addPlayerToTeamInput: AddPlayerToTeamInput!
  ) {
    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {
      id
      name
      shortName
      homePrimaryColor
      homeSecondaryColor
      awayPrimaryColor
      awaySecondaryColor
      logoUrl
      createdAt
      updatedAt
      players {
        id
        firstName
        lastName
        email
      }
      playersWithJersey {
        id
        name
        position
        jersey
        depthRank
        isActive
      }
    }
  }
`;

// MVP-specific mutations for managed/unmanaged team workflow
export const CREATE_UNMANAGED_TEAM = gql`
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
`;

export const FIND_OR_CREATE_UNMANAGED_TEAM = gql`
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
`;

// MVP-specific queries for team filtering
export const GET_MANAGED_TEAMS = gql`
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
`;

export const GET_UNMANAGED_TEAMS = gql`
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
`;

export const GET_TEAMS_BY_MANAGED_STATUS = gql`
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
  shortName?: string;
  description?: string;
  homePrimaryColor?: string;
  homeSecondaryColor?: string;
  awayPrimaryColor?: string;
  awaySecondaryColor?: string;
  logoUrl?: string;
  isActive: boolean;
  isManaged: boolean;
  sourceType: 'INTERNAL' | 'EXTERNAL';
  createdAt: string;
  updatedAt: string;
  players?: Player[];
  playersWithJersey?: PlayerWithJersey[];
  teamPlayers?: TeamPlayer[];
  teamConfiguration?: TeamConfiguration;
}

export interface TeamPlayer {
  id: string;
  jerseyNumber?: string;
  primaryPosition?: string;
  isActive: boolean;
  joinedDate?: string;
  leftDate?: string;
  user: Player;
}

export interface TeamConfiguration {
  id: string;
  defaultFormation: string;
  defaultGameDuration: number;
  defaultPlayerCount: number;
  defaultGameFormat: GameFormat;
}

export interface GameFormat {
  id: string;
  name: string;
  playersPerTeam: number;
  durationMinutes: number;
}

export interface Game {
  id: string;
  name?: string;
  scheduledStart?: string;
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
  // Legacy support
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

// MVP-specific interfaces for managed/unmanaged team workflow
export interface CreateUnmanagedTeamVariables {
  name: string;
  shortName?: string;
}

export interface FindOrCreateUnmanagedTeamVariables {
  name: string;
  shortName?: string;
}

export interface CreateUnmanagedTeamResponse {
  createUnmanagedTeam: Team;
}

export interface FindOrCreateUnmanagedTeamResponse {
  findOrCreateUnmanagedTeam: Team;
}

export interface ManagedTeamsResponse {
  managedTeams: Team[];
}

export interface UnmanagedTeamsResponse {
  unmanagedTeams: Team[];
}

export interface TeamsByManagedStatusResponse {
  teamsByManagedStatus: Team[];
}

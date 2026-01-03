import { graphql } from '@garage/soccer-stats/graphql-codegen';

// =================================
// UNIFIED USER QUERIES (New API)
// =================================

/**
 * Get all users (players, coaches, and other users)
 * This is the new unified approach that replaces separate player/coach queries
 */
export const GET_ALL_USERS = graphql(`
  query GetAllUsers {
    users {
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
        joinedDate
        leftDate
        isActive
        team {
          id
          name
          shortName
        }
      }
      teamCoaches {
        id
        role
        startDate
        endDate
        isActive
        team {
          id
          name
          shortName
        }
      }
    }
  }
`);

/**
 * Get users by team - shows all team members (players + coaches) in one query
 * This replaces the need for separate player/coach team queries
 */
export const GET_USERS_BY_TEAM = graphql(`
  query GetUsersByTeam($teamId: ID!) {
    usersByTeam(teamId: $teamId) {
      id
      firstName
      lastName
      email
      phone
      isActive
      teamPlayers {
        id
        jerseyNumber
        primaryPosition
        joinedDate
        isActive
      }
      teamCoaches {
        id
        role
        startDate
        isActive
      }
    }
  }
`);

/**
 * Search users by name across all user types
 */
export const SEARCH_USERS_BY_NAME = graphql(`
  query SearchUsersByName($name: String!) {
    usersByName(name: $name) {
      id
      firstName
      lastName
      email
      teamPlayers {
        team {
          name
        }
        primaryPosition
      }
      teamCoaches {
        team {
          name
        }
        role
      }
    }
  }
`);

// =================================
// PLAYER-SPECIFIC QUERIES (Enhanced)
// =================================

/**
 * Get all players - enhanced version of existing query
 * Now uses the unified API but still maintains the same interface
 */
export const GET_PLAYERS = graphql(`
  query GetUsersComplete {
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
        joinedDate
        leftDate
        isActive
        team {
          id
          name
          shortName
        }
      }
    }
  }
`);

/**
 * Get players by team - more focused than the general usersByTeam query
 */
export const GET_PLAYERS_BY_TEAM = graphql(`
  query GetPlayersByTeam($teamId: ID!) {
    playersByTeam(teamId: $teamId) {
      id
      firstName
      lastName
      teamPlayers {
        id
        jerseyNumber
        primaryPosition
        joinedDate
        isActive
      }
    }
  }
`);

/**
 * Get players by position - existing functionality enhanced
 */
export const GET_PLAYERS_BY_POSITION = graphql(`
  query GetPlayersByPosition($position: String!) {
    playersByPosition(position: $position) {
      id
      firstName
      lastName
      teamPlayers {
        id
        jerseyNumber
        team {
          name
        }
      }
    }
  }
`);

/**
 * Search players by name
 */
export const SEARCH_PLAYERS_BY_NAME = graphql(`
  query SearchPlayersByName($name: String!) {
    playersByName(name: $name) {
      id
      firstName
      lastName
      teamPlayers {
        team {
          name
        }
        primaryPosition
        jerseyNumber
      }
    }
  }
`);

// =================================
// COACH-SPECIFIC QUERIES (New)
// =================================

/**
 * Get all coaches
 */
export const GET_COACHES = graphql(`
  query GetCoaches {
    coaches {
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
      teamCoaches {
        id
        role
        startDate
        endDate
        isActive
        team {
          id
          name
          shortName
        }
      }
    }
  }
`);

/**
 * Get coaches by team
 */
export const GET_COACHES_BY_TEAM = graphql(`
  query GetCoachesByTeam($teamId: ID!) {
    coachesByTeam(teamId: $teamId) {
      id
      firstName
      lastName
      teamCoaches {
        id
        role
        startDate
        isActive
      }
    }
  }
`);

/**
 * Get coaches by role (Head Coach, Assistant Coach, etc.)
 */
export const GET_COACHES_BY_ROLE = graphql(`
  query GetCoachesByRole($role: String!) {
    coachesByRole(role: $role) {
      id
      firstName
      lastName
      teamCoaches {
        id
        startDate
        team {
          name
        }
      }
    }
  }
`);

/**
 * Search coaches by name
 */
export const SEARCH_COACHES_BY_NAME = graphql(`
  query SearchCoachesByName($name: String!) {
    coachesByName(name: $name) {
      id
      firstName
      lastName
      teamCoaches {
        team {
          name
        }
        role
      }
    }
  }
`);

// =================================
// SINGLE USER QUERIES
// =================================

/**
 * Get single user by ID with all relationship data
 */
export const GET_USER_BY_ID = graphql(`
  query GetUserById($id: ID!) {
    user(id: $id) {
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
        joinedDate
        leftDate
        isActive
        team {
          id
          name
          shortName
        }
      }
      teamCoaches {
        id
        role
        startDate
        endDate
        isActive
        team {
          id
          name
          shortName
        }
      }
    }
  }
`);

// =================================
// USER MUTATIONS (Unified)
// =================================

/**
 * Create a new user - unified approach
 */
export const CREATE_USER = graphql(`
  mutation CreateUser($createUserInput: CreateUserInput!) {
    createUser(createUserInput: $createUserInput) {
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

/**
 * Update user information
 */
export const UPDATE_USER = graphql(`
  mutation UpdateUser($id: ID!, $updateUserInput: UpdateUserInput!) {
    updateUser(id: $id, updateUserInput: $updateUserInput) {
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

/**
 * Remove/deactivate user
 */
export const REMOVE_USER = graphql(`
  mutation RemoveUser($id: ID!) {
    removeUser(id: $id)
  }
`);

// =================================
// RELATIONSHIP MANAGEMENT MUTATIONS
// =================================

/**
 * Add user to team as player
 */
export const ADD_PLAYER_TO_TEAM = graphql(`
  mutation AddPlayerToTeam(
    $userId: ID!
    $teamId: ID!
    $jerseyNumber: String
    $primaryPosition: String
    $joinedDate: DateTime
  ) {
    addPlayerToTeam(
      userId: $userId
      teamId: $teamId
      jerseyNumber: $jerseyNumber
      primaryPosition: $primaryPosition
      joinedDate: $joinedDate
    ) {
      id
      jerseyNumber
      primaryPosition
      joinedDate
      isActive
      team {
        id
        name
      }
    }
  }
`);

/**
 * Remove player from team
 */
export const REMOVE_PLAYER_FROM_TEAM = graphql(`
  mutation RemoveUserFromTeam($userId: ID!, $teamId: ID!, $leftDate: DateTime) {
    removePlayerFromTeam(userId: $userId, teamId: $teamId, leftDate: $leftDate)
  }
`);

/**
 * Add user to team as coach
 */
export const ADD_COACH_TO_TEAM = graphql(`
  mutation AddCoachToTeam(
    $userId: ID!
    $teamId: ID!
    $role: String!
    $startDate: DateTime!
  ) {
    addCoachToTeam(
      userId: $userId
      teamId: $teamId
      role: $role
      startDate: $startDate
    ) {
      id
      role
      startDate
      isActive
      team {
        id
        name
      }
    }
  }
`);

/**
 * Remove coach from team
 */
export const REMOVE_COACH_FROM_TEAM = graphql(`
  mutation RemoveCoachFromTeam($userId: ID!, $teamId: ID!, $endDate: DateTime) {
    removeCoachFromTeam(userId: $userId, teamId: $teamId, endDate: $endDate)
  }
`);

// =================================
// BACKWARD COMPATIBILITY (Legacy API)
// =================================

/**
 * @deprecated Use CREATE_USER instead
 * Legacy mutation for backward compatibility
 */
export const CREATE_PLAYER = graphql(`
  mutation CreateUserAccount($createPlayerInput: CreatePlayerInput!) {
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

/**
 * @deprecated Use CREATE_USER instead
 * Legacy mutation for backward compatibility
 */
export const CREATE_COACH = graphql(`
  mutation CreateCoach($createCoachInput: CreateUserInput!) {
    createCoach(createCoachInput: $createCoachInput) {
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

/**
 * @deprecated Use UPDATE_USER instead
 * Legacy mutation for backward compatibility
 */
export const UPDATE_PLAYER = graphql(`
  mutation UpdateUserAccount($id: ID!, $updatePlayerInput: UpdatePlayerInput!) {
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

/**
 * @deprecated Use UPDATE_USER instead
 * Legacy mutation for backward compatibility
 */
export const UPDATE_COACH = graphql(`
  mutation UpdateCoach($id: ID!, $updateCoachInput: UpdateUserInput!) {
    updateCoach(id: $id, updateCoachInput: $updateCoachInput) {
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

// =================================
// SUBSCRIPTION SUPPORT
// =================================

/**
 * Subscribe to user updates
 */
export const USER_UPDATED_SUBSCRIPTION = graphql(`
  subscription UserUpdated {
    userUpdated {
      id
      firstName
      lastName
      email
      isActive
      updatedAt
    }
  }
`);

/**
 * Subscribe to new user creations
 */
export const USER_CREATED_SUBSCRIPTION = graphql(`
  subscription UserCreated {
    userCreated {
      id
      firstName
      lastName
      email
      isActive
      createdAt
    }
  }
`);

// =================================
// TYPE EXPORTS FOR CONVENIENCE
// =================================

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: Date;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  teams?: Team[];
  teamPlayers?: TeamPlayer[];
  teamCoaches?: TeamCoach[];
};

export type Team = {
  id: string;
  name: string;
  shortName?: string;
};

export type TeamPlayer = {
  id: string;
  jerseyNumber?: string;
  primaryPosition?: string;
  joinedDate?: Date;
  leftDate?: Date;
  isActive: boolean;
  team: Team;
};

export type TeamCoach = {
  id: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  team: Team;
};

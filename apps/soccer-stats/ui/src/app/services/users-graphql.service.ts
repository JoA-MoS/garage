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
      teamMemberships {
        id
        isActive
        joinedDate
        leftDate
        team {
          id
          name
          shortName
        }
        roles {
          id
          role
          jerseyNumber
          primaryPosition
          coachTitle
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
      teamMemberships {
        id
        isActive
        joinedDate
        team {
          id
        }
        roles {
          id
          role
          jerseyNumber
          primaryPosition
          coachTitle
        }
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
      teamMemberships {
        id
        team {
          id
          name
        }
        roles {
          role
          primaryPosition
          coachTitle
        }
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
      teamMemberships {
        id
        isActive
        joinedDate
        leftDate
        team {
          id
          name
          shortName
        }
        roles {
          id
          role
          jerseyNumber
          primaryPosition
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
      teamMemberships {
        id
        isActive
        joinedDate
        roles {
          id
          role
          jerseyNumber
          primaryPosition
        }
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
      teamMemberships {
        id
        roles {
          id
          role
          jerseyNumber
        }
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
      teamMemberships {
        team {
          name
        }
        roles {
          role
          primaryPosition
          jerseyNumber
        }
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
      teamMemberships {
        id
        isActive
        joinedDate
        leftDate
        team {
          id
          name
          shortName
        }
        roles {
          id
          role
          coachTitle
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
      teamMemberships {
        id
        isActive
        joinedDate
        roles {
          id
          role
          coachTitle
        }
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
      teamMemberships {
        id
        joinedDate
        team {
          name
        }
        roles {
          role
          coachTitle
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
      teamMemberships {
        team {
          name
        }
        roles {
          role
          coachTitle
        }
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
      teamMemberships {
        id
        isActive
        joinedDate
        leftDate
        team {
          id
          name
          shortName
        }
        roles {
          id
          role
          jerseyNumber
          primaryPosition
          coachTitle
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
 * Note: Uses the new addPlayerToTeam mutation with input object
 */
export const ADD_PLAYER_TO_TEAM = graphql(`
  mutation AddPlayerToTeam($addPlayerToTeamInput: AddPlayerToTeamInput!) {
    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {
      id
      name
      teamMembers {
        id
        user {
          id
          firstName
          lastName
        }
        roles {
          role
          jerseyNumber
          primaryPosition
        }
      }
    }
  }
`);

/**
 * Remove player from team
 */
export const REMOVE_PLAYER_FROM_TEAM = graphql(`
  mutation RemovePlayerFromTeam($teamId: ID!, $playerId: ID!) {
    removePlayerFromTeam(teamId: $teamId, playerId: $playerId) {
      id
      name
    }
  }
`);

/**
 * Add user to team as coach
 * Returns the TeamMember record
 */
export const ADD_COACH_TO_TEAM = graphql(`
  mutation AddCoachToTeam($userId: ID!, $teamId: ID!, $coachTitle: String!) {
    addCoachToTeam(userId: $userId, teamId: $teamId, coachTitle: $coachTitle) {
      id
      teamId
      userId
      user {
        id
        firstName
        lastName
      }
      roles {
        id
        role
        coachTitle
      }
    }
  }
`);

/**
 * Remove coach from team
 * Returns true if successful
 */
export const REMOVE_COACH_FROM_TEAM = graphql(`
  mutation RemoveCoachFromTeam($userId: ID!, $teamId: ID!) {
    removeCoachFromTeam(userId: $userId, teamId: $teamId)
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
  teamMemberships?: TeamMembership[];
};

export type Team = {
  id: string;
  name: string;
  shortName?: string;
};

export type TeamMembership = {
  id: string;
  isActive: boolean;
  joinedDate?: Date;
  leftDate?: Date;
  team: Team;
  roles: TeamMemberRole[];
};

export type TeamMemberRole = {
  id: string;
  role: string;
  jerseyNumber?: string;
  primaryPosition?: string;
  coachTitle?: string;
};

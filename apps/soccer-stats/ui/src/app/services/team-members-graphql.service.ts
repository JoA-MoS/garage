import { graphql } from '../generated/gql';

// Query to get all team members
export const GET_TEAM_MEMBERS = graphql(/* GraphQL */ `
  query GetTeamMembers($teamId: ID!) {
    teamMembers(teamId: $teamId) {
      id
      role
      isGuest
      invitedAt
      acceptedAt
      user {
        id
        firstName
        lastName
        email
      }
      linkedPlayer {
        id
        firstName
        lastName
      }
    }
  }
`);

// Query to get current user's role in a team
export const GET_MY_ROLE_IN_TEAM = graphql(/* GraphQL */ `
  query GetMyRoleInTeam($teamId: ID!) {
    myRoleInTeam(teamId: $teamId) {
      id
      role
      isGuest
    }
  }
`);

// Mutation to transfer team ownership
export const TRANSFER_TEAM_OWNERSHIP = graphql(/* GraphQL */ `
  mutation TransferTeamOwnership($teamId: ID!, $newOwnerId: ID!) {
    transferTeamOwnership(teamId: $teamId, newOwnerId: $newOwnerId) {
      id
      role
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`);

// Mutation to add a team member
export const ADD_TEAM_MEMBER = graphql(/* GraphQL */ `
  mutation AddTeamMember(
    $teamId: ID!
    $userId: ID!
    $role: TeamRole!
    $linkedPlayerId: ID
    $isGuest: Boolean
  ) {
    addTeamMember(
      teamId: $teamId
      userId: $userId
      role: $role
      linkedPlayerId: $linkedPlayerId
      isGuest: $isGuest
    ) {
      id
      role
      isGuest
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`);

// Mutation to update a team member's role
export const UPDATE_TEAM_MEMBER_ROLE = graphql(/* GraphQL */ `
  mutation UpdateTeamMemberRole($membershipId: ID!, $newRole: TeamRole!) {
    updateTeamMemberRole(membershipId: $membershipId, newRole: $newRole) {
      id
      role
      user {
        id
        firstName
        lastName
      }
    }
  }
`);

// Mutation to remove a team member
export const REMOVE_TEAM_MEMBER = graphql(/* GraphQL */ `
  mutation RemoveTeamMember($membershipId: ID!) {
    removeTeamMember(membershipId: $membershipId)
  }
`);

// Mutation to promote a guest coach
export const PROMOTE_GUEST_COACH = graphql(/* GraphQL */ `
  mutation PromoteGuestCoach($membershipId: ID!) {
    promoteGuestCoach(membershipId: $membershipId) {
      id
      role
      isGuest
      user {
        id
        firstName
        lastName
      }
    }
  }
`);

import { graphql } from '@garage/soccer-stats/graphql-codegen';

/**
 * GraphQL queries for the `my` viewer pattern.
 *
 * The `my` query provides user-scoped data without needing to pass user IDs.
 * This follows patterns established by GitHub, Shopify, and Facebook.
 *
 * @see FEATURE_ROADMAP.md Issue #183
 */

/**
 * Main dashboard query - fetches all user-scoped data in a single request.
 * Use this for the dashboard to get teams, upcoming games, and recent games.
 */
export const GET_MY_DASHBOARD = graphql(/* GraphQL */ `
  query GetMyDashboard($upcomingLimit: Int, $recentLimit: Int) {
    my {
      user {
        id
        firstName
        lastName
        email
      }
      teams {
        id
        name
        shortName
        homePrimaryColor
        homeSecondaryColor
        isManaged
      }
      ownedTeams {
        id
        name
      }
      managedTeams {
        id
        name
      }
      upcomingGames(limit: $upcomingLimit) {
        id
        name
        scheduledStart
        status
        venue
        teams {
          id
          teamType
          team {
            id
            name
            shortName
            homePrimaryColor
          }
        }
      }
      recentGames(limit: $recentLimit) {
        id
        name
        status
        actualEnd
        teams {
          id
          teamType
          finalScore
          team {
            id
            name
            shortName
            homePrimaryColor
          }
        }
      }
      liveGames {
        id
        name
        status
        actualStart
        teams {
          id
          teamType
          finalScore
          team {
            id
            name
            shortName
            homePrimaryColor
          }
        }
      }
    }
  }
`);

/**
 * Lightweight query for just the user's teams (for navigation/team switcher)
 */
export const GET_MY_TEAMS_VIEWER = graphql(/* GraphQL */ `
  query GetMyTeamsViewer {
    my {
      teams {
        id
        name
        shortName
        homePrimaryColor
        homeSecondaryColor
        isManaged
      }
      ownedTeams {
        id
        name
      }
    }
  }
`);

/**
 * Query for live games only (for real-time updates)
 */
export const GET_MY_LIVE_GAMES = graphql(/* GraphQL */ `
  query GetMyLiveGames {
    my {
      liveGames {
        id
        name
        status
        actualStart
        pausedAt
        teams {
          id
          teamType
          finalScore
          team {
            id
            name
            shortName
            homePrimaryColor
          }
        }
      }
    }
  }
`);

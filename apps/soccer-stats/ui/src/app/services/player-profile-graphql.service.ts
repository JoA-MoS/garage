import {
  graphql,
  type GetPlayerCareerStatsQuery,
} from '@garage/soccer-stats/graphql-codegen';

// Re-export codegen types under stable names consumed by callers
export type GetPlayerCareerStatsResponse = GetPlayerCareerStatsQuery;
export type PlayerCareerStatsData =
  GetPlayerCareerStatsQuery['playerCareerStats'];
export type PlayerTeamStatsData =
  GetPlayerCareerStatsQuery['playerCareerStats']['teamStats'][number];
export type PlayerGameEntryData =
  GetPlayerCareerStatsQuery['playerCareerStats']['gameHistory'][number];

export const GET_PLAYER_CAREER_STATS = graphql(/* GraphQL */ `
  query GetPlayerCareerStats($playerId: ID!) {
    playerCareerStats(playerId: $playerId) {
      playerId
      playerName
      totalGamesPlayed
      totalGoals
      totalAssists
      totalUnassistedGoals
      totalPlayTimeSeconds
      teamStats {
        teamId
        teamName
        gamesPlayed
        goals
        assists
        unassistedGoals
        totalPlayTimeSeconds
      }
      gameHistory {
        gameId
        gameTeamId
        gameDate
        teamId
        teamName
        opponentName
        teamScore
        opponentScore
        result
        goals
        assists
        unassistedGoals
        totalPlayTimeSeconds
      }
    }
  }
`);

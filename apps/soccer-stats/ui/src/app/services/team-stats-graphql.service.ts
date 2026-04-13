import {
  graphql,
  type GetTeamStatsQuery,
  type GetGameTeamStatsQuery,
} from '@garage/soccer-stats/graphql-codegen';

// Re-export codegen types under stable names consumed by callers
export type GetTeamStatsResponse = GetTeamStatsQuery;
export type GetGameTeamStatsResponse = GetGameTeamStatsQuery;
export type TeamStatsResponseData = GetTeamStatsQuery['teamStats'];
export type PlayerGameStatsRowData =
  GetTeamStatsQuery['teamStats']['playerStats'][number];
export type GameStatsSummaryData =
  GetTeamStatsQuery['teamStats']['gameBreakdown'][number];
export type TeamAggregateStatsData =
  GetTeamStatsQuery['teamStats']['aggregateStats'];

export const GET_TEAM_STATS = graphql(/* GraphQL */ `
  query GetTeamStats($input: TeamStatsInput!) {
    teamStats(input: $input) {
      teamId
      teamName
      aggregateStats {
        gamesPlayed
        wins
        draws
        losses
        winRate
        goalsFor
        goalsAgainst
        goalDifference
        totalAssists
        topScoringSquad
        topScoringSquadGoalsFor
        topDefensiveSquad
        topDefensiveSquadGoalsAgainst
        topScoringSquads {
          squad
          goalsFor
          goalsAgainst
        }
        topDefensiveSquads {
          squad
          goalsFor
          goalsAgainst
        }
        topComboPlayers {
          player1
          player2
          goals
        }
      }
      playerStats {
        playerId
        playerName
        externalPlayerName
        externalPlayerNumber
        goals
        unassistedGoals
        assists
        ownGoals
        totalMinutes
        totalSeconds
        totalPlayTimeSeconds
        gamesPlayed
      }
      gameBreakdown {
        gameId
        gameTeamId
        gameName
        gameDate
        gameStatus
        opponentName
        teamScore
        opponentScore
        result
        totalGoals
        totalAssists
        playerStats {
          playerId
          playerName
          externalPlayerName
          externalPlayerNumber
          goals
          unassistedGoals
          assists
          ownGoals
          totalMinutes
          totalSeconds
          totalPlayTimeSeconds
          gamesPlayed
        }
      }
    }
  }
`);

export const GET_GAME_TEAM_STATS = graphql(/* GraphQL */ `
  query GetGameTeamStats($gameTeamId: ID!) {
    gameTeamStats(gameTeamId: $gameTeamId) {
      gameId
      gameTeamId
      gameName
      gameDate
      gameStatus
      opponentName
      teamScore
      opponentScore
      result
      totalGoals
      totalAssists
      playerStats {
        playerId
        playerName
        externalPlayerName
        externalPlayerNumber
        goals
        unassistedGoals
        assists
        ownGoals
        totalMinutes
        totalSeconds
        totalPlayTimeSeconds
        gamesPlayed
      }
    }
  }
`);

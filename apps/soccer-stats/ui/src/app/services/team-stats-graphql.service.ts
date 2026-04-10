import { gql } from '@apollo/client';

// Response types for team stats queries
// These will be replaced by codegen types once the schema is regenerated

export interface PlayerGameStatsRowData {
  playerId?: string | null;
  playerName?: string | null;
  externalPlayerName?: string | null;
  externalPlayerNumber?: string | null;
  goals: number;
  unassistedGoals: number;
  assists: number;
  ownGoals: number;
  totalMinutes: number;
  totalSeconds: number;
  totalPlayTimeSeconds: number;
  gamesPlayed: number;
}

export interface TeamAggregateStatsData {
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  totalAssists: number;
  topScoringSquad?: string | null;
  topScoringSquadGoalsFor: number;
  topDefensiveSquad?: string | null;
  topDefensiveSquadGoalsAgainst: number;
  topScoringSquads: OnFieldSquadMetricData[];
  topDefensiveSquads: OnFieldSquadMetricData[];
  topComboPlayers: PlayerComboMetricData[];
}

export interface PlayerComboMetricData {
  player1: string;
  player2: string;
  goals: number;
}

export interface OnFieldSquadMetricData {
  squad: string;
  goalsFor: number;
  goalsAgainst: number;
}

export interface GameStatsSummaryData {
  gameId: string;
  gameTeamId: string;
  gameName?: string | null;
  gameDate?: string | null;
  gameStatus: string;
  opponentName?: string | null;
  teamScore?: number | null;
  opponentScore?: number | null;
  result: string;
  totalGoals: number;
  totalAssists: number;
  playerStats: PlayerGameStatsRowData[];
}

export interface TeamStatsResponseData {
  teamId: string;
  teamName: string;
  aggregateStats: TeamAggregateStatsData;
  playerStats: PlayerGameStatsRowData[];
  gameBreakdown: GameStatsSummaryData[];
}

export interface GetTeamStatsResponse {
  teamStats: TeamStatsResponseData;
}

export interface GetGameTeamStatsResponse {
  gameTeamStats: GameStatsSummaryData;
}

export const GET_TEAM_STATS = gql`
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
`;

export const GET_GAME_TEAM_STATS = gql`
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
`;

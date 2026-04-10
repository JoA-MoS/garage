import { gql } from '@apollo/client';

export interface PlayerGameEntryData {
  gameId: string;
  gameTeamId: string;
  gameDate?: string | null;
  teamId: string;
  teamName: string;
  opponentName?: string | null;
  teamScore?: number | null;
  opponentScore?: number | null;
  result: string;
  goals: number;
  assists: number;
  unassistedGoals: number;
  totalPlayTimeSeconds: number;
}

export interface PlayerTeamStatsData {
  teamId: string;
  teamName: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  unassistedGoals: number;
  totalPlayTimeSeconds: number;
}

export interface PlayerCareerStatsData {
  playerId: string;
  playerName: string;
  totalGamesPlayed: number;
  totalGoals: number;
  totalAssists: number;
  totalUnassistedGoals: number;
  totalPlayTimeSeconds: number;
  teamStats: PlayerTeamStatsData[];
  gameHistory: PlayerGameEntryData[];
}

export interface GetPlayerCareerStatsResponse {
  playerCareerStats: PlayerCareerStatsData;
}

export const GET_PLAYER_CAREER_STATS = gql`
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
`;

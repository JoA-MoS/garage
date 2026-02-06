/**
 * Soccer Stats Data Model - Entity Relationships
 *
 * This models the real-world relationships in soccer statistics tracking
 */

// CORE ENTITIES

export interface Season {
  id: string;
  name: string; // "2024 Spring Season"
  startDate: string;
  endDate: string;
  games: Game[];
}

export interface Team {
  id: string;
  name: string;
  seasonId: string;

  // Relationships
  players: Player[];
  homeGames: Game[]; // Games where this team is home
  awayGames: Game[]; // Games where this team is away

  // Computed properties (not stored, calculated from games)
  totalGoals?: number;
  totalGoalsAgainst?: number;
  wins?: number;
  losses?: number;
  draws?: number;
}

export interface Player {
  id: string;
  name: string;
  jersey: number;
  position: string;
  teamId: string;

  // Relationships
  team: Team;
  gameParticipations: GameParticipation[];
  goalScores: Goal[]; // Goals scored by this player
  assists: Goal[]; // Goals assisted by this player

  // Season stats (computed from game participations)
  totalGoals?: number;
  totalAssists?: number;
  totalPlayTime?: number;
  gamesPlayed?: number;
}

export interface Game {
  id: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  gameDate: string;
  status: GameStatus;

  // Game timing
  startTime?: string;
  endTime?: string;
  currentMinute: number;

  // Relationships
  season: Season;
  homeTeam: Team;
  awayTeam: Team;
  goals: Goal[];
  participations: GameParticipation[];
  substitutions: Substitution[];

  // Computed scores
  homeScore?: number; // Count of goals where scoringTeam = homeTeam
  awayScore?: number; // Count of goals where scoringTeam = awayTeam
}

// STATS/EVENTS ENTITIES

export interface Goal {
  id: string;
  gameId: string;
  scoringTeamId: string; // Which team scored
  scorerId: string; // Player who scored
  assistId?: string; // Player who assisted (optional)
  timestamp: string; // Real-world timestamp

  // Relationships
  game: Game;
  scoringTeam: Team;
  scorer: Player;
  assist?: Player;
}

export interface GameParticipation {
  id: string;
  gameId: string;
  playerId: string;
  teamId: string;

  // Playing time tracking
  startedOnField: boolean;
  minutesPlayed: number;

  // Relationships
  game: Game;
  player: Player;
  team: Team;
  substitutionsOut: Substitution[]; // When this player was subbed out
  substitutionsIn: Substitution[]; // When this player was subbed in
}

export interface Substitution {
  id: string;
  gameId: string;
  teamId: string;
  playerOutId: string;
  playerInId: string;
  timestamp: string;

  // Relationships
  game: Game;
  team: Team;
  playerOut: Player;
  playerIn: Player;
}

export enum GameStatus {
  SCHEDULED = 'scheduled',
  FIRST_HALF = 'first_half',
  HALF_TIME = 'half_time',
  SECOND_HALF = 'second_half',
  FULL_TIME = 'full_time',
  CANCELLED = 'cancelled',
}

// RELATIONSHIP SUMMARY:
//
// Season 1:M Games
// Team 1:M Games (as home team)
// Team 1:M Games (as away team)
// Team 1:M Players
// Game 1:M Goals
// Game 1:M GameParticipations
// Game 1:M Substitutions
// Player 1:M Goals (as scorer)
// Player 1:M Goals (as assist)
// Player 1:M GameParticipations
// Goal M:1 Game
// Goal M:1 Player (scorer)
// Goal M:1 Player (assist, optional)
// Goal M:1 Team (scoring team)

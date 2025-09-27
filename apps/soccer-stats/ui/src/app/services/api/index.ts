// Export all API services
export { TeamsApiService } from './teams-api.service';
// export { PlayersApiService } from './players-api.service'; // Temporarily disabled
export { GamesApiService, GameStatus, GameFormat } from './games-api.service';

// Re-export common types from GraphQL services
export type {
  // Teams
  Team,
  TeamWithGames,
  CreateTeamInput,
  UpdateTeamInput,
  AddPlayerToTeamInput,
} from '../teams-graphql.service';

// export type {
//   // Players
//   Player,
//   CreatePlayerInput,
// } from '../players-graphql.service';

export type {
  // Games
  Game,
  GameTeam,
  // GameEvent,
  // GameParticipation,
  CreateGameInput,
  UpdateGameInput,
  // RecordGoalInput,
} from '../games-graphql.service';

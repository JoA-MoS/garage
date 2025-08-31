// /**
//  * Play Time Tracking Service
//  *
//  * Comprehensive service for tracking player minutes in games
//  */

// import {
//   GameParticipationEntity,
//   SubstitutionEntity,
//   GameEntity,
// } from '../types/database-entities';

// export interface PlayTimeStats {
//   playerId: string;
//   gameId: string;
//   startedOnField: boolean;
//   minutesPlayed: number;
//   substitutionIn?: {
//     minute: number;
//     replacedPlayer: string;
//   };
//   substitutionOut?: {
//     minute: number;
//     replacementPlayer: string;
//   };
//   wasSubstituted: boolean;
// }

// export interface PlayerSeasonPlayTime {
//   playerId: string;
//   seasonId: string;
//   totalMinutes: number;
//   gamesPlayed: number;
//   gamesStarted: number;
//   averageMinutes: number;
//   percentageOfPossibleMinutes: number; // Out of total team minutes
//   substitutionsIn: number;
//   substitutionsOut: number;
// }

// export class PlayTimeTrackingService {
//   /**
//    * Track play time for a player in a specific game
//    */
//   static async trackPlayerGameTime(
//     playerId: string,
//     gameId: string,
//     startedOnField = false
//   ): Promise<GameParticipationEntity> {
//     // Create or update game participation record
//     const participation = await GameParticipationEntity.findOne({
//       where: { playerId, gameId },
//     });

//     if (participation) {
//       // Update existing record
//       participation.startedOnField = startedOnField;
//       return await participation.save();
//     } else {
//       // Create new participation record
//       return await GameParticipationEntity.create({
//         playerId,
//         gameId,
//         teamId: await this.getPlayerTeamId(playerId),
//         startedOnField,
//         minutesPlayed: startedOnField ? 0 : 0, // Will be calculated based on game time
//       }).save();
//     }
//   }

//   /**
//    * Update minutes played when game progresses or ends
//    */
//   static async updatePlayerMinutes(
//     gameId: string,
//     currentGameMinute: number
//   ): Promise<void> {
//     const participations = await GameParticipationEntity.find({
//       where: { gameId },
//       relations: ['player'],
//     });

//     const substitutions = await SubstitutionEntity.find({
//       where: { gameId },
//       order: { gameMinute: 'ASC' },
//     });

//     for (const participation of participations) {
//       const playTime = this.calculatePlayerMinutes(
//         participation,
//         substitutions,
//         currentGameMinute
//       );

//       participation.minutesPlayed = playTime;
//       await participation.save();
//     }
//   }

//   /**
//    * Calculate how many minutes a player has played in a game
//    */
//   private static calculatePlayerMinutes(
//     participation: GameParticipationEntity,
//     substitutions: SubstitutionEntity[],
//     currentGameMinute: number
//   ): number {
//     let minutesPlayed = 0;
//     let onField = participation.startedOnField;
//     let lastChangeMinute = 0;

//     // Process all substitutions chronologically
//     for (const sub of substitutions) {
//       if (sub.playerInId === participation.playerId) {
//         // Player came on field
//         if (!onField) {
//           onField = true;
//           lastChangeMinute = sub.gameMinute;
//         }
//       } else if (sub.playerOutId === participation.playerId) {
//         // Player left field
//         if (onField) {
//           minutesPlayed += sub.gameMinute - lastChangeMinute;
//           onField = false;
//         }
//       }
//     }

//     // If player is still on field, add time from last change to current time
//     if (onField) {
//       minutesPlayed += currentGameMinute - lastChangeMinute;
//     }

//     return minutesPlayed;
//   }

//   /**
//    * Handle substitution and update play times
//    */
//   static async recordSubstitution(
//     gameId: string,
//     playerOutId: string,
//     playerInId: string,
//     gameMinute: number
//   ): Promise<SubstitutionEntity> {
//     // Create substitution record
//     const substitution = await SubstitutionEntity.create({
//       gameId,
//       teamId: await this.getPlayerTeamId(playerOutId),
//       playerOutId,
//       playerInId,
//       gameMinute,
//     }).save();

//     // Update play times for both players
//     await this.updateSinglePlayerMinutes(playerOutId, gameId, gameMinute);
//     await this.updateSinglePlayerMinutes(playerInId, gameId, gameMinute);

//     // Ensure both players have participation records
//     await this.trackPlayerGameTime(playerInId, gameId, false);

//     return substitution;
//   }

//   /**
//    * Get detailed play time stats for a player in a specific game
//    */
//   static async getPlayerGamePlayTime(
//     playerId: string,
//     gameId: string
//   ): Promise<PlayTimeStats | null> {
//     const participation = await GameParticipationEntity.findOne({
//       where: { playerId, gameId },
//       relations: ['game'],
//     });

//     if (!participation) return null;

//     const substitutions = await SubstitutionEntity.find({
//       where: { gameId },
//       relations: ['playerOut', 'playerIn'],
//     });

//     const subIn = substitutions.find((s) => s.playerInId === playerId);
//     const subOut = substitutions.find((s) => s.playerOutId === playerId);

//     return {
//       playerId,
//       gameId,
//       startedOnField: participation.startedOnField,
//       minutesPlayed: participation.minutesPlayed,
//       substitutionIn: subIn
//         ? {
//             minute: subIn.gameMinute,
//             replacedPlayer: subIn.playerOutId,
//           }
//         : undefined,
//       substitutionOut: subOut
//         ? {
//             minute: subOut.gameMinute,
//             replacementPlayer: subOut.playerInId,
//           }
//         : undefined,
//       wasSubstituted: !!subOut,
//     };
//   }

//   /**
//    * Get season play time stats for a player
//    */
//   static async getPlayerSeasonPlayTime(
//     playerId: string,
//     seasonId: string
//   ): Promise<PlayerSeasonPlayTime> {
//     const participations = await GameParticipationEntity.find({
//       where: { playerId },
//       relations: ['game'],
//     });

//     // Filter for specific season
//     const seasonParticipations = participations.filter(
//       (p) => p.game.seasonId === seasonId
//     );

//     const totalMinutes = seasonParticipations.reduce(
//       (sum, p) => sum + p.minutesPlayed,
//       0
//     );
//     const gamesPlayed = seasonParticipations.length;
//     const gamesStarted = seasonParticipations.filter(
//       (p) => p.startedOnField
//     ).length;

//     // Get substitution counts
//     const substitutions = await SubstitutionEntity.find({
//       relations: ['game'],
//     });

//     const seasonSubs = substitutions.filter(
//       (s) => s.game.seasonId === seasonId
//     );
//     const substitutionsIn = seasonSubs.filter(
//       (s) => s.playerInId === playerId
//     ).length;
//     const substitutionsOut = seasonSubs.filter(
//       (s) => s.playerOutId === playerId
//     ).length;

//     // Calculate possible minutes (assuming 90 minutes per game)
//     const possibleMinutes = gamesPlayed * 90;
//     const percentageOfPossibleMinutes =
//       possibleMinutes > 0 ? (totalMinutes / possibleMinutes) * 100 : 0;

//     return {
//       playerId,
//       seasonId,
//       totalMinutes,
//       gamesPlayed,
//       gamesStarted,
//       averageMinutes: gamesPlayed > 0 ? totalMinutes / gamesPlayed : 0,
//       percentageOfPossibleMinutes,
//       substitutionsIn,
//       substitutionsOut,
//     };
//   }

//   /**
//    * Get team play time distribution for a game
//    */
//   static async getTeamPlayTimeDistribution(teamId: string, gameId: string) {
//     const participations = await GameParticipationEntity.find({
//       where: { teamId, gameId },
//       relations: ['player'],
//       order: { minutesPlayed: 'DESC' },
//     });

//     return participations.map((p) => ({
//       playerId: p.playerId,
//       playerName: p.player.name,
//       jersey: p.player.jersey,
//       position: p.player.position,
//       minutesPlayed: p.minutesPlayed,
//       startedOnField: p.startedOnField,
//       percentageOfGame: (p.minutesPlayed / 90) * 100, // Assuming 90 min game
//     }));
//   }

//   /**
//    * Get players who played most/least minutes in a season
//    */
//   static async getPlayTimeLeaders(seasonId: string, teamId?: string) {
//     // This would be a complex query to get players ranked by total minutes
//     const query = GameParticipationEntity.createQueryBuilder('participation')
//       .leftJoinAndSelect('participation.player', 'player')
//       .leftJoinAndSelect('participation.game', 'game')
//       .where('game.seasonId = :seasonId', { seasonId })
//       .groupBy('participation.playerId, player.id')
//       .orderBy('SUM(participation.minutesPlayed)', 'DESC');

//     if (teamId) {
//       query.andWhere('participation.teamId = :teamId', { teamId });
//     }

//     query.select([
//       'player.id',
//       'player.name',
//       'player.jersey',
//       'player.position',
//       'SUM(participation.minutesPlayed) as totalMinutes',
//       'COUNT(participation.id) as gamesPlayed',
//       'AVG(participation.minutesPlayed) as averageMinutes',
//     ]);

//     return await query.getRawMany();
//   }

//   // Helper methods
//   private static async getPlayerTeamId(playerId: string): Promise<string> {
//     // Query to get player's team ID
//     return 'team-id'; // Placeholder
//   }

//   private static async updateSinglePlayerMinutes(
//     playerId: string,
//     gameId: string,
//     currentMinute: number
//   ): Promise<void> {
//     // Update minutes for a single player
//     // Implementation would calculate based on substitutions
//   }
// }

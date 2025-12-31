import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { Game, GameStatus } from '../../entities/game.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { GameTeam } from '../../entities/game-team.entity';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>
  ) {}

  /**
   * Find a user by their email address (for converting Clerk user to internal user)
   */
  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { email },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find user by email: ${email}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * Get a user by internal ID
   */
  async findUserById(userId: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { id: userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find user by ID: ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * Get all teams the user is a member of (any role)
   */
  async findTeamsByUserId(userId: string): Promise<Team[]> {
    try {
      const memberships = await this.teamMemberRepository.find({
        where: { userId },
        relations: ['team'],
      });

      return memberships
        .filter((m) => m.team)
        .map((m) => m.team)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.logger.error(
        `Failed to find teams for user: ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * Get teams where the user is OWNER
   */
  async findOwnedTeamsByUserId(userId: string): Promise<Team[]> {
    try {
      const memberships = await this.teamMemberRepository.find({
        where: { userId, role: TeamRole.OWNER },
        relations: ['team'],
      });

      return memberships
        .filter((m) => m.team)
        .map((m) => m.team)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.logger.error(
        `Failed to find owned teams for user: ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * Get teams where the user is OWNER or MANAGER
   */
  async findManagedTeamsByUserId(userId: string): Promise<Team[]> {
    try {
      const memberships = await this.teamMemberRepository.find({
        where: [
          { userId, role: TeamRole.OWNER },
          { userId, role: TeamRole.MANAGER },
        ],
        relations: ['team'],
      });

      return memberships
        .filter((m) => m.team)
        .map((m) => m.team)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.logger.error(
        `Failed to find managed teams for user: ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * Get team IDs for a user (used for game queries)
   */
  private async getTeamIdsForUser(userId: string): Promise<string[]> {
    try {
      const memberships = await this.teamMemberRepository.find({
        where: { userId },
        select: ['teamId'],
      });

      return memberships.map((m) => m.teamId);
    } catch (error) {
      this.logger.error(
        `Failed to get team IDs for user: ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * Get upcoming games across all of user's teams.
   * Returns games with status SCHEDULED, ordered by scheduledStart.
   */
  async findUpcomingGamesByUserId(
    userId: string,
    limit?: number
  ): Promise<Game[]> {
    try {
      const teamIds = await this.getTeamIdsForUser(userId);

      if (teamIds.length === 0) {
        return [];
      }

      // Find game IDs that involve any of the user's teams
      const gameTeams = await this.gameTeamRepository.find({
        where: { teamId: In(teamIds) },
        select: ['gameId'],
      });

      const gameIds = [...new Set(gameTeams.map((gt) => gt.gameId))];

      if (gameIds.length === 0) {
        return [];
      }

      // Query games with SCHEDULED status, ordered by scheduledStart
      const queryBuilder = this.gameRepository
        .createQueryBuilder('game')
        .leftJoinAndSelect('game.gameFormat', 'gameFormat')
        .leftJoinAndSelect('game.gameTeams', 'gameTeams')
        .leftJoinAndSelect('gameTeams.team', 'team')
        .where('game.id IN (:...gameIds)', { gameIds })
        .andWhere('game.status = :status', { status: GameStatus.SCHEDULED })
        .orderBy('game.scheduledStart', 'ASC', 'NULLS LAST')
        .addOrderBy('game.createdAt', 'DESC');

      if (limit) {
        queryBuilder.take(limit);
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(
        `Failed to find upcoming games for user: ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * Get recently completed games across all of user's teams.
   * Returns games with status COMPLETED, ordered by actualEnd (most recent first).
   */
  async findRecentGamesByUserId(
    userId: string,
    limit?: number
  ): Promise<Game[]> {
    try {
      const teamIds = await this.getTeamIdsForUser(userId);

      if (teamIds.length === 0) {
        return [];
      }

      // Find game IDs that involve any of the user's teams
      const gameTeams = await this.gameTeamRepository.find({
        where: { teamId: In(teamIds) },
        select: ['gameId'],
      });

      const gameIds = [...new Set(gameTeams.map((gt) => gt.gameId))];

      if (gameIds.length === 0) {
        return [];
      }

      // Query games with COMPLETED status, ordered by actualEnd (most recent first)
      const queryBuilder = this.gameRepository
        .createQueryBuilder('game')
        .leftJoinAndSelect('game.gameFormat', 'gameFormat')
        .leftJoinAndSelect('game.gameTeams', 'gameTeams')
        .leftJoinAndSelect('gameTeams.team', 'team')
        .where('game.id IN (:...gameIds)', { gameIds })
        .andWhere('game.status = :status', { status: GameStatus.COMPLETED })
        .orderBy('game.actualEnd', 'DESC', 'NULLS LAST')
        .addOrderBy('game.createdAt', 'DESC');

      if (limit) {
        queryBuilder.take(limit);
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(
        `Failed to find recent games for user: ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * Get games currently in progress across all of user's teams.
   * Returns games with status FIRST_HALF, HALFTIME, SECOND_HALF, or IN_PROGRESS.
   */
  async findLiveGamesByUserId(userId: string): Promise<Game[]> {
    try {
      const teamIds = await this.getTeamIdsForUser(userId);

      if (teamIds.length === 0) {
        return [];
      }

      // Find game IDs that involve any of the user's teams
      const gameTeams = await this.gameTeamRepository.find({
        where: { teamId: In(teamIds) },
        select: ['gameId'],
      });

      const gameIds = [...new Set(gameTeams.map((gt) => gt.gameId))];

      if (gameIds.length === 0) {
        return [];
      }

      // Query games with in-progress statuses
      return await this.gameRepository
        .createQueryBuilder('game')
        .leftJoinAndSelect('game.gameFormat', 'gameFormat')
        .leftJoinAndSelect('game.gameTeams', 'gameTeams')
        .leftJoinAndSelect('gameTeams.team', 'team')
        .where('game.id IN (:...gameIds)', { gameIds })
        .andWhere('game.status IN (:...statuses)', {
          statuses: [
            GameStatus.FIRST_HALF,
            GameStatus.HALFTIME,
            GameStatus.SECOND_HALF,
            GameStatus.IN_PROGRESS,
          ],
        })
        .orderBy('game.actualStart', 'DESC', 'NULLS LAST')
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to find live games for user: ${userId}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }
}

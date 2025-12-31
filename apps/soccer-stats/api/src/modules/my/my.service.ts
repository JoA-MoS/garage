import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { Game, GameStatus } from '../../entities/game.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { GameTeam } from '../../entities/game-team.entity';

@Injectable()
export class MyService {
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
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Get a user by internal ID
   */
  async findUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }

  /**
   * Get all teams the user is a member of (any role)
   */
  async findTeamsByUserId(userId: string): Promise<Team[]> {
    const memberships = await this.teamMemberRepository.find({
      where: { userId },
      relations: ['team'],
    });

    return memberships
      .filter((m) => m.team)
      .map((m) => m.team)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get teams where the user is OWNER
   */
  async findOwnedTeamsByUserId(userId: string): Promise<Team[]> {
    const memberships = await this.teamMemberRepository.find({
      where: { userId, role: TeamRole.OWNER },
      relations: ['team'],
    });

    return memberships
      .filter((m) => m.team)
      .map((m) => m.team)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get teams where the user is OWNER or MANAGER
   */
  async findManagedTeamsByUserId(userId: string): Promise<Team[]> {
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
  }

  /**
   * Get team IDs for a user (used for game queries)
   */
  private async getTeamIdsForUser(userId: string): Promise<string[]> {
    const memberships = await this.teamMemberRepository.find({
      where: { userId },
      select: ['teamId'],
    });

    return memberships.map((m) => m.teamId);
  }

  /**
   * Get upcoming games across all of user's teams.
   * Returns games with status SCHEDULED, ordered by scheduledStart.
   */
  async findUpcomingGamesByUserId(
    userId: string,
    limit?: number
  ): Promise<Game[]> {
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

    return queryBuilder.getMany();
  }

  /**
   * Get recently completed games across all of user's teams.
   * Returns games with status COMPLETED, ordered by actualEnd (most recent first).
   */
  async findRecentGamesByUserId(
    userId: string,
    limit?: number
  ): Promise<Game[]> {
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

    return queryBuilder.getMany();
  }

  /**
   * Get games currently in progress across all of user's teams.
   * Returns games with status FIRST_HALF, HALFTIME, SECOND_HALF, or IN_PROGRESS.
   */
  async findLiveGamesByUserId(userId: string): Promise<Game[]> {
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
    return this.gameRepository
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
  }
}

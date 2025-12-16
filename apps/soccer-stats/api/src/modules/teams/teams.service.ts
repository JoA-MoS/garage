import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Team, SourceType } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { TeamRole } from '../../entities/team-member.entity';
import { TeamMembersService } from '../team-members/team-members.service';

import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { AddPlayerToTeamInput } from './dto/add-player-to-team.input';
import { TeamPlayerWithJersey } from './dto/team-player-with-jersey.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamPlayer)
    private readonly teamPlayerRepository: Repository<TeamPlayer>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>,
    @Inject(forwardRef(() => TeamMembersService))
    private readonly teamMembersService: TeamMembersService
  ) {}

  async findAll(): Promise<Team[]> {
    return this.teamRepository.find();
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID "${id}" not found`);
    }

    return team;
  }

  async create(
    createTeamInput: CreateTeamInput,
    createdById?: string,
    internalUserId?: string
  ): Promise<Team> {
    const team = this.teamRepository.create({
      ...createTeamInput,
      createdById,
    });
    const savedTeam = await this.teamRepository.save(team);

    // Create TeamMember with OWNER role for the creator
    if (internalUserId) {
      await this.teamMembersService.addMember(
        savedTeam.id,
        internalUserId,
        TeamRole.OWNER
      );
    }

    return savedTeam;
  }

  async update(id: string, updateTeamInput: UpdateTeamInput): Promise<Team> {
    const team = await this.findOne(id);
    Object.assign(team, updateTeamInput);
    return this.teamRepository.save(team);
  }

  async remove(id: string): Promise<boolean> {
    const team = await this.findOne(id);
    await this.teamRepository.remove(team);
    return true;
  }

  async findByName(name: string): Promise<Team[]> {
    return this.teamRepository.find({
      where: { name },
    });
  }

  async findByPlayerId(playerId: string): Promise<Team[]> {
    return this.teamRepository.find({
      relations: ['teamPlayers'],
      where: {
        teamPlayers: {
          user: { id: playerId },
          isActive: true,
        },
      },
    });
  }

  async findByCoachId(coachId: string): Promise<Team[]> {
    return this.teamRepository.find({
      relations: ['teamCoaches'],
      where: {
        teamCoaches: {
          user: { id: coachId },
          isActive: true,
        },
      },
    });
  }

  /**
   * Find all teams that a user has access to:
   * - Teams they created (owner)
   *
   * Note: Player/coach membership queries are not yet implemented because
   * they require looking up the internal User ID from the Clerk external ID.
   * For MVP, team ownership via createdById is sufficient.
   */
  async findMyTeams(clerkUserId: string): Promise<Team[]> {
    // For MVP: Query only by createdById (Clerk user ID)
    // Future: Also include teams where user is a player or coach
    // (requires looking up internal User.id from User.externalId first)
    return this.teamRepository.find({
      where: { createdById: clerkUserId },
      order: { name: 'ASC' },
    });
  }

  /**
   * Check if a user has access to a specific team
   */
  async userHasTeamAccess(userId: string, teamId: string): Promise<boolean> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
    });

    if (!team) {
      return false;
    }

    // Check if user is the creator
    if (team.createdById === userId) {
      return true;
    }

    // Check if user is an active player
    const playerMembership = await this.teamPlayerRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: userId },
        isActive: true,
      },
    });

    if (playerMembership) {
      return true;
    }

    // Check if user is an active coach
    // Note: We need to import TeamCoach repository for this
    // For now, use query builder
    const coachCount = await this.teamRepository
      .createQueryBuilder('team')
      .leftJoin('team.teamCoaches', 'teamCoach')
      .leftJoin('teamCoach.user', 'coachUser')
      .where('team.id = :teamId', { teamId })
      .andWhere('coachUser.id = :userId', { userId })
      .andWhere('teamCoach.isActive = true')
      .getCount();

    return coachCount > 0;
  }

  async getPlayersForTeam(teamId: string): Promise<User[]> {
    const teamPlayers = await this.teamPlayerRepository.find({
      where: {
        team: { id: teamId },
        isActive: true,
      },
      relations: ['user'],
    });

    return teamPlayers
      .filter(
        (teamPlayer) =>
          teamPlayer.user !== null && teamPlayer.user !== undefined
      )
      .map((teamPlayer) => teamPlayer.user as User);
  }

  // ResolveField methods

  async getTeamPlayers(teamId: string): Promise<TeamPlayer[]> {
    return this.teamPlayerRepository.find({
      where: { team: { id: teamId } },
      relations: ['user', 'team'],
    });
  }

  async getGameTeams(teamId: string): Promise<GameTeam[]> {
    return this.gameTeamRepository.find({
      where: { team: { id: teamId } },
      relations: ['game'],
    });
  }

  async addPlayerToTeam(
    addPlayerToTeamInput: AddPlayerToTeamInput
  ): Promise<Team> {
    // Verify team exists
    const team = await this.findOne(addPlayerToTeamInput.teamId);

    // Check if player already exists in this team
    const existing = await this.teamPlayerRepository.findOne({
      where: {
        team: { id: addPlayerToTeamInput.teamId },
        user: { id: addPlayerToTeamInput.playerId },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Player is already associated with this team`
      );
    }

    // Check if jersey number is already taken
    const jerseyTaken = await this.teamPlayerRepository.findOne({
      where: {
        team: { id: addPlayerToTeamInput.teamId },
        jerseyNumber: addPlayerToTeamInput.jersey.toString(),
      },
    });

    if (jerseyTaken) {
      throw new ConflictException(
        `Jersey number ${addPlayerToTeamInput.jersey} is already taken`
      );
    }

    const teamPlayer = this.teamPlayerRepository.create({
      teamId: addPlayerToTeamInput.teamId,
      userId: addPlayerToTeamInput.playerId,
      jerseyNumber: addPlayerToTeamInput.jersey.toString(),
      primaryPosition: 'Midfielder', // Default position
      joinedDate: new Date(),
      isActive: addPlayerToTeamInput.isActive !== false,
    });

    await this.teamPlayerRepository.save(teamPlayer);

    // Return the team (which should have all required fields)
    return team;
  }

  async removePlayerFromTeam(
    teamId: string,
    playerId: string
  ): Promise<boolean> {
    const teamPlayer = await this.teamPlayerRepository.findOne({
      where: {
        team: { id: teamId },
        user: { id: playerId },
      },
    });

    if (!teamPlayer) {
      throw new NotFoundException(`Player is not associated with this team`);
    }

    await this.teamPlayerRepository.remove(teamPlayer);
    return true;
  }

  async getPlayersWithJersey(teamId: string): Promise<TeamPlayerWithJersey[]> {
    const teamPlayers = await this.teamPlayerRepository.find({
      where: { team: { id: teamId } },
      relations: ['user'],
      order: { jerseyNumber: 'ASC' },
    });

    return teamPlayers
      .filter((tp) => tp.user !== null && tp.user !== undefined)
      .map((tp) => ({
        id: (tp.user as User).id,
        name: `${(tp.user as User).firstName} ${(tp.user as User).lastName}`,
        position: tp.primaryPosition || 'Unknown',
        jersey: parseInt(tp.jerseyNumber || '0'),
        isActive: tp.isActive,
      }));
  }

  // Unmanaged team support methods

  /**
   * Create a new unmanaged (opponent) team with minimal information
   */
  async createUnmanagedTeam(name: string, shortName?: string): Promise<Team> {
    const team = this.teamRepository.create({
      name: name.trim(),
      shortName,
      isManaged: false,
      sourceType: SourceType.EXTERNAL,
      isActive: true,
    });

    return this.teamRepository.save(team);
  }

  /**
   * Find an unmanaged team by name or create it if it doesn't exist
   */
  async findOrCreateUnmanagedTeam(
    name: string,
    shortName?: string
  ): Promise<Team> {
    const trimmedName = name.trim();

    // First check if we already have this unmanaged team
    const existing = await this.teamRepository.findOne({
      where: {
        name: trimmedName,
        isManaged: false,
        sourceType: SourceType.EXTERNAL,
      },
    });

    if (existing) {
      return existing;
    }

    // Create new unmanaged team
    return this.createUnmanagedTeam(trimmedName, shortName);
  }

  /**
   * Get all managed teams (teams with full data)
   */
  async findManagedTeams(): Promise<Team[]> {
    return this.teamRepository.find({
      where: { isManaged: true },
    });
  }

  /**
   * Get all unmanaged teams (opponent teams)
   */
  async findUnmanagedTeams(): Promise<Team[]> {
    return this.teamRepository.find({
      where: { isManaged: false },
    });
  }

  /**
   * Upgrade an unmanaged team to a managed team with full details
   */
  async upgradeToManagedTeam(
    teamId: string,
    updateData: Partial<Team>
  ): Promise<Team> {
    const team = await this.findOne(teamId);

    if (team.isManaged) {
      throw new ConflictException('Team is already managed');
    }

    // Apply the update data
    Object.assign(team, updateData);

    // Change to managed
    team.isManaged = true;

    return this.teamRepository.save(team);
  }

  /**
   * Find teams by managed status
   */
  async findByManagedStatus(isManaged: boolean): Promise<Team[]> {
    return this.teamRepository.find({
      where: { isManaged },
    });
  }

  /**
   * Find teams by source type
   */
  async findBySourceType(sourceType: SourceType): Promise<Team[]> {
    return this.teamRepository.find({
      where: { sourceType },
    });
  }

  /**
   * Backfill owners for all teams created by a user that don't have an owner yet.
   * This is useful for teams created before the owner assignment was implemented.
   *
   * @param clerkUserId - The Clerk user ID (stored in createdById)
   * @param internalUserId - The internal User entity ID
   * @returns Array of teams that were updated with owners
   */
  async backfillOwnersForUser(
    clerkUserId: string,
    internalUserId: string
  ): Promise<Team[]> {
    // Find all teams created by this user
    const teamsCreatedByUser = await this.teamRepository.find({
      where: { createdById: clerkUserId },
    });

    const updatedTeams: Team[] = [];

    for (const team of teamsCreatedByUser) {
      // Check if team already has an owner
      const existingOwner = await this.teamMembersService.findTeamOwner(
        team.id
      );

      if (!existingOwner) {
        // Add the creator as owner
        try {
          await this.teamMembersService.addMember(
            team.id,
            internalUserId,
            TeamRole.OWNER
          );
          updatedTeams.push(team);
        } catch {
          // Skip if there's an error (e.g., user already has another role)
          console.warn(
            `Could not add owner to team ${team.id}: user may already have a role`
          );
        }
      }
    }

    return updatedTeams;
  }
}

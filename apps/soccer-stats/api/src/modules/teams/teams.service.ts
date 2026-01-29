import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Team, SourceType } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { TeamMembersService } from '../team-members/team-members.service';

import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { AddPlayerToTeamInput } from './dto/add-player-to-team.input';
import { TeamPlayerWithJersey } from './dto/team-player-with-jersey.dto';
import { UpdateTeamConfigurationInput } from './dto/update-team-configuration.input';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>,
    @InjectRepository(TeamConfiguration)
    private readonly teamConfigurationRepository: Repository<TeamConfiguration>,
    @Inject(forwardRef(() => TeamMembersService))
    private readonly teamMembersService: TeamMembersService,
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
    internalUserId?: string,
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
        TeamRole.OWNER,
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

  /**
   * Find all teams where a user has a PLAYER role
   */
  async findByPlayerId(playerId: string): Promise<Team[]> {
    const memberships = await this.teamMembersService.findByUser(playerId, {
      includeRoles: true,
    });
    return memberships
      .filter(
        (m) =>
          m.isActive &&
          m.roles?.some((r) => r.role === TeamRole.PLAYER) &&
          m.team,
      )
      .map((m) => m.team);
  }

  /**
   * Find all teams where a user has a COACH or GUEST_COACH role
   */
  async findByCoachId(coachId: string): Promise<Team[]> {
    const memberships = await this.teamMembersService.findByUser(coachId, {
      includeRoles: true,
    });
    return memberships
      .filter(
        (m) =>
          m.isActive &&
          m.roles?.some(
            (r) => r.role === TeamRole.COACH || r.role === TeamRole.GUEST_COACH,
          ) &&
          m.team,
      )
      .map((m) => m.team);
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
   * Check if a user has access to a specific team.
   * Access is granted if user is the creator or has any active membership.
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

    // Check if user is an active team member (any role)
    return this.teamMembersService.isTeamMember(userId, teamId);
  }

  /**
   * Get all users who have a PLAYER role in the team
   */
  async getPlayersForTeam(teamId: string): Promise<User[]> {
    const players = await this.teamMembersService.findPlayersForTeam(teamId);
    return players
      .filter((member) => member.user !== null && member.user !== undefined)
      .map((member) => member.user as User);
  }

  // ResolveField methods

  /**
   * Get all team members (all roles) for a team
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.teamMembersService.findByTeam(teamId);
  }

  async getGameTeams(teamId: string): Promise<GameTeam[]> {
    return this.gameTeamRepository.find({
      where: { team: { id: teamId } },
      // Nested relations are loaded via DataLoader + field resolvers
      // to avoid over-fetching when not needed
    });
  }

  /**
   * Add a player to a team with jersey number and position
   */
  async addPlayerToTeam(
    addPlayerToTeamInput: AddPlayerToTeamInput,
  ): Promise<Team> {
    // Verify team exists
    const team = await this.findOne(addPlayerToTeamInput.teamId);

    // Check if player already has PLAYER role in this team
    const hasPlayerRole = await this.teamMembersService.hasRole(
      addPlayerToTeamInput.playerId,
      addPlayerToTeamInput.teamId,
      TeamRole.PLAYER,
    );

    if (hasPlayerRole) {
      throw new ConflictException(
        `Player is already associated with this team`,
      );
    }

    // Check if jersey number is already taken (only if jersey provided)
    if (addPlayerToTeamInput.jerseyNumber) {
      const existingPlayers = await this.teamMembersService.findPlayersForTeam(
        addPlayerToTeamInput.teamId,
      );
      const jerseyTaken = existingPlayers.some((member) =>
        member.roles?.some(
          (r) =>
            r.role === TeamRole.PLAYER &&
            r.jerseyNumber === addPlayerToTeamInput.jerseyNumber,
        ),
      );

      if (jerseyTaken) {
        throw new ConflictException(
          `Jersey number ${addPlayerToTeamInput.jerseyNumber} is already taken`,
        );
      }
    }

    // Add the player using TeamMembersService
    await this.teamMembersService.addPlayer(
      addPlayerToTeamInput.teamId,
      addPlayerToTeamInput.playerId,
      {
        jerseyNumber: addPlayerToTeamInput.jerseyNumber,
        primaryPosition: addPlayerToTeamInput.primaryPosition,
      },
    );

    // Return the team
    return team;
  }

  /**
   * Remove a player from a team
   */
  async removePlayerFromTeam(
    teamId: string,
    playerId: string,
  ): Promise<boolean> {
    const membership = await this.teamMembersService.findMembership(
      playerId,
      teamId,
    );

    if (!membership) {
      throw new NotFoundException(`Player is not associated with this team`);
    }

    const playerRole = membership.roles?.find(
      (r) => r.role === TeamRole.PLAYER,
    );
    if (!playerRole) {
      throw new NotFoundException(
        `User does not have player role in this team`,
      );
    }

    // Remove the player role (this may also remove membership if no other roles)
    await this.teamMembersService.removeRoleFromMember(
      membership.id,
      TeamRole.PLAYER,
    );
    return true;
  }

  /**
   * Get players with their jersey numbers for display
   */
  async getPlayersWithJersey(teamId: string): Promise<TeamPlayerWithJersey[]> {
    const players = await this.teamMembersService.findPlayersForTeam(teamId);

    return players
      .filter((member) => member.user !== null && member.user !== undefined)
      .map((member) => {
        const playerRole = member.roles?.find(
          (r) => r.role === TeamRole.PLAYER,
        );
        const user = member.user as User;
        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          position: playerRole?.primaryPosition || 'Unknown',
          jersey: parseInt(playerRole?.jerseyNumber || '0'),
          isActive: member.isActive,
        };
      })
      .sort((a, b) => a.jersey - b.jersey);
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
    shortName?: string,
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
    updateData: Partial<Team>,
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
    internalUserId: string,
  ): Promise<Team[]> {
    // Find all teams created by this user
    const teamsCreatedByUser = await this.teamRepository.find({
      where: { createdById: clerkUserId },
    });

    const updatedTeams: Team[] = [];
    const failedTeams: Array<{
      teamId: string;
      teamName: string;
      reason: string;
      isExpected: boolean;
    }> = [];

    for (const team of teamsCreatedByUser) {
      // Check if team already has an owner
      const existingOwner = await this.teamMembersService.findTeamOwner(
        team.id,
      );

      if (!existingOwner) {
        // Add the creator as owner
        try {
          await this.teamMembersService.addMember(
            team.id,
            internalUserId,
            TeamRole.OWNER,
          );
          updatedTeams.push(team);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorStack =
            error instanceof Error ? error.stack : 'No stack trace';

          // Determine if this is an expected failure (user already has role)
          // or an unexpected failure (database error, etc.)
          const isExpectedFailure =
            errorMessage.includes('already') ||
            errorMessage.includes('conflict') ||
            errorMessage.includes('duplicate');

          if (isExpectedFailure) {
            this.logger.debug(
              `Skipping owner assignment for team ${team.id} (${team.name}): ${errorMessage}`,
            );
          } else {
            // Log unexpected errors with full stack trace for debugging
            this.logger.error(
              `Failed to add owner to team ${team.id} (${team.name}) for user ${internalUserId}: ${errorMessage}`,
              errorStack,
            );
          }

          failedTeams.push({
            teamId: team.id,
            teamName: team.name,
            reason: errorMessage,
            isExpected: isExpectedFailure,
          });
        }
      }
    }

    // Log summary if there were failures
    if (failedTeams.length > 0) {
      const unexpectedFailures = failedTeams.filter((f) => !f.isExpected);
      if (unexpectedFailures.length > 0) {
        this.logger.warn(
          `Backfill completed with ${unexpectedFailures.length} unexpected failure(s) out of ${failedTeams.length} total failure(s). ` +
            `Successfully updated ${updatedTeams.length} team(s). ` +
            `Unexpected failures: ${JSON.stringify(unexpectedFailures)}`,
        );
      } else {
        this.logger.debug(
          `Backfill completed: ${updatedTeams.length} team(s) updated, ${failedTeams.length} skipped (expected)`,
        );
      }
    }

    return updatedTeams;
  }

  // Team Configuration methods

  /**
   * Get the configuration for a team. Returns null if no configuration exists.
   */
  async getTeamConfiguration(
    teamId: string,
  ): Promise<TeamConfiguration | null> {
    return this.teamConfigurationRepository.findOne({
      where: { teamId },
    });
  }

  /**
   * Update or create team configuration settings.
   * If no configuration exists for the team, a new one is created.
   */
  async updateTeamConfiguration(
    teamId: string,
    input: UpdateTeamConfigurationInput,
  ): Promise<TeamConfiguration> {
    // Verify team exists
    await this.findOne(teamId);

    // Find existing configuration
    let config = await this.teamConfigurationRepository.findOne({
      where: { teamId },
    });

    if (config) {
      // Update existing configuration
      Object.assign(config, input);
    } else {
      // Create new configuration
      config = this.teamConfigurationRepository.create({
        teamId,
        ...input,
      });
    }

    return this.teamConfigurationRepository.save(config);
  }
}

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { TeamCoach } from '../../entities/team-coach.entity';
import { ClerkUser } from '../auth/clerk.service';

import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

export enum UserType {
  PLAYER = 'player',
  COACH = 'coach',
  ALL = 'all',
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeamPlayer)
    private readonly teamPlayerRepository: Repository<TeamPlayer>,
    @InjectRepository(TeamCoach)
    private readonly teamCoachRepository: Repository<TeamCoach>,
  ) {}

  async findAll(userType: UserType = UserType.ALL): Promise<User[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    switch (userType) {
      case UserType.PLAYER:
        queryBuilder
          .leftJoinAndSelect('user.playerTeams', 'teamPlayer')
          .andWhere('teamPlayer.isActive = :teamPlayerActive', {
            teamPlayerActive: true,
          });
        break;

      case UserType.COACH:
        queryBuilder
          .leftJoinAndSelect('user.coachTeams', 'teamCoach')
          .andWhere('teamCoach.isActive = :teamCoachActive', {
            teamCoachActive: true,
          });
        break;

      case UserType.ALL:
        queryBuilder
          .leftJoinAndSelect('user.playerTeams', 'teamPlayer')
          .leftJoinAndSelect('user.coachTeams', 'teamCoach');
        break;
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'playerTeams',
        'teamPlayers.team',
        'coachTeams',
        'teamCoaches.team',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find a user by Clerk ID, with fallback to email.
   * ClerkId lookup is preferred; email is only used as a fallback
   * for users who haven't been migrated yet.
   *
   * @param clerkId - The Clerk user ID (stable identifier)
   * @param email - Optional email for fallback lookup (for unmigrated users)
   * @returns The user if found, null otherwise
   */
  async findByClerkIdOrEmail(
    clerkId: string,
    email?: string,
  ): Promise<User | null> {
    // First, try to find by clerkId (preferred)
    const user = await this.userRepository.findOne({
      where: { clerkId },
    });

    if (user) {
      return user;
    }

    // Fallback: try to find by email (for unmigrated users)
    if (email) {
      return await this.userRepository.findOne({
        where: { email },
      });
    }

    return null;
  }

  /**
   * Find an existing user or create a new one from Clerk user data.
   * This implements Just-In-Time (JIT) user provisioning.
   *
   * Lookup strategy:
   * 1. Try to find by clerkId (preferred, stable identifier)
   * 2. Fallback to email (for users created before clerkId was stored)
   *    - If found by email, backfill the clerkId for future lookups
   * 3. If no match, create a new user with data from Clerk
   *
   * ## Future Enhancement: Clerk Webhooks
   *
   * For more robust user sync (e.g., handling user updates/deletions from Clerk),
   * consider implementing Clerk webhooks:
   *
   * - Webhook events guide: https://clerk.com/docs/webhooks/sync-data
   * - Available events: https://clerk.com/docs/webhooks/events
   * - Key events: `user.created`, `user.updated`, `user.deleted`
   *
   * Webhooks would allow:
   * - Pre-creating users before they access the app
   * - Syncing profile updates (name, email changes)
   * - Handling user deletion/deactivation
   *
   * @param clerkUser - The authenticated Clerk user
   * @returns The existing or newly created internal user
   */
  async findOrCreateByClerkUser(clerkUser: ClerkUser): Promise<User> {
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;

    try {
      // 1. Try to find by clerkId (preferred, stable identifier)
      let user = await this.userRepository.findOne({
        where: { clerkId: clerkUser.id },
      });

      if (user) {
        return user;
      }

      // 2. Try to find by email and backfill clerkId
      if (email) {
        user = await this.userRepository.findOne({
          where: { email },
        });

        if (user) {
          // Backfill clerkId for future lookups
          const originalClerkId = user.clerkId;
          user.clerkId = clerkUser.id;

          try {
            await this.userRepository.save(user);
            this.logger.log(
              `Backfilled clerkId for user ${user.id} (email: ${email})`,
            );
          } catch (backfillError) {
            // If backfill fails, log but continue - user can still be identified by email
            this.logger.error(
              `Failed to backfill clerkId for user ${user.id} (email: ${email}): ${
                backfillError instanceof Error
                  ? backfillError.message
                  : String(backfillError)
              }`,
            );
            // Restore original state on the object we're returning
            user.clerkId = originalClerkId;
          }
          return user;
        }
      }

      // Log warning if creating user without email (no recovery path without clerkId)
      if (!email) {
        this.logger.warn(
          `Creating user for Clerk user ${clerkUser.id} without email address. ` +
            `User recovery without clerkId will not be possible.`,
        );
      }

      // 3. Create new user from Clerk data
      const newUser = this.userRepository.create({
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName || 'New',
        lastName: clerkUser.lastName || 'User',
      });

      const savedUser = await this.userRepository.save(newUser);
      this.logger.log(
        `Created new user ${savedUser.id} from Clerk user ${clerkUser.id}`,
      );

      return savedUser;
    } catch (error) {
      // Handle race condition: another request may have created the user
      if (
        error instanceof QueryFailedError &&
        (error.message.includes('duplicate key') ||
          error.message.includes('unique constraint') ||
          error.driverError?.code === '23505') // PostgreSQL unique violation code
      ) {
        this.logger.warn(
          `Race condition detected for Clerk user ${clerkUser.id}, retrying lookup`,
        );

        // Retry the lookup - the other request likely succeeded
        const existingUser = await this.userRepository.findOne({
          where: { clerkId: clerkUser.id },
        });

        if (existingUser) {
          return existingUser;
        }

        // Also check by email if available
        if (email) {
          const userByEmail = await this.userRepository.findOne({
            where: { email },
          });
          if (userByEmail) {
            return userByEmail;
          }
        }
      }

      // Log and rethrow for any other database errors
      this.logger.error(
        `Failed to find or create user for Clerk user ${clerkUser.id} (email: ${email ?? 'none'})`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Unable to verify user account. Please try again.',
      );
    }
  }

  async findByName(
    name: string,
    userType: UserType = UserType.ALL,
  ): Promise<User[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere(
        "(LOWER(user.firstName) LIKE LOWER(:name) OR LOWER(user.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name))",
        { name: `%${name}%` },
      );

    switch (userType) {
      case UserType.PLAYER:
        queryBuilder
          .leftJoinAndSelect('user.playerTeams', 'teamPlayer')
          .andWhere('teamPlayer.isActive = :teamPlayerActive', {
            teamPlayerActive: true,
          });
        break;

      case UserType.COACH:
        queryBuilder
          .leftJoinAndSelect('user.coachTeams', 'teamCoach')
          .andWhere('teamCoach.isActive = :teamCoachActive', {
            teamCoachActive: true,
          });
        break;

      case UserType.ALL:
        queryBuilder
          .leftJoinAndSelect('user.playerTeams', 'teamPlayer')
          .leftJoinAndSelect('user.coachTeams', 'teamCoach');
        break;
    }

    return queryBuilder.getMany();
  }

  // Player-specific queries
  async findByPosition(position: string): Promise<User[]> {
    return this.userRepository.find({
      relations: ['playerTeams'],
      where: {
        isActive: true,
        playerTeams: {
          primaryPosition: position,
          isActive: true,
        },
      },
    });
  }

  // Coach-specific queries
  async findByCoachRole(role: string): Promise<User[]> {
    return this.userRepository.find({
      relations: ['coachTeams'],
      where: {
        isActive: true,
        coachTeams: {
          role,
          isActive: true,
        },
      },
    });
  }

  async findByTeam(
    teamId: string,
    userType: UserType = UserType.ALL,
  ): Promise<User[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    switch (userType) {
      case UserType.PLAYER:
        queryBuilder
          .leftJoinAndSelect('user.playerTeams', 'teamPlayer')
          .andWhere('teamPlayer.teamId = :teamId', { teamId })
          .andWhere('teamPlayer.isActive = :teamPlayerActive', {
            teamPlayerActive: true,
          });
        break;

      case UserType.COACH:
        queryBuilder
          .leftJoinAndSelect('user.coachTeams', 'teamCoach')
          .andWhere('teamCoach.teamId = :teamId', { teamId })
          .andWhere('teamCoach.isActive = :teamCoachActive', {
            teamCoachActive: true,
          });
        break;

      case UserType.ALL:
        queryBuilder
          .leftJoinAndSelect('user.playerTeams', 'teamPlayer')
          .leftJoinAndSelect('user.coachTeams', 'teamCoach')
          .andWhere(
            '(teamPlayer.teamId = :teamId AND teamPlayer.isActive = :teamPlayerActive) OR (teamCoach.teamId = :teamId AND teamCoach.isActive = :teamCoachActive)',
            { teamId, teamPlayerActive: true, teamCoachActive: true },
          );
        break;
    }

    return queryBuilder.getMany();
  }

  async create(createUserInput: CreateUserInput): Promise<User> {
    const user = this.userRepository.create(createUserInput);
    return this.userRepository.save(user);
  }

  async update(id: string, updateUserInput: UpdateUserInput): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserInput);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.findOne(id);

    // Set user as inactive instead of deleting
    user.isActive = false;
    await this.userRepository.save(user);

    // Also deactivate all relationships
    await this.teamPlayerRepository.update({ userId: id }, { isActive: false });
    await this.teamCoachRepository.update({ userId: id }, { isActive: false });

    return true;
  }

  // Relationship management methods
  async getTeamPlayers(userId: string): Promise<TeamPlayer[]> {
    return this.teamPlayerRepository.find({
      where: { userId, isActive: true },
      relations: ['team'],
    });
  }

  async getTeamCoaches(userId: string): Promise<TeamCoach[]> {
    return this.teamCoachRepository.find({
      where: { userId, isActive: true },
      relations: ['team'],
    });
  }

  // Player team management
  async addPlayerToTeam(
    userId: string,
    teamId: string,
    jerseyNumber?: string,
    primaryPosition?: string,
    joinedDate?: Date,
  ): Promise<TeamPlayer> {
    const teamPlayer = this.teamPlayerRepository.create({
      userId,
      teamId,
      jerseyNumber,
      primaryPosition,
      joinedDate: joinedDate || new Date(),
      isActive: true,
    });

    const saved = await this.teamPlayerRepository.save(teamPlayer);

    // Return with relations loaded
    return this.teamPlayerRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['team', 'user'],
    });
  }

  async removePlayerFromTeam(
    userId: string,
    teamId: string,
    leftDate?: Date,
  ): Promise<boolean> {
    const result = await this.teamPlayerRepository.update(
      { userId, teamId, isActive: true },
      {
        isActive: false,
        leftDate: leftDate || new Date(),
      },
    );

    return (result.affected ?? 0) > 0;
  }

  // Coach team management
  async addCoachToTeam(
    userId: string,
    teamId: string,
    role: string,
    startDate: Date,
  ): Promise<TeamCoach> {
    const teamCoach = this.teamCoachRepository.create({
      userId,
      teamId,
      role,
      startDate,
      isActive: true,
    });

    const saved = await this.teamCoachRepository.save(teamCoach);

    // Return with relations loaded
    return this.teamCoachRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['team', 'user'],
    });
  }

  async removeCoachFromTeam(
    userId: string,
    teamId: string,
    endDate?: Date,
  ): Promise<boolean> {
    const result = await this.teamCoachRepository.update(
      { userId, teamId, isActive: true },
      {
        isActive: false,
        endDate: endDate || new Date(),
      },
    );

    return (result.affected ?? 0) > 0;
  }
}

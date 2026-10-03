import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EventType } from '../../entities/event-type.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';

export interface BenchGameTeam {
  id: string;
  teamId: string;
}

/** Whose name a bench entry goes under when no user is creating the game. */
const RECORDER_ROLES = [TeamRole.OWNER, TeamRole.MANAGER, TeamRole.COACH];

/**
 * Puts a game team's active players on the game's bench.
 *
 * A game roster is the players available for that match. Every active
 * player starts on the bench; coaches place starters on the field or remove
 * players who can't make it. Players already in the game are left as they
 * are, so this is safe to run again.
 */
@Injectable()
export class GameBenchService {
  private readonly logger = new Logger(GameBenchService.name);

  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,
    @InjectRepository(GameEvent)
    private readonly gameEventRepository: Repository<GameEvent>,
  ) {}

  /**
   * @param recordedByUserId who is creating the game; defaults to each
   *   team's owner (or manager/coach) for games nobody created by hand,
   *   such as calendar imports. A team with neither is skipped.
   * @returns how many players were put on a bench
   */
  async seedBench(
    gameId: string,
    gameTeams: BenchGameTeam[],
    recordedByUserId?: string,
  ): Promise<number> {
    const gameRoster = await this.eventTypeRepository.findOne({
      where: { name: 'GAME_ROSTER' },
    });
    if (!gameRoster) {
      throw new Error('GAME_ROSTER event type not found');
    }

    const entries: GameEvent[] = [];
    for (const gameTeam of gameTeams) {
      const members = await this.teamMemberRepository.find({
        where: { teamId: gameTeam.teamId, isActive: true },
        relations: ['roles'],
      });
      const hasRole = (member: TeamMember, roles: TeamRole[]) =>
        member.roles?.some((role) => roles.includes(role.role)) ?? false;

      const players = members.filter((m) => hasRole(m, [TeamRole.PLAYER]));
      if (players.length === 0) continue;

      const recorder =
        recordedByUserId ??
        RECORDER_ROLES.map(
          (role) => members.find((m) => hasRole(m, [role]))?.userId,
        ).find(Boolean);
      if (!recorder) {
        this.logger.warn(
          `No owner, manager or coach for team ${gameTeam.teamId}; game ${gameId} starts with an empty bench`,
        );
        continue;
      }

      const alreadyInGame = new Set(
        (
          await this.gameEventRepository.find({
            select: { playerId: true },
            where: { gameTeamId: gameTeam.id, eventTypeId: gameRoster.id },
          })
        ).map((event) => event.playerId),
      );

      for (const player of players) {
        if (alreadyInGame.has(player.userId)) continue;
        entries.push(
          this.gameEventRepository.create({
            gameId,
            gameTeamId: gameTeam.id,
            eventTypeId: gameRoster.id,
            playerId: player.userId,
            recordedByUserId: recorder,
            period: '1',
            periodSecond: 0,
            position: null,
          }),
        );
      }
    }

    if (entries.length > 0) {
      await this.gameEventRepository.insert(entries);
    }
    return entries.length;
  }
}

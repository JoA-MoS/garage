import { TeamMember, TeamRole } from '../../entities/team-member.entity';

import { GameBenchService } from './game-bench.service';

function member(userId: string, ...roles: TeamRole[]): TeamMember {
  return {
    userId,
    isActive: true,
    roles: roles.map((role) => ({ role })),
  } as TeamMember;
}

describe('GameBenchService', () => {
  const teamMembers = { find: jest.fn() };
  const eventTypes = { findOne: jest.fn() };
  const gameEvents = {
    find: jest.fn(),
    create: jest.fn((input) => input),
    insert: jest.fn(),
  };
  let service: GameBenchService;

  const home = { id: 'gt-home', teamId: 'team-home' };
  const away = { id: 'gt-away', teamId: 'team-away' };

  beforeEach(() => {
    jest.clearAllMocks();
    eventTypes.findOne.mockResolvedValue({ id: 'et-roster' });
    gameEvents.find.mockResolvedValue([]);
    service = new GameBenchService(
      teamMembers as never,
      eventTypes as never,
      gameEvents as never,
    );
  });

  it('puts every active player on the bench, recorded by the creator', async () => {
    teamMembers.find
      .mockResolvedValueOnce([
        member('p1', TeamRole.PLAYER),
        member('coach', TeamRole.COACH),
      ])
      .mockResolvedValueOnce([member('p2', TeamRole.PLAYER)]);

    const count = await service.seedBench('game-1', [home, away], 'creator');

    expect(count).toBe(2);
    expect(teamMembers.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { teamId: 'team-home', isActive: true },
      }),
    );
    expect(gameEvents.insert).toHaveBeenCalledWith([
      {
        gameId: 'game-1',
        gameTeamId: 'gt-home',
        eventTypeId: 'et-roster',
        playerId: 'p1',
        recordedByUserId: 'creator',
        period: '1',
        periodSecond: 0,
        position: null,
      },
      expect.objectContaining({
        gameTeamId: 'gt-away',
        playerId: 'p2',
        recordedByUserId: 'creator',
      }),
    ]);
  });

  it("records an imported game's bench under the team owner", async () => {
    teamMembers.find.mockResolvedValueOnce([
      member('coach', TeamRole.COACH),
      member('owner', TeamRole.OWNER),
      member('p1', TeamRole.PLAYER),
    ]);

    await service.seedBench('game-1', [home]);

    expect(gameEvents.insert).toHaveBeenCalledWith([
      expect.objectContaining({ playerId: 'p1', recordedByUserId: 'owner' }),
    ]);
  });

  it('leaves players already in the game alone, so it can run again', async () => {
    teamMembers.find.mockResolvedValueOnce([
      member('p1', TeamRole.PLAYER),
      member('p2', TeamRole.PLAYER),
    ]);
    gameEvents.find.mockResolvedValueOnce([{ playerId: 'p1' }]);

    const count = await service.seedBench('game-1', [home], 'creator');

    expect(count).toBe(1);
    expect(gameEvents.insert).toHaveBeenCalledWith([
      expect.objectContaining({ playerId: 'p2' }),
    ]);
  });

  it('skips teams with no players (e.g. an imported opponent)', async () => {
    teamMembers.find.mockResolvedValueOnce([]);

    const count = await service.seedBench('game-1', [away]);

    expect(count).toBe(0);
    expect(gameEvents.insert).not.toHaveBeenCalled();
  });

  it('skips a team with nobody to record the entries under', async () => {
    teamMembers.find.mockResolvedValueOnce([member('p1', TeamRole.PLAYER)]);

    const count = await service.seedBench('game-1', [home]);

    expect(count).toBe(0);
    expect(gameEvents.insert).not.toHaveBeenCalled();
  });
});

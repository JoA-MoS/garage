import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Game, GameStatus } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { EventType, EventCategory } from '../../entities/event-type.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { DEFAULT_STATS_FEATURES } from '../../entities/stats-features.type';
import { GameEventsService } from '../game-events/game-events.service';
import { GameEventAction } from '../game-events/dto/game-event-subscription.output';
import { ActionReceiptService } from '../game-events/services/action-receipt.service';

import { GamesService } from './games.service';
import { GameTimingService } from './game-timing.service';

describe('GamesService', () => {
  let service: GamesService;
  let gameRepository: jest.Mocked<Repository<Game>>;
  let gameEventRepository: jest.Mocked<Repository<GameEvent>>;
  let eventTypeRepository: jest.Mocked<Repository<EventType>>;

  // Mock repositories
  const mockGameRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTeamRepository = {
    findOne: jest.fn(),
  };

  const mockGameTeamRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockGameFormatRepository = {
    findOne: jest.fn(),
  };

  const mockGameEventRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEventTypeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTeamConfigurationRepository = {
    findOne: jest.fn(),
  };

  const mockTeamMemberRepository = {
    find: jest.fn(),
  };

  const mockGameEventsService = {
    createSubstitutionOutForAllOnField: jest.fn().mockResolvedValue([]),
    ensureSecondHalfLineupExists: jest.fn().mockResolvedValue(undefined),
    linkOrphanSubInsToSecondHalfPeriodStart: jest.fn().mockResolvedValue(0),
    linkFirstHalfStartersToPeriodStart: jest.fn().mockResolvedValue(0),
    createSubInEventsFromRosterStarters: jest.fn().mockResolvedValue(0),
    createGameRosterForNextPeriod: jest.fn().mockResolvedValue(0),
    getGameLineup: jest.fn().mockResolvedValue({ currentOnField: [] }),
  };

  const mockGameTimingService = {
    getGameDurationSeconds: jest.fn().mockResolvedValue(0),
    getGameTiming: jest.fn().mockResolvedValue({}),
  };

  const mockPubSub = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  // Default: behaves as a first application (runs apply, not replayed).
  const mockActionReceiptService = {
    applyOnce: jest.fn(async (_action, { apply }) => ({
      result: (await apply({})).result,
      replayed: false,
    })),
  };

  // Mock event types for timing
  const mockTimingEventTypes: Partial<EventType>[] = [
    {
      id: 'et-period-start',
      name: 'PERIOD_START',
      category: EventCategory.GAME_FLOW,
    },
    {
      id: 'et-period-end',
      name: 'PERIOD_END',
      category: EventCategory.GAME_FLOW,
    },
    {
      id: 'et-stoppage-start',
      name: 'STOPPAGE_START',
      category: EventCategory.GAME_FLOW,
    },
    {
      id: 'et-stoppage-end',
      name: 'STOPPAGE_END',
      category: EventCategory.GAME_FLOW,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        { provide: getRepositoryToken(Game), useValue: mockGameRepository },
        { provide: getRepositoryToken(Team), useValue: mockTeamRepository },
        {
          provide: getRepositoryToken(GameTeam),
          useValue: mockGameTeamRepository,
        },
        {
          provide: getRepositoryToken(GameFormat),
          useValue: mockGameFormatRepository,
        },
        {
          provide: getRepositoryToken(GameEvent),
          useValue: mockGameEventRepository,
        },
        {
          provide: getRepositoryToken(EventType),
          useValue: mockEventTypeRepository,
        },
        {
          provide: getRepositoryToken(TeamConfiguration),
          useValue: mockTeamConfigurationRepository,
        },
        {
          provide: getRepositoryToken(TeamMember),
          useValue: mockTeamMemberRepository,
        },
        {
          provide: GameEventsService,
          useValue: mockGameEventsService,
        },
        {
          provide: GameTimingService,
          useValue: mockGameTimingService,
        },
        {
          provide: ActionReceiptService,
          useValue: mockActionReceiptService,
        },
        {
          provide: 'PUB_SUB',
          useValue: mockPubSub,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    gameRepository = module.get(getRepositoryToken(Game));
    gameEventRepository = module.get(getRepositoryToken(GameEvent));
    eventTypeRepository = module.get(getRepositoryToken(EventType));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('puts every active player from both teams on the bench', async () => {
      mockTeamRepository.findOne
        .mockResolvedValueOnce({ id: 'team-home' } as Team)
        .mockResolvedValueOnce({ id: 'team-away' } as Team);
      mockTeamConfigurationRepository.findOne.mockResolvedValue(null);
      mockGameFormatRepository.findOne.mockResolvedValue({
        id: 'format-5v5',
      } as GameFormat);
      mockTeamMemberRepository.find
        .mockResolvedValueOnce([
          {
            teamId: 'team-home',
            userId: 'home-player',
            isActive: true,
            roles: [{ role: TeamRole.PLAYER }],
          },
          {
            teamId: 'team-home',
            userId: 'home-coach',
            isActive: true,
            roles: [{ role: TeamRole.COACH }],
          },
        ] as TeamMember[])
        .mockResolvedValueOnce([
          {
            teamId: 'team-away',
            userId: 'away-player',
            isActive: true,
            roles: [{ role: TeamRole.PLAYER }],
          },
        ] as TeamMember[]);
      mockEventTypeRepository.findOne.mockResolvedValue({
        id: 'event-type-game-roster',
        name: 'GAME_ROSTER',
      } as EventType);
      mockGameRepository.create.mockImplementation((input) => input as Game);
      mockGameRepository.save.mockResolvedValue({ id: 'game-1' } as Game);
      mockGameTeamRepository.create.mockImplementation(
        (input) =>
          ({
            ...input,
            id: input.teamType === 'home' ? 'game-team-home' : 'game-team-away',
          }) as GameTeam,
      );
      mockGameTeamRepository.save.mockImplementation(async (teams) => teams);
      mockGameEventRepository.create.mockImplementation(
        (input) => input as GameEvent,
      );
      mockGameEventRepository.save.mockImplementation(async (events) => events);
      mockGameRepository.findOne.mockResolvedValue({ id: 'game-1' } as Game);

      await service.create(
        {
          homeTeamId: 'team-home',
          awayTeamId: 'team-away',
          gameFormatId: 'format-5v5',
          duration: 60,
        },
        'coach-user',
      );

      expect(mockGameEventRepository.save).toHaveBeenCalledWith([
        expect.objectContaining({
          gameId: 'game-1',
          gameTeamId: 'game-team-home',
          eventTypeId: 'event-type-game-roster',
          playerId: 'home-player',
          recordedByUserId: 'coach-user',
          position: null,
        }),
        expect.objectContaining({
          gameId: 'game-1',
          gameTeamId: 'game-team-away',
          eventTypeId: 'event-type-game-roster',
          playerId: 'away-player',
          recordedByUserId: 'coach-user',
          position: null,
        }),
      ]);
    });
  });

  describe('update - timing event creation', () => {
    const mockGame: Partial<Game> = {
      id: 'game-1',
      status: GameStatus.SCHEDULED,
      gameFormatId: 'format-1',
    };

    beforeEach(() => {
      // Default: findOne returns the mock game with full relations
      mockGameRepository.findOne.mockResolvedValue({
        ...mockGame,
        gameTeams: [],
        gameFormat: { id: 'format-1', name: '5v5' },
      } as Game);
      mockGameRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Default: return home team for timing events
      mockGameTeamRepository.findOne.mockResolvedValue({
        id: 'game-team-home',
        gameId: 'game-1',
        teamType: 'home',
      } as GameTeam);

      // Default: return both game teams for substitution events
      mockGameTeamRepository.find.mockResolvedValue([
        { id: 'game-team-home', gameId: 'game-1', teamType: 'home' },
        { id: 'game-team-away', gameId: 'game-1', teamType: 'away' },
      ] as GameTeam[]);

      // Default: return all timing event types
      mockEventTypeRepository.find.mockResolvedValue(
        mockTimingEventTypes as EventType[],
      );

      // Event creation mocks
      mockGameEventRepository.create.mockImplementation(
        (input) => input as GameEvent,
      );
      mockGameEventRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: `event-${Date.now()}` } as GameEvent),
      );

      // Idempotency check mock - default: no existing events
      const mockSelectQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockGameEventRepository.createQueryBuilder.mockReturnValue(
        mockSelectQueryBuilder as any,
      );
    });

    describe('createTimingEventsForStatusChange', () => {
      it('should create PERIOD_START event when status is FIRST_HALF', async () => {
        await service.update(
          'game-1',
          { status: GameStatus.FIRST_HALF },
          'user-123',
        );

        // Should have created 1 event: PERIOD_START (no GAME_START wrapper)
        expect(mockGameEventRepository.create).toHaveBeenCalledTimes(1);
        expect(mockGameEventRepository.save).toHaveBeenCalledTimes(1);

        const createCalls = mockGameEventRepository.create.mock.calls;

        // PERIOD_START with period 1 (no parent)
        expect(createCalls[0][0]).toMatchObject({
          gameId: 'game-1',
          eventTypeId: 'et-period-start',
          recordedByUserId: 'user-123',
          period: '1',
          periodSecond: 0,
        });
        // PERIOD_START should NOT have a parent
        expect(createCalls[0][0].parentEventId).toBeUndefined();
      });

      it('should create PERIOD_END event when status is HALFTIME', async () => {
        await service.update(
          'game-1',
          { status: GameStatus.HALFTIME },
          'user-123',
        );

        expect(mockGameEventRepository.create).toHaveBeenCalledTimes(1);
        expect(mockGameEventRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            gameId: 'game-1',
            eventTypeId: 'et-period-end',
            period: '1',
            periodSecond: 0,
          }),
        );
      });

      it('should create PERIOD_START event when status is SECOND_HALF with periodSecond=0', async () => {
        await service.update(
          'game-1',
          { status: GameStatus.SECOND_HALF },
          'user-123',
        );

        expect(mockGameEventRepository.create).toHaveBeenCalledTimes(1);
        expect(mockGameEventRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            gameId: 'game-1',
            eventTypeId: 'et-period-start',
            period: '2',
            periodSecond: 0, // Must be 0, not absolute seconds like 1800
          }),
        );
      });

      it('should skip GAME_ROSTER conversion when orphan SUB_INs are linked for a team', async () => {
        // Simulate: linkOrphan returns 9 for home team (coach set explicit lineup)
        mockGameEventsService.linkOrphanSubInsToSecondHalfPeriodStart
          .mockResolvedValueOnce(9) // home team: 9 orphans linked
          .mockResolvedValueOnce(0); // away team: 0 orphans linked

        mockGameEventsService.createSubInEventsFromRosterStarters.mockResolvedValue(
          9,
        );

        await service.update(
          'game-1',
          { status: GameStatus.SECOND_HALF },
          'user-123',
        );

        // createSubInEventsFromRosterStarters should only be called for away team (not home)
        expect(
          mockGameEventsService.createSubInEventsFromRosterStarters,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockGameEventsService.createSubInEventsFromRosterStarters,
        ).toHaveBeenCalledWith(
          'game-team-away', // away team only
          expect.any(String),
          'user-123',
          '2',
        );
      });

      it('should create PERIOD_END event when status is COMPLETED with period-relative periodSecond', async () => {
        // Set up a 60-minute game (2 x 30-minute periods)
        mockGameRepository.findOne.mockResolvedValue({
          id: 'game-1',
          status: GameStatus.SECOND_HALF,
          gameFormatId: 'format-1',
          durationMinutes: 60,
          format: {
            id: 'format-1',
            numberOfPeriods: 2,
            periodDurationMinutes: 30,
          },
        } as Game);

        // End game at 29:45 into period 2 (period-relative)
        await service.update(
          'game-1',
          { status: GameStatus.COMPLETED, periodSecond: 1785 },
          'user-123',
        );

        expect(mockGameEventRepository.create).toHaveBeenCalledTimes(1);
        const createCalls = mockGameEventRepository.create.mock.calls;

        // PERIOD_END should have period-relative seconds directly from input
        expect(createCalls[0][0]).toMatchObject({
          gameId: 'game-1',
          eventTypeId: 'et-period-end',
          period: '2',
          periodSecond: 1785,
        });
      });

      it('should not create events when status is not provided', async () => {
        await service.update('game-1', {
          statsFeatures: DEFAULT_STATS_FEATURES,
        });

        expect(mockGameEventRepository.create).not.toHaveBeenCalled();
      });

      it('should throw error when required event types are missing', async () => {
        // Return only partial event types
        mockEventTypeRepository.find.mockResolvedValue([
          { id: 'et-game-start', name: 'GAME_START' },
        ] as EventType[]);

        await expect(
          service.update(
            'game-1',
            { status: GameStatus.FIRST_HALF },
            'user-123',
          ),
        ).rejects.toThrow('Cannot create timing events: missing event types');
      });

      it('should throw error when userId is not provided for status requiring timing events', async () => {
        await expect(
          service.update('game-1', { status: GameStatus.FIRST_HALF }),
        ).rejects.toThrow('userId is required');
      });

      it('should skip creating duplicate timing events (idempotency)', async () => {
        // Mock that PERIOD_START already exists
        const mockSelectQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest
            .fn()
            .mockResolvedValueOnce({ id: 'existing-event', periodSecond: 0 }), // PERIOD_START exists
        };
        mockGameEventRepository.createQueryBuilder.mockReturnValue(
          mockSelectQueryBuilder as any,
        );

        await service.update(
          'game-1',
          { status: GameStatus.FIRST_HALF },
          'user-123',
        );

        // Should not create any events since PERIOD_START already exists
        expect(mockGameEventRepository.create).not.toHaveBeenCalled();
        expect(mockGameEventRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('publishGameEvent (via timing event creation)', () => {
      let errorSpy: jest.SpyInstance;

      beforeEach(() => {
        errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

        // The timing event created by createTimingEventsForStatusChange is
        // re-fetched with relations before publishing; return a hydrated
        // event so the slimming behavior has something to strip.
        mockGameEventRepository.findOne.mockResolvedValue({
          id: 'event-1',
          gameId: 'game-1',
          eventTypeId: 'et-period-start',
          recordedByUserId: 'user-123',
          gameTeamId: 'game-team-home',
          period: '1',
          periodSecond: 0,
          eventType: { id: 'et-period-start', name: 'PERIOD_START' },
          recordedByUser: { id: 'user-123', firstName: 'Coach' },
          gameTeam: { id: 'game-team-home' },
          childEvents: [],
        } as unknown as GameEvent);
      });

      afterEach(() => {
        errorSpy.mockRestore();
      });

      it('publishes a slim event payload without nested relations', async () => {
        await service.update(
          'game-1',
          { status: GameStatus.FIRST_HALF },
          'user-123',
        );

        expect(mockPubSub.publish).toHaveBeenCalledWith('gameEvent:game-1', {
          gameEventChanged: {
            action: GameEventAction.CREATED,
            gameId: 'game-1',
            event: expect.objectContaining({
              id: 'event-1',
              gameId: 'game-1',
              eventTypeId: 'et-period-start',
            }),
          },
        });
        const payloadEvent =
          mockPubSub.publish.mock.calls[0][1].gameEventChanged.event;
        expect(payloadEvent).not.toHaveProperty('eventType');
        expect(payloadEvent).not.toHaveProperty('recordedByUser');
        expect(payloadEvent).not.toHaveProperty('gameTeam');
        expect(payloadEvent).not.toHaveProperty('childEvents');
      });

      it('does not fail the game update when realtime publish fails', async () => {
        mockPubSub.publish.mockRejectedValueOnce(
          new Error('payload string too long'),
        );

        await expect(
          service.update(
            'game-1',
            { status: GameStatus.FIRST_HALF },
            'user-123',
          ),
        ).resolves.toBeDefined();

        expect(errorSpy).toHaveBeenCalledWith(
          'Real-time game event notification failed',
          expect.objectContaining({
            action: GameEventAction.CREATED,
            error: 'payload string too long',
            eventId: 'event-1',
            gameId: 'game-1',
          }),
        );
      });
    });

    describe('client actions (outbox)', () => {
      const ACTION_ID = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';

      beforeEach(() => {
        mockEventTypeRepository.findOne.mockImplementation(({ where }: any) =>
          Promise.resolve(
            mockTimingEventTypes.find((et) => et.name === where.name),
          ),
        );
      });

      it('applies a status change once per actionId', async () => {
        await service.update(
          'game-1',
          { status: GameStatus.HALFTIME, actionId: ACTION_ID },
          'user-123',
        );

        expect(mockActionReceiptService.applyOnce).toHaveBeenCalledWith(
          {
            actionId: ACTION_ID,
            gameId: 'game-1',
            recordedByUserId: 'user-123',
            kind: 'updateGame',
          },
          expect.objectContaining({ apply: expect.any(Function) }),
        );
        expect(mockGameEventRepository.create).toHaveBeenCalledTimes(1);
      });

      it('writes nothing and returns the current game on a retry', async () => {
        mockActionReceiptService.applyOnce.mockImplementationOnce(
          async (_action, { replay }) => ({
            result: await replay([]),
            replayed: true,
          }),
        );

        const game = await service.update(
          'game-1',
          { status: GameStatus.HALFTIME, actionId: ACTION_ID },
          'user-123',
        );

        expect(game).toMatchObject({ id: 'game-1' });
        expect(mockGameEventRepository.create).not.toHaveBeenCalled();
        expect(mockGameRepository.update).not.toHaveBeenCalled();
      });

      it('does not use the receipt when no actionId is given', async () => {
        await service.update(
          'game-1',
          { status: GameStatus.HALFTIME },
          'user-123',
        );

        expect(mockActionReceiptService.applyOnce).not.toHaveBeenCalled();
      });

      it('never passes the outbox fields to the games table', async () => {
        await service.update(
          'game-1',
          {
            status: GameStatus.HALFTIME,
            actionId: ACTION_ID,
            occurredAt: new Date(),
            period: '1',
          },
          'user-123',
        );

        const fields = mockGameRepository.update.mock.calls[0][1];
        expect(fields).toEqual({ status: GameStatus.HALFTIME });
      });

      it('stamps period events with the client occurredAt', async () => {
        const occurredAt = new Date(Date.now() - 30_000);

        await service.update(
          'game-1',
          { status: GameStatus.HALFTIME, periodSecond: 1500, occurredAt },
          'user-123',
        );

        expect(mockGameEventRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            eventTypeId: 'et-period-end',
            occurredAt,
          }),
        );
      });

      it('places a pause in its period at the given second, with occurredAt', async () => {
        const occurredAt = new Date(Date.now() - 5_000);

        await service.update(
          'game-1',
          { pausedAt: occurredAt, period: '2', periodSecond: 734, occurredAt },
          'user-123',
        );

        expect(mockGameEventRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            eventTypeId: 'et-stoppage-start',
            period: '2',
            periodSecond: 734,
            occurredAt,
          }),
        );
      });

      it('keeps the legacy period-less stoppage when no period is sent', async () => {
        await service.update('game-1', { pausedAt: null }, 'user-123');

        expect(mockGameEventRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            eventTypeId: 'et-stoppage-end',
            periodSecond: 0,
          }),
        );
        expect(
          mockGameEventRepository.create.mock.calls[0][0].period,
        ).toBeUndefined();
      });
    });

    describe('handlePauseResumeEvent', () => {
      beforeEach(() => {
        mockEventTypeRepository.findOne.mockImplementation(({ where }: any) => {
          const eventType = mockTimingEventTypes.find(
            (et) => et.name === where.name,
          );
          return Promise.resolve(eventType as EventType);
        });
      });

      it('should create STOPPAGE_START event when pausedAt is a date', async () => {
        const pauseTime = new Date('2024-01-01T10:15:00Z');

        await service.update('game-1', { pausedAt: pauseTime }, 'user-123');

        expect(mockEventTypeRepository.findOne).toHaveBeenCalledWith({
          where: { name: 'STOPPAGE_START' },
        });
        expect(mockGameEventRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            gameId: 'game-1',
            eventTypeId: 'et-stoppage-start',
          }),
        );
      });

      it('should create STOPPAGE_END event when pausedAt is null', async () => {
        await service.update('game-1', { pausedAt: null }, 'user-123');

        expect(mockEventTypeRepository.findOne).toHaveBeenCalledWith({
          where: { name: 'STOPPAGE_END' },
        });
        expect(mockGameEventRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            gameId: 'game-1',
            eventTypeId: 'et-stoppage-end',
          }),
        );
      });

      it('should throw error when STOPPAGE event type is not found', async () => {
        mockEventTypeRepository.findOne.mockResolvedValue(null);

        await expect(
          service.update('game-1', { pausedAt: new Date() }, 'user-123'),
        ).rejects.toThrow('Cannot pause game');
      });

      it('should throw error when userId is not provided for pause', async () => {
        await expect(
          service.update('game-1', { pausedAt: new Date() }),
        ).rejects.toThrow('userId is required');
      });

      it('should throw error when userId is not provided for resume', async () => {
        await expect(
          service.update('game-1', { pausedAt: null }),
        ).rejects.toThrow('userId is required');
      });

      it('should accept string date for pausedAt and convert to Date', async () => {
        const dateString = '2024-01-01T10:15:00Z';

        await service.update(
          'game-1',
          { pausedAt: dateString } as any,
          'user-123',
        );

        expect(mockEventTypeRepository.findOne).toHaveBeenCalledWith({
          where: { name: 'STOPPAGE_START' },
        });
        expect(mockGameEventRepository.create).toHaveBeenCalled();
      });

      it('should throw error for invalid pausedAt string', async () => {
        await expect(
          service.update(
            'game-1',
            { pausedAt: 'not-a-date' } as any,
            'user-123',
          ),
        ).rejects.toThrow('Invalid pausedAt date string');
      });

      it('should throw error for invalid pausedAt type', async () => {
        await expect(
          service.update('game-1', { pausedAt: 12345 } as any, 'user-123'),
        ).rejects.toThrow('Invalid pausedAt type');
      });
    });

    describe('resetGame with timing events', () => {
      const setupDeleteQueryBuilder = () => {
        const mockDeleteBuilder = {
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 5 }),
        };
        mockGameEventRepository.createQueryBuilder.mockReturnValue(
          mockDeleteBuilder as any,
        );
        return mockDeleteBuilder;
      };

      const setupUpdateQueryBuilder = () => {
        const mockUpdateBuilder = {
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        mockGameRepository.createQueryBuilder.mockReturnValue(
          mockUpdateBuilder as any,
        );
        return mockUpdateBuilder;
      };

      it('should delete ALL events when clearEvents is true', async () => {
        const deleteBuilder = setupDeleteQueryBuilder();
        setupUpdateQueryBuilder();

        await service.update('game-1', { resetGame: true, clearEvents: true });

        // Should delete all events (not filter by event type)
        expect(deleteBuilder.where).toHaveBeenCalledWith('gameId = :gameId', {
          gameId: 'game-1',
        });
        expect(deleteBuilder.andWhere).not.toHaveBeenCalled();
      });

      it('should delete only timing events when clearEvents is false', async () => {
        const deleteBuilder = setupDeleteQueryBuilder();
        setupUpdateQueryBuilder();

        await service.update('game-1', { resetGame: true, clearEvents: false });

        // Should filter by timing event types
        expect(deleteBuilder.where).toHaveBeenCalledWith('gameId = :gameId', {
          gameId: 'game-1',
        });
        expect(deleteBuilder.andWhere).toHaveBeenCalledWith(
          'eventTypeId IN (:...timingEventTypeIds)',
          expect.objectContaining({
            timingEventTypeIds: expect.arrayContaining([
              'et-period-start',
              'et-period-end',
              'et-stoppage-start',
              'et-stoppage-end',
            ]),
          }),
        );
      });

      it('should reset status to SCHEDULED', async () => {
        setupDeleteQueryBuilder();
        const updateBuilder = setupUpdateQueryBuilder();

        await service.update('game-1', { resetGame: true });

        expect(updateBuilder.set).toHaveBeenCalledWith(
          expect.objectContaining({
            status: GameStatus.SCHEDULED,
          }),
        );
      });
    });
  });

  describe('update - gameFormatId', () => {
    beforeEach(() => {
      mockGameRepository.update.mockResolvedValue({ affected: 1 } as any);
    });

    it('rejects a gameFormatId change when the game is not SCHEDULED', async () => {
      mockGameRepository.findOne.mockResolvedValue({
        id: 'game-1',
        status: GameStatus.FIRST_HALF,
        gameFormatId: 'format-1',
      } as Game);

      await expect(
        service.update('game-1', { gameFormatId: 'format-2' }),
      ).rejects.toThrow(
        'Game format can only be changed while the game is scheduled',
      );

      expect(mockGameRepository.update).not.toHaveBeenCalled();
    });

    it('rejects a gameFormatId change when the new format does not exist', async () => {
      mockGameRepository.findOne.mockResolvedValue({
        id: 'game-1',
        status: GameStatus.SCHEDULED,
        gameFormatId: 'format-1',
      } as Game);
      mockGameFormatRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('game-1', { gameFormatId: 'format-2' }),
      ).rejects.toThrow('Game format with ID format-2 not found');

      expect(mockGameRepository.update).not.toHaveBeenCalled();
    });

    it('updates the game format when the game is SCHEDULED and the new format exists', async () => {
      mockGameRepository.findOne.mockResolvedValue({
        id: 'game-1',
        status: GameStatus.SCHEDULED,
        gameFormatId: 'format-1',
      } as Game);
      mockGameFormatRepository.findOne.mockResolvedValue({
        id: 'format-2',
        name: '7v7',
      } as GameFormat);

      const mockWhere = jest.fn().mockReturnThis();
      const mockExecute = jest.fn().mockResolvedValue({ affected: 1 });
      const mockSet = jest.fn().mockReturnThis();
      const mockUpdate = jest.fn().mockReturnThis();
      const mockQb = {
        update: mockUpdate,
        set: mockSet,
        where: mockWhere,
        execute: mockExecute,
      };
      mockGameRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await service.update('game-1', { gameFormatId: 'format-2' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ gameFormatId: 'format-2' }),
      );
      expect(mockWhere).toHaveBeenCalledWith(
        'id = :id AND status = :status',
        expect.objectContaining({ id: 'game-1', status: GameStatus.SCHEDULED }),
      );
      expect(mockExecute).toHaveBeenCalled();
    });

    it('throws when the game status changes concurrently (affected = 0)', async () => {
      mockGameRepository.findOne.mockResolvedValue({
        id: 'game-1',
        status: GameStatus.SCHEDULED,
        gameFormatId: 'format-1',
      } as Game);
      mockGameFormatRepository.findOne.mockResolvedValue({
        id: 'format-2',
        name: '7v7',
      } as GameFormat);

      const mockQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      mockGameRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      await expect(
        service.update('game-1', { gameFormatId: 'format-2' }),
      ).rejects.toThrow(
        'Game format can only be changed while the game is scheduled',
      );
    });
  });
});

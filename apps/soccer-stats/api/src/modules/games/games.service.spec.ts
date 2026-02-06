import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Game, GameStatus } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { EventType, EventCategory } from '../../entities/event-type.entity';
import {
  TeamConfiguration,
  StatsTrackingLevel,
} from '../../entities/team-configuration.entity';
import { GameEventsService } from '../game-events/game-events.service';

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
          provide: GameEventsService,
          useValue: mockGameEventsService,
        },
        {
          provide: GameTimingService,
          useValue: mockGameTimingService,
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
          statsTrackingLevel: StatsTrackingLevel.FULL,
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
          getOne: jest.fn().mockResolvedValueOnce({ id: 'existing-event' }), // PERIOD_START exists
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
});

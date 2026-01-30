import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';

import { GameTimingService, GameTiming } from './game-timing.service';

describe('GameTimingService', () => {
  let service: GameTimingService;
  let gameEventRepository: jest.Mocked<Repository<GameEvent>>;
  let eventTypeRepository: jest.Mocked<Repository<EventType>>;

  const mockGameEventRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockEventTypeRepository = {
    find: jest.fn(),
  };

  // Mock event types
  const mockEventTypes: Partial<EventType>[] = [
    { id: 'et-game-start', name: 'GAME_START' },
    { id: 'et-game-end', name: 'GAME_END' },
    { id: 'et-period-start', name: 'PERIOD_START' },
    { id: 'et-period-end', name: 'PERIOD_END' },
    { id: 'et-stoppage-start', name: 'STOPPAGE_START' },
    { id: 'et-stoppage-end', name: 'STOPPAGE_END' },
  ];

  // Helper to create mock events
  const createMockEvent = (
    eventTypeName: string,
    createdAt: Date,
    options?: { period?: string },
  ): Partial<GameEvent> => {
    const eventType = mockEventTypes.find((et) => et.name === eventTypeName);
    return {
      id: `event-${Date.now()}-${Math.random()}`,
      gameId: 'game-1',
      eventTypeId: eventType?.id,
      createdAt,
      period: options?.period,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameTimingService,
        {
          provide: getRepositoryToken(GameEvent),
          useValue: mockGameEventRepository,
        },
        {
          provide: getRepositoryToken(EventType),
          useValue: mockEventTypeRepository,
        },
      ],
    }).compile();

    service = module.get<GameTimingService>(GameTimingService);
    gameEventRepository = module.get(getRepositoryToken(GameEvent));
    eventTypeRepository = module.get(getRepositoryToken(EventType));

    jest.clearAllMocks();

    // Default: return all event types
    mockEventTypeRepository.find.mockResolvedValue(
      mockEventTypes as EventType[],
    );
  });

  describe('onModuleInit', () => {
    it('should cache timing event types on initialization', async () => {
      await service.onModuleInit();

      expect(mockEventTypeRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should warn when no timing event types are found', async () => {
      mockEventTypeRepository.find.mockResolvedValue([]);
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      await service.onModuleInit();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No timing event types found'),
      );
    });

    it('should warn when some timing event types are missing', async () => {
      mockEventTypeRepository.find.mockResolvedValue([
        { id: 'et-game-start', name: 'GAME_START' },
      ] as EventType[]);
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      await service.onModuleInit();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing timing event types'),
      );
    });
  });

  describe('getGameTiming', () => {
    const setupQueryBuilder = (events: Partial<GameEvent>[]) => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(events),
      };
      mockGameEventRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      return mockQueryBuilder;
    };

    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return empty timing when no events exist', async () => {
      setupQueryBuilder([]);

      const timing = await service.getGameTiming('game-1');

      expect(timing).toEqual({});
    });

    it('should compute actualStart from GAME_START event', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      setupQueryBuilder([createMockEvent('GAME_START', startTime)]);

      const timing = await service.getGameTiming('game-1');

      expect(timing.actualStart).toEqual(startTime);
    });

    it('should compute actualEnd from GAME_END event', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T11:00:00Z');
      setupQueryBuilder([
        createMockEvent('GAME_START', startTime),
        createMockEvent('GAME_END', endTime),
      ]);

      const timing = await service.getGameTiming('game-1');

      expect(timing.actualEnd).toEqual(endTime);
    });

    it('should compute firstHalfEnd from PERIOD_END with period="1"', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const halfEndTime = new Date('2024-01-01T10:30:00Z');
      setupQueryBuilder([
        createMockEvent('GAME_START', startTime),
        createMockEvent('PERIOD_END', halfEndTime, { period: '1' }),
      ]);

      const timing = await service.getGameTiming('game-1');

      expect(timing.firstHalfEnd).toEqual(halfEndTime);
    });

    it('should NOT set firstHalfEnd from PERIOD_END with period="2"', async () => {
      const endTime = new Date('2024-01-01T11:00:00Z');
      setupQueryBuilder([
        createMockEvent('PERIOD_END', endTime, { period: '2' }),
      ]);

      const timing = await service.getGameTiming('game-1');

      expect(timing.firstHalfEnd).toBeUndefined();
    });

    it('should compute secondHalfStart from PERIOD_START with period="2"', async () => {
      const secondHalfTime = new Date('2024-01-01T10:45:00Z');
      setupQueryBuilder([
        createMockEvent('PERIOD_START', secondHalfTime, { period: '2' }),
      ]);

      const timing = await service.getGameTiming('game-1');

      expect(timing.secondHalfStart).toEqual(secondHalfTime);
    });

    it('should set pausedAt when there is an unmatched STOPPAGE_START', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const pauseTime = new Date('2024-01-01T10:15:00Z');
      setupQueryBuilder([
        createMockEvent('GAME_START', startTime),
        createMockEvent('STOPPAGE_START', pauseTime),
      ]);

      const timing = await service.getGameTiming('game-1');

      expect(timing.pausedAt).toEqual(pauseTime);
    });

    it('should clear pausedAt when STOPPAGE_END follows STOPPAGE_START', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const pauseTime = new Date('2024-01-01T10:15:00Z');
      const resumeTime = new Date('2024-01-01T10:20:00Z');
      setupQueryBuilder([
        createMockEvent('GAME_START', startTime),
        createMockEvent('STOPPAGE_START', pauseTime),
        createMockEvent('STOPPAGE_END', resumeTime),
      ]);

      const timing = await service.getGameTiming('game-1');

      expect(timing.pausedAt).toBeUndefined();
    });

    it('should NOT set pausedAt after game has ended', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const pauseTime = new Date('2024-01-01T10:15:00Z');
      const endTime = new Date('2024-01-01T11:00:00Z');
      // Simulate: game started, paused, then ended (edge case)
      setupQueryBuilder([
        createMockEvent('GAME_START', startTime),
        createMockEvent('STOPPAGE_START', pauseTime),
        createMockEvent('GAME_END', endTime),
      ]);

      const timing = await service.getGameTiming('game-1');

      expect(timing.pausedAt).toBeUndefined();
      expect(timing.actualEnd).toEqual(endTime);
    });

    it('should compute full game timing from multiple events', async () => {
      const events = [
        createMockEvent('GAME_START', new Date('2024-01-01T10:00:00Z')),
        createMockEvent('PERIOD_START', new Date('2024-01-01T10:00:00Z'), {
          period: '1',
        }),
        createMockEvent('PERIOD_END', new Date('2024-01-01T10:30:00Z'), {
          period: '1',
        }),
        createMockEvent('PERIOD_START', new Date('2024-01-01T10:45:00Z'), {
          period: '2',
        }),
        createMockEvent('PERIOD_END', new Date('2024-01-01T11:15:00Z'), {
          period: '2',
        }),
        createMockEvent('GAME_END', new Date('2024-01-01T11:15:00Z')),
      ];
      setupQueryBuilder(events);

      const timing = await service.getGameTiming('game-1');

      expect(timing.actualStart).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(timing.firstHalfEnd).toEqual(new Date('2024-01-01T10:30:00Z'));
      expect(timing.secondHalfStart).toEqual(new Date('2024-01-01T10:45:00Z'));
      expect(timing.actualEnd).toEqual(new Date('2024-01-01T11:15:00Z'));
      expect(timing.pausedAt).toBeUndefined();
    });
  });

  describe('getGameTimingBatch', () => {
    const setupQueryBuilder = (events: Partial<GameEvent>[]) => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(events),
      };
      mockGameEventRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      return mockQueryBuilder;
    };

    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return empty map for empty input', async () => {
      const result = await service.getGameTimingBatch([]);

      expect(result.size).toBe(0);
    });

    it('should batch load timing for multiple games', async () => {
      const events = [
        {
          ...createMockEvent('GAME_START', new Date('2024-01-01T10:00:00Z')),
          gameId: 'game-1',
        },
        {
          ...createMockEvent('GAME_END', new Date('2024-01-01T11:00:00Z')),
          gameId: 'game-1',
        },
        {
          ...createMockEvent('GAME_START', new Date('2024-01-01T14:00:00Z')),
          gameId: 'game-2',
        },
      ];
      setupQueryBuilder(events);

      const result = await service.getGameTimingBatch(['game-1', 'game-2']);

      expect(result.size).toBe(2);
      expect(result.get('game-1')?.actualStart).toEqual(
        new Date('2024-01-01T10:00:00Z'),
      );
      expect(result.get('game-1')?.actualEnd).toEqual(
        new Date('2024-01-01T11:00:00Z'),
      );
      expect(result.get('game-2')?.actualStart).toEqual(
        new Date('2024-01-01T14:00:00Z'),
      );
      expect(result.get('game-2')?.actualEnd).toBeUndefined();
    });

    it('should return empty timing for games with no events', async () => {
      setupQueryBuilder([]);

      const result = await service.getGameTimingBatch(['game-1', 'game-2']);

      expect(result.size).toBe(2);
      expect(result.get('game-1')).toEqual({});
      expect(result.get('game-2')).toEqual({});
    });

    it('should make only one database query for multiple games', async () => {
      const queryBuilder = setupQueryBuilder([]);

      await service.getGameTimingBatch(['game-1', 'game-2', 'game-3']);

      // Should only call createQueryBuilder once
      expect(mockGameEventRepository.createQueryBuilder).toHaveBeenCalledTimes(
        1,
      );
      expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGameDurationSeconds', () => {
    const setupQueryBuilder = (events: Partial<GameEvent>[]) => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(events),
      };
      mockGameEventRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
    };

    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return 0 when game has not started', async () => {
      setupQueryBuilder([]);

      const duration = await service.getGameDurationSeconds('game-1');

      expect(duration).toBe(0);
    });

    it('should calculate duration for completed game', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T11:00:00Z'); // 1 hour = 3600 seconds
      setupQueryBuilder([
        createMockEvent('GAME_START', startTime),
        createMockEvent('GAME_END', endTime),
      ]);

      const duration = await service.getGameDurationSeconds('game-1');

      expect(duration).toBe(3600);
    });

    it('should calculate duration at halftime', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const halfEndTime = new Date('2024-01-01T10:30:00Z'); // 30 minutes = 1800 seconds
      setupQueryBuilder([
        createMockEvent('GAME_START', startTime),
        createMockEvent('PERIOD_END', halfEndTime, { period: '1' }),
      ]);

      const duration = await service.getGameDurationSeconds('game-1');

      expect(duration).toBe(1800);
    });
  });

  describe('isGamePaused', () => {
    const setupQueryBuilder = (events: Partial<GameEvent>[]) => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(events),
      };
      mockGameEventRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
    };

    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return false when game is not paused', async () => {
      setupQueryBuilder([createMockEvent('GAME_START', new Date())]);

      const isPaused = await service.isGamePaused('game-1');

      expect(isPaused).toBe(false);
    });

    it('should return true when game has unmatched STOPPAGE_START', async () => {
      setupQueryBuilder([
        createMockEvent('GAME_START', new Date('2024-01-01T10:00:00Z')),
        createMockEvent('STOPPAGE_START', new Date('2024-01-01T10:15:00Z')),
      ]);

      const isPaused = await service.isGamePaused('game-1');

      expect(isPaused).toBe(true);
    });

    it('should return false after STOPPAGE_END', async () => {
      setupQueryBuilder([
        createMockEvent('GAME_START', new Date('2024-01-01T10:00:00Z')),
        createMockEvent('STOPPAGE_START', new Date('2024-01-01T10:15:00Z')),
        createMockEvent('STOPPAGE_END', new Date('2024-01-01T10:20:00Z')),
      ]);

      const isPaused = await service.isGamePaused('game-1');

      expect(isPaused).toBe(false);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should throw error when database query fails', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      mockGameEventRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await expect(service.getGameTiming('game-1')).rejects.toThrow(
        'Database error',
      );
    });

    it('should return empty timing when no event types are cached', async () => {
      // Reset service with no event types
      mockEventTypeRepository.find.mockResolvedValue([]);
      await service.onModuleInit();

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockGameEventRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const timing = await service.getGameTiming('game-1');

      expect(timing).toEqual({});
    });
  });
});

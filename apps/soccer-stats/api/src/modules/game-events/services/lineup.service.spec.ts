import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { GameEvent } from '../../../entities/game-event.entity';
import { EventType } from '../../../entities/event-type.entity';
import { GameTeam } from '../../../entities/game-team.entity';

import { LineupService } from './lineup.service';
import { EventCoreService } from './event-core.service';

describe('LineupService', () => {
  let service: LineupService;
  let mockCoreService: jest.Mocked<EventCoreService>;
  let mockGameEventsRepository: jest.Mocked<Repository<GameEvent>>;
  let mockGameTeamsRepository: jest.Mocked<Repository<GameTeam>>;

  // Test data
  const mockGameTeamId = 'game-team-1';
  const mockGameId = 'game-1';
  const mockUserId = 'user-1';
  const mockPlayerId = 'player-1';
  const mockExternalPlayerName = 'External Player';

  const mockGameRosterEventType = {
    id: 'event-type-roster',
    name: 'GAME_ROSTER',
  } as EventType;

  const mockSubInEventType = {
    id: 'event-type-sub-in',
    name: 'SUBSTITUTION_IN',
  } as EventType;

  const mockSubOutEventType = {
    id: 'event-type-sub-out',
    name: 'SUBSTITUTION_OUT',
  } as EventType;

  const mockPeriodEndEventType = {
    id: 'event-type-period-end',
    name: 'PERIOD_END',
  } as EventType;

  const mockPositionSwapEventType = {
    id: 'event-type-position-swap',
    name: 'POSITION_SWAP',
  } as EventType;

  const mockPositionChangeEventType = {
    id: 'event-type-position-change',
    name: 'POSITION_CHANGE',
  } as EventType;

  const mockFormationChangeEventType = {
    id: 'event-type-formation-change',
    name: 'FORMATION_CHANGE',
  } as EventType;

  // Mock game team with team configuration for default formation
  const mockGameTeamWithConfig = {
    id: mockGameTeamId,
    gameId: mockGameId,
    formation: '4-3-3',
    team: {
      id: 'team-1',
      teamConfiguration: {
        defaultFormation: '4-4-2',
      },
    },
  } as GameTeam;

  // Mock game team without team configuration
  const mockGameTeamNoConfig = {
    id: mockGameTeamId,
    gameId: mockGameId,
    formation: null,
    team: {
      id: 'team-1',
      teamConfiguration: null,
    },
  } as GameTeam;

  const mockGameTeam = {
    id: mockGameTeamId,
    gameId: mockGameId,
    formation: '4-3-3',
  } as GameTeam;

  // Mock manager for query builder
  const mockManager = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    // Create mock repositories
    mockGameEventsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: mockManager,
    } as unknown as jest.Mocked<Repository<GameEvent>>;

    mockGameTeamsRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<GameTeam>>;

    // Create mock core service
    mockCoreService = {
      gameEventsRepository: mockGameEventsRepository,
      gameTeamsRepository: mockGameTeamsRepository,
      getEventTypeByName: jest.fn(),
      getGameTeam: jest.fn(),
      ensurePlayerInfoProvided: jest.fn(),
      publishGameEvent: jest.fn(),
    } as unknown as jest.Mocked<EventCoreService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineupService,
        { provide: EventCoreService, useValue: mockCoreService },
      ],
    }).compile();

    service = module.get<LineupService>(LineupService);

    jest.clearAllMocks();
  });

  describe('addPlayerToGameRoster', () => {
    const mockInput = {
      gameTeamId: mockGameTeamId,
      playerId: mockPlayerId,
      position: 'ST',
    };

    beforeEach(() => {
      mockCoreService.getGameTeam.mockResolvedValue(mockGameTeam);
      mockCoreService.getEventTypeByName.mockReturnValue(
        mockGameRosterEventType,
      );
      mockGameEventsRepository.findOne.mockResolvedValue(null); // No existing roster entry
    });

    it('should create a GAME_ROSTER event for internal player with playerId', async () => {
      const expectedEvent = {
        id: 'new-event-1',
        gameTeamId: mockGameTeamId,
        playerId: mockPlayerId,
        position: 'ST',
        eventTypeId: mockGameRosterEventType.id,
      } as GameEvent;

      mockGameEventsRepository.create.mockReturnValue(expectedEvent);
      mockGameEventsRepository.save.mockResolvedValue(expectedEvent);

      const result = await service.addPlayerToGameRoster(mockInput, mockUserId);

      expect(mockCoreService.ensurePlayerInfoProvided).toHaveBeenCalledWith(
        mockPlayerId,
        undefined,
        'game roster entry',
      );
      expect(mockCoreService.getGameTeam).toHaveBeenCalledWith(mockGameTeamId);
      expect(mockCoreService.getEventTypeByName).toHaveBeenCalledWith(
        'GAME_ROSTER',
      );
      expect(mockGameEventsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: mockGameId,
          gameTeamId: mockGameTeamId,
          eventTypeId: mockGameRosterEventType.id,
          playerId: mockPlayerId,
          position: 'ST',
          recordedByUserId: mockUserId,
        }),
      );
      expect(result).toBe(expectedEvent);
    });

    it('should create a GAME_ROSTER event for external player with name', async () => {
      const externalInput = {
        gameTeamId: mockGameTeamId,
        externalPlayerName: mockExternalPlayerName,
        externalPlayerNumber: '10',
      };

      const expectedEvent = {
        id: 'new-event-2',
        gameTeamId: mockGameTeamId,
        externalPlayerName: mockExternalPlayerName,
        externalPlayerNumber: '10',
        eventTypeId: mockGameRosterEventType.id,
      } as GameEvent;

      mockGameEventsRepository.create.mockReturnValue(expectedEvent);
      mockGameEventsRepository.save.mockResolvedValue(expectedEvent);

      const result = await service.addPlayerToGameRoster(
        externalInput,
        mockUserId,
      );

      expect(mockGameEventsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          externalPlayerName: mockExternalPlayerName,
          externalPlayerNumber: '10',
          position: undefined,
        }),
      );
      expect(result).toBe(expectedEvent);
    });

    it('should create roster entry without position (bench player)', async () => {
      const benchInput = {
        gameTeamId: mockGameTeamId,
        playerId: mockPlayerId,
        // No position = bench player
      };

      const expectedEvent = {
        id: 'new-event-3',
        playerId: mockPlayerId,
        position: undefined,
      } as GameEvent;

      mockGameEventsRepository.create.mockReturnValue(expectedEvent);
      mockGameEventsRepository.save.mockResolvedValue(expectedEvent);

      const result = await service.addPlayerToGameRoster(
        benchInput,
        mockUserId,
      );

      expect(mockGameEventsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          position: undefined,
        }),
      );
      expect(result).toBe(expectedEvent);
    });

    it('should throw BadRequestException when player is already in game roster', async () => {
      const existingEvent = {
        id: 'existing-event',
        playerId: mockPlayerId,
        eventTypeId: mockGameRosterEventType.id,
      } as GameEvent;

      mockGameEventsRepository.findOne.mockResolvedValue(existingEvent);

      await expect(
        service.addPlayerToGameRoster(mockInput, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addPlayerToGameRoster(mockInput, mockUserId),
      ).rejects.toThrow('Player is already in the game roster');
    });

    it('should throw BadRequestException when external player name is already in roster', async () => {
      const externalInput = {
        gameTeamId: mockGameTeamId,
        externalPlayerName: mockExternalPlayerName,
      };

      const existingEvent = {
        id: 'existing-event',
        externalPlayerName: mockExternalPlayerName,
        eventTypeId: mockGameRosterEventType.id,
      } as GameEvent;

      mockGameEventsRepository.findOne.mockResolvedValue(existingEvent);

      await expect(
        service.addPlayerToGameRoster(externalInput, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call ensurePlayerInfoProvided which throws when neither playerId nor externalPlayerName provided', async () => {
      const invalidInput = {
        gameTeamId: mockGameTeamId,
        // Neither playerId nor externalPlayerName
      };

      mockCoreService.ensurePlayerInfoProvided.mockImplementation(() => {
        throw new BadRequestException(
          'Either playerId or externalPlayerName must be provided for this game roster entry',
        );
      });

      await expect(
        service.addPlayerToGameRoster(invalidInput, mockUserId),
      ).rejects.toThrow(BadRequestException);
      expect(mockCoreService.ensurePlayerInfoProvided).toHaveBeenCalled();
    });
  });

  describe('getGameLineup', () => {
    beforeEach(() => {
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeam);
    });

    it('should throw NotFoundException when game team not found', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(null);

      await expect(service.getGameLineup('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty arrays when no events exist', async () => {
      mockGameEventsRepository.find.mockResolvedValue([]);

      const result = await service.getGameLineup(mockGameTeamId);

      expect(result.gameRoster).toEqual([]);
      expect(result.bench).toEqual([]);
      expect(result.starters).toEqual([]);
      expect(result.currentOnField).toEqual([]);
      expect(result.previousPeriodLineup).toBeUndefined();
    });

    it('should populate gameRoster from GAME_ROSTER events', async () => {
      const rosterEvents = [
        createMockEvent('evt-1', mockGameRosterEventType, {
          playerId: 'player-1',
          position: 'ST',
        }),
        createMockEvent('evt-2', mockGameRosterEventType, {
          playerId: 'player-2',
          position: 'GK',
        }),
        createMockEvent('evt-3', mockGameRosterEventType, {
          externalPlayerName: 'External 1',
        }),
      ];

      mockGameEventsRepository.find.mockResolvedValue(rosterEvents);

      const result = await service.getGameLineup(mockGameTeamId);

      expect(result.gameRoster).toHaveLength(3);
      expect(result.gameRoster[0].playerId).toBe('player-1');
      expect(result.gameRoster[1].playerId).toBe('player-2');
      expect(result.gameRoster[2].externalPlayerName).toBe('External 1');
    });

    it('should compute bench as gameRoster minus currentOnField', async () => {
      // Setup: 3 players on roster, 2 subbed in (on field), 1 remains on bench
      const events = [
        createMockEvent('roster-1', mockGameRosterEventType, {
          playerId: 'player-1',
          position: 'ST',
        }),
        createMockEvent('roster-2', mockGameRosterEventType, {
          playerId: 'player-2',
          position: 'GK',
        }),
        createMockEvent('roster-3', mockGameRosterEventType, {
          playerId: 'player-3',
        }), // bench
        createMockEvent('sub-in-1', mockSubInEventType, {
          playerId: 'player-1',
          position: 'ST',
          period: '1',
          periodSecond: 0,
        }),
        createMockEvent('sub-in-2', mockSubInEventType, {
          playerId: 'player-2',
          position: 'GK',
          period: '1',
          periodSecond: 0,
        }),
      ];

      mockGameEventsRepository.find.mockResolvedValue(events);

      const result = await service.getGameLineup(mockGameTeamId);

      expect(result.gameRoster).toHaveLength(3);
      expect(result.currentOnField).toHaveLength(2);
      expect(result.bench).toHaveLength(1);
      expect(result.bench[0].playerId).toBe('player-3');
    });

    it('should track starters as period 1, second 0 SUB_IN events', async () => {
      const events = [
        createMockEvent('roster-1', mockGameRosterEventType, {
          playerId: 'player-1',
        }),
        createMockEvent('roster-2', mockGameRosterEventType, {
          playerId: 'player-2',
        }),
        createMockEvent('sub-in-1', mockSubInEventType, {
          playerId: 'player-1',
          position: 'ST',
          period: '1',
          periodSecond: 0,
        }),
        createMockEvent('sub-in-2', mockSubInEventType, {
          playerId: 'player-2',
          position: 'CM',
          period: '1',
          periodSecond: 300, // Not a starter (not at second 0)
        }),
      ];

      mockGameEventsRepository.find.mockResolvedValue(events);

      const result = await service.getGameLineup(mockGameTeamId);

      expect(result.starters).toHaveLength(1);
      expect(result.starters[0].playerId).toBe('player-1');
    });

    it('should update currentOnField when player is subbed out', async () => {
      const events = [
        createMockEvent('roster-1', mockGameRosterEventType, {
          playerId: 'player-1',
        }),
        createMockEvent('sub-in-1', mockSubInEventType, {
          playerId: 'player-1',
          position: 'ST',
          period: '1',
          periodSecond: 0,
        }),
        createMockEvent('sub-out-1', mockSubOutEventType, {
          playerId: 'player-1',
          position: 'ST',
          period: '1',
          periodSecond: 1200,
        }),
      ];

      mockGameEventsRepository.find.mockResolvedValue(events);

      const result = await service.getGameLineup(mockGameTeamId);

      expect(result.currentOnField).toHaveLength(0);
      expect(result.bench).toHaveLength(1);
      expect(result.bench[0].playerId).toBe('player-1');
    });

    it('should preserve last known position for bench players from SUB_OUT events', async () => {
      const events = [
        createMockEvent('roster-1', mockGameRosterEventType, {
          playerId: 'player-1',
          position: 'ST',
        }),
        createMockEvent('sub-in-1', mockSubInEventType, {
          playerId: 'player-1',
          position: 'ST',
          period: '1',
          periodSecond: 0,
        }),
        createMockEvent('sub-out-1', mockSubOutEventType, {
          playerId: 'player-1',
          position: 'CF', // Changed position before coming off
          period: '1',
          periodSecond: 1200,
        }),
      ];

      mockGameEventsRepository.find.mockResolvedValue(events);

      const result = await service.getGameLineup(mockGameTeamId);

      expect(result.bench[0].position).toBe('CF'); // Last known position from SUB_OUT
    });

    it('should populate previousPeriodLineup from SUB_OUT events linked to PERIOD_END', async () => {
      const periodEndEvent = createMockEvent(
        'period-end-1',
        mockPeriodEndEventType,
        {
          period: '1',
        },
      );
      const subOut1 = createMockEvent(
        'sub-out-period-end-1',
        mockSubOutEventType,
        {
          playerId: 'player-1',
          position: 'ST',
        },
      );
      subOut1.parentEventId = periodEndEvent.id;

      const subOut2 = createMockEvent(
        'sub-out-period-end-2',
        mockSubOutEventType,
        {
          playerId: 'player-2',
          position: 'GK',
        },
      );
      subOut2.parentEventId = periodEndEvent.id;

      const events = [
        createMockEvent('roster-1', mockGameRosterEventType, {
          playerId: 'player-1',
        }),
        createMockEvent('roster-2', mockGameRosterEventType, {
          playerId: 'player-2',
        }),
        createMockEvent('sub-in-1', mockSubInEventType, {
          playerId: 'player-1',
          position: 'ST',
          period: '1',
          periodSecond: 0,
        }),
        createMockEvent('sub-in-2', mockSubInEventType, {
          playerId: 'player-2',
          position: 'GK',
          period: '1',
          periodSecond: 0,
        }),
        periodEndEvent,
        subOut1,
        subOut2,
      ];

      mockGameEventsRepository.find.mockResolvedValue(events);

      const result = await service.getGameLineup(mockGameTeamId);

      expect(result.previousPeriodLineup).toBeDefined();
      expect(result.previousPeriodLineup).toHaveLength(2);
    });
  });

  describe('removeFromLineup', () => {
    it('should throw NotFoundException when event not found', async () => {
      mockGameEventsRepository.findOne.mockResolvedValue(null);

      await expect(service.removeFromLineup('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should remove GAME_ROSTER events', async () => {
      const rosterEvent = createMockEvent('roster-1', mockGameRosterEventType, {
        playerId: 'player-1',
      });
      mockGameEventsRepository.findOne.mockResolvedValue(rosterEvent);
      mockGameEventsRepository.remove.mockResolvedValue(rosterEvent);

      const result = await service.removeFromLineup('roster-1');

      expect(result).toBe(true);
      expect(mockGameEventsRepository.remove).toHaveBeenCalledWith(rosterEvent);
    });

    it('should remove SUBSTITUTION_IN events', async () => {
      const subInEvent = createMockEvent('sub-in-1', mockSubInEventType, {
        playerId: 'player-1',
      });
      mockGameEventsRepository.findOne.mockResolvedValue(subInEvent);
      mockGameEventsRepository.remove.mockResolvedValue(subInEvent);

      const result = await service.removeFromLineup('sub-in-1');

      expect(result).toBe(true);
    });

    it('should throw BadRequestException for non-lineup event types', async () => {
      const goalEventType = { id: 'goal-type', name: 'GOAL' } as EventType;
      const goalEvent = createMockEvent('goal-1', goalEventType, {
        playerId: 'player-1',
      });
      mockGameEventsRepository.findOne.mockResolvedValue(goalEvent);

      await expect(service.removeFromLineup('goal-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removeFromLineup('goal-1')).rejects.toThrow(
        'Can only remove game roster/substitution events',
      );
    });
  });

  describe('updatePlayerPosition', () => {
    it('should throw NotFoundException when event not found', async () => {
      mockGameEventsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePlayerPosition('non-existent', 'CM'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update position and save event', async () => {
      const gameEvent = createMockEvent('evt-1', mockGameRosterEventType, {
        playerId: 'player-1',
        position: 'ST',
      });
      const savedEvent = { ...gameEvent, position: 'CM' } as GameEvent;

      mockGameEventsRepository.findOne.mockResolvedValue(gameEvent);
      mockGameEventsRepository.save.mockResolvedValue(savedEvent);

      const result = await service.updatePlayerPosition('evt-1', 'CM');

      expect(gameEvent.position).toBe('CM');
      expect(mockGameEventsRepository.save).toHaveBeenCalledWith(gameEvent);
      expect(result).toBe(savedEvent);
    });

    it('should publish UPDATED event after saving', async () => {
      const gameEvent = createMockEvent('evt-1', mockGameRosterEventType, {
        playerId: 'player-1',
        position: 'ST',
      });
      const savedEvent = { ...gameEvent, position: 'CM' } as GameEvent;

      mockGameEventsRepository.findOne.mockResolvedValue(gameEvent);
      mockGameEventsRepository.save.mockResolvedValue(savedEvent);

      await service.updatePlayerPosition('evt-1', 'CM');

      expect(mockCoreService.publishGameEvent).toHaveBeenCalledWith(
        mockGameId,
        'UPDATED',
        savedEvent,
      );
    });
  });

  describe('getGameRoster', () => {
    // Helper to create a mock query builder chain
    function createMockQueryBuilder(
      rawResults: unknown[] = [],
    ): jest.Mocked<SelectQueryBuilder<GameEvent>> {
      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(rawResults),
        getRawOne: jest.fn().mockResolvedValue(null),
      } as unknown as jest.Mocked<SelectQueryBuilder<GameEvent>>;
      return mockQb;
    }

    beforeEach(() => {
      // Setup gameTeam mock - default to team with configuration
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeamWithConfig);

      // Setup event type mocks
      mockCoreService.getEventTypeByName.mockImplementation((name: string) => {
        switch (name) {
          case 'GAME_ROSTER':
            return mockGameRosterEventType;
          case 'SUBSTITUTION_IN':
            return mockSubInEventType;
          case 'SUBSTITUTION_OUT':
            return mockSubOutEventType;
          case 'POSITION_SWAP':
            return mockPositionSwapEventType;
          case 'POSITION_CHANGE':
            return mockPositionChangeEventType;
          case 'FORMATION_CHANGE':
            return mockFormationChangeEventType;
          case 'PERIOD_END':
            return mockPeriodEndEventType;
          default:
            throw new Error(`Unknown event type: ${name}`);
        }
      });
    });

    it('should fall back to team default formation when no FORMATION_CHANGE events exist', async () => {
      const mockQb = createMockQueryBuilder([]);
      const mockFormationQb = createMockQueryBuilder([]);

      // Mock manager.createQueryBuilder for the window function query
      mockManager.createQueryBuilder.mockReturnValue(mockQb);

      // Mock repository.createQueryBuilder for the formation query
      mockGameEventsRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockFormationQb);

      // Mock repository.findOne for period end check
      mockGameEventsRepository.findOne.mockResolvedValue(null);

      const result = await service.getGameRoster(mockGameTeamId);

      expect(result.gameTeamId).toBe(mockGameTeamId);
      expect(result.players).toEqual([]);
      // Falls back to team's default formation from teamConfiguration
      expect(result.formation).toBe('4-4-2');
      expect(result.previousPeriodLineup).toBeUndefined();
    });

    it('should return null formation when no events and team has no default formation', async () => {
      // Override to use team without configuration
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeamNoConfig);

      const mockQb = createMockQueryBuilder([]);
      const mockFormationQb = createMockQueryBuilder([]);

      mockManager.createQueryBuilder.mockReturnValue(mockQb);
      mockGameEventsRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockFormationQb);
      mockGameEventsRepository.findOne.mockResolvedValue(null);

      const result = await service.getGameRoster(mockGameTeamId);

      expect(result.gameTeamId).toBe(mockGameTeamId);
      expect(result.formation).toBeNull();
    });

    it('should return players with positions from query results', async () => {
      const rawPlayers = [
        {
          gameEventId: 'evt-1',
          playerId: 'player-1',
          firstName: 'John',
          lastName: 'Doe',
          externalPlayerName: null,
          externalPlayerNumber: null,
          position: 'ST',
        },
        {
          gameEventId: 'evt-2',
          playerId: 'player-2',
          firstName: 'Jane',
          lastName: 'Smith',
          externalPlayerName: null,
          externalPlayerNumber: null,
          position: 'GK',
        },
      ];

      const mockQb = createMockQueryBuilder(rawPlayers);
      const mockFormationQb = createMockQueryBuilder([]);

      mockManager.createQueryBuilder.mockReturnValue(mockQb);

      mockGameEventsRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockFormationQb);

      mockGameEventsRepository.findOne.mockResolvedValue(null);

      const result = await service.getGameRoster(mockGameTeamId);

      expect(result.players).toHaveLength(2);
      expect(result.players[0]).toEqual({
        gameEventId: 'evt-1',
        playerId: 'player-1',
        firstName: 'John',
        lastName: 'Doe',
        externalPlayerName: null,
        externalPlayerNumber: null,
        position: 'ST',
        playerName: 'John Doe',
      });
      expect(result.players[1].position).toBe('GK');
    });

    it('should return null position for bench players (after SUBSTITUTION_OUT)', async () => {
      // Window function returns latest state, which for subbed out players has null position
      const rawPlayers = [
        {
          gameEventId: 'evt-1',
          playerId: 'player-1',
          firstName: 'John',
          lastName: 'Doe',
          externalPlayerName: null,
          externalPlayerNumber: null,
          position: null, // Subbed out = bench
        },
      ];

      const mockQb = createMockQueryBuilder(rawPlayers);
      const mockFormationQb = createMockQueryBuilder([]);

      mockManager.createQueryBuilder.mockReturnValue(mockQb);

      mockGameEventsRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockFormationQb);

      mockGameEventsRepository.findOne.mockResolvedValue(null);

      const result = await service.getGameRoster(mockGameTeamId);

      expect(result.players).toHaveLength(1);
      expect(result.players[0].position).toBeNull();
    });

    it('should return latest formation from FORMATION_CHANGE events', async () => {
      const mockQb = createMockQueryBuilder([]);
      const mockFormationQb = createMockQueryBuilder([]);
      mockFormationQb.getRawOne = jest
        .fn()
        .mockResolvedValue({ formation: '4-3-3' });

      mockManager.createQueryBuilder.mockReturnValue(mockQb);

      mockGameEventsRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockFormationQb);

      mockGameEventsRepository.findOne.mockResolvedValue(null);

      const result = await service.getGameRoster(mockGameTeamId);

      expect(result.formation).toBe('4-3-3');
    });

    it('should handle external players correctly', async () => {
      const rawPlayers = [
        {
          gameEventId: 'evt-1',
          playerId: null,
          firstName: null,
          lastName: null,
          externalPlayerName: 'Guest Player',
          externalPlayerNumber: '99',
          position: 'LW',
        },
      ];

      const mockQb = createMockQueryBuilder(rawPlayers);
      const mockFormationQb = createMockQueryBuilder([]);

      mockManager.createQueryBuilder.mockReturnValue(mockQb);

      mockGameEventsRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockFormationQb);

      mockGameEventsRepository.findOne.mockResolvedValue(null);

      const result = await service.getGameRoster(mockGameTeamId);

      expect(result.players).toHaveLength(1);
      expect(result.players[0].externalPlayerName).toBe('Guest Player');
      expect(result.players[0].externalPlayerNumber).toBe('99');
      expect(result.players[0].playerId).toBeNull();
      expect(result.players[0].playerName).toBeUndefined();
    });

    it('should populate previousPeriodLineup from PERIOD_END event children', async () => {
      const mockQb = createMockQueryBuilder([]);
      const mockFormationQb = createMockQueryBuilder([]);

      mockManager.createQueryBuilder.mockReturnValue(mockQb);

      mockGameEventsRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockFormationQb);

      // Mock period end event
      const periodEndEvent = createMockEvent(
        'period-end-1',
        mockPeriodEndEventType,
        { period: '1' },
      );

      // First findOne call returns period end event, others return null
      mockGameEventsRepository.findOne.mockResolvedValueOnce(periodEndEvent);

      // Mock find for SUB_OUT events linked to period end
      const subOutEvents = [
        createMockEvent('sub-out-1', mockSubOutEventType, {
          playerId: 'player-1',
          position: 'ST',
          parentEventId: periodEndEvent.id,
        }),
        createMockEvent('sub-out-2', mockSubOutEventType, {
          playerId: 'player-2',
          position: 'GK',
          parentEventId: periodEndEvent.id,
        }),
      ];
      mockGameEventsRepository.find.mockResolvedValue(subOutEvents);

      const result = await service.getGameRoster(mockGameTeamId);

      expect(result.previousPeriodLineup).toBeDefined();
      expect(result.previousPeriodLineup).toHaveLength(2);
      expect(result.previousPeriodLineup![0].position).toBe('ST');
      expect(result.previousPeriodLineup![1].position).toBe('GK');
    });
  });

  // Helper function to create mock events
  function createMockEvent(
    id: string,
    eventType: EventType,
    overrides: Partial<GameEvent> = {},
  ): GameEvent {
    return {
      id,
      gameId: mockGameId,
      gameTeamId: mockGameTeamId,
      eventTypeId: eventType.id,
      eventType,
      playerId: undefined,
      externalPlayerName: undefined,
      externalPlayerNumber: undefined,
      position: undefined,
      period: undefined,
      periodSecond: 0,
      parentEventId: undefined,
      createdAt: new Date(),
      player: overrides.playerId
        ? {
            id: overrides.playerId,
            firstName: `First-${overrides.playerId}`,
            lastName: `Last-${overrides.playerId}`,
            email: `${overrides.playerId}@test.com`,
          }
        : undefined,
      ...overrides,
    } as GameEvent;
  }
});

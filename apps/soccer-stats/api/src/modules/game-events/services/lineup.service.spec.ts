import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

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

  const mockGameTeam = {
    id: mockGameTeamId,
    gameId: mockGameId,
    formation: '4-3-3',
  } as GameTeam;

  beforeEach(async () => {
    // Create mock repositories
    mockGameEventsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
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

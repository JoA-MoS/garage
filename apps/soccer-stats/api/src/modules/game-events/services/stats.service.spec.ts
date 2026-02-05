import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { GameEvent } from '../../../entities/game-event.entity';
import { Game } from '../../../entities/game.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { Team } from '../../../entities/team.entity';
import { EventType } from '../../../entities/event-type.entity';
import { GameTimingService } from '../../games/game-timing.service';

import { StatsService } from './stats.service';
import { EventCoreService } from './event-core.service';

describe('StatsService', () => {
  let service: StatsService;
  let mockCoreService: jest.Mocked<EventCoreService>;
  let mockGameTimingService: jest.Mocked<GameTimingService>;
  let mockGameEventsRepository: jest.Mocked<Repository<GameEvent>>;
  let mockGameTeamsRepository: jest.Mocked<Repository<GameTeam>>;
  let mockGamesRepository: jest.Mocked<Repository<Game>>;
  let mockTeamsRepository: jest.Mocked<Repository<Team>>;

  // Test data
  const mockGameTeamId = 'game-team-1';
  const mockGameId = 'game-1';
  const mockTeamId = 'team-1';

  const mockSubInEventType = {
    id: 'event-type-sub-in',
    name: 'SUBSTITUTION_IN',
  } as EventType;

  const mockSubOutEventType = {
    id: 'event-type-sub-out',
    name: 'SUBSTITUTION_OUT',
  } as EventType;

  const mockGoalEventType = {
    id: 'event-type-goal',
    name: 'GOAL',
  } as EventType;

  const mockGameTeam = {
    id: mockGameTeamId,
    gameId: mockGameId,
    teamId: mockTeamId,
  } as GameTeam;

  const mockGame = {
    id: mockGameId,
    format: { durationMinutes: 60 },
  } as Game;

  const mockTeam = {
    id: mockTeamId,
    name: 'Test Team',
  } as Team;

  const mockPeriodTiming = {
    period1DurationSeconds: 1800,
    period2DurationSeconds: 0,
    currentPeriod: '1',
    currentPeriodSeconds: 600,
    serverTimestamp: Date.now(),
  };

  beforeEach(async () => {
    // Create mock repositories
    mockGameEventsRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<GameEvent>>;

    mockGameTeamsRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<GameTeam>>;

    mockGamesRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Game>>;

    mockTeamsRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Team>>;

    // Create mock core service
    mockCoreService = {
      gameEventsRepository: mockGameEventsRepository,
      gameTeamsRepository: mockGameTeamsRepository,
      gamesRepository: mockGamesRepository,
      teamsRepository: mockTeamsRepository,
    } as unknown as jest.Mocked<EventCoreService>;

    // Create mock timing service
    mockGameTimingService = {
      getPeriodTimingInfo: jest.fn().mockResolvedValue(mockPeriodTiming),
    } as unknown as jest.Mocked<GameTimingService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: EventCoreService, useValue: mockCoreService },
        { provide: GameTimingService, useValue: mockGameTimingService },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  describe('getPlayerStatsByGameTeamId', () => {
    it('should throw NotFoundException when gameTeam not found', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPlayerStatsByGameTeamId('invalid-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getPlayerStatsByGameTeamId('invalid-id'),
      ).rejects.toThrow('GameTeam invalid-id not found');
    });

    it('should lookup gameTeam to get teamId and gameId', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeam);

      // We don't need to fully test getPlayerStats here - just verify the lookup
      // Mock teams repository to throw so we can verify the lookup happened
      mockTeamsRepository.findOne.mockResolvedValue(null);

      // This will throw NotFoundException from getPlayerStats, but that's expected
      // We're just verifying the gameTeam lookup works
      await expect(
        service.getPlayerStatsByGameTeamId(mockGameTeamId),
      ).rejects.toThrow(NotFoundException);

      expect(mockGameTeamsRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockGameTeamId },
      });
    });
  });

  describe('getPlayerPositionStats', () => {
    it('should throw NotFoundException when gameTeam not found', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPlayerPositionStats('invalid-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getPlayerPositionStats('invalid-id'),
      ).rejects.toThrow('GameTeam invalid-id not found');
    });

    it('should throw NotFoundException when game not found', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeam);
      mockGamesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPlayerPositionStats(mockGameTeamId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getPlayerPositionStats(mockGameTeamId),
      ).rejects.toThrow('Game not found');
    });

    it('should return empty array when no events exist', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeam);
      mockGamesRepository.findOne.mockResolvedValue(mockGame);
      mockGameEventsRepository.find.mockResolvedValue([]);

      const result = await service.getPlayerPositionStats(mockGameTeamId);

      expect(result).toEqual([]);
    });

    it('should calculate player time from SUB_IN to current time', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeam);
      mockGamesRepository.findOne.mockResolvedValue(mockGame);

      // Player subbed in at 300 seconds, current time is 600 seconds
      const subInEvent = {
        id: 'event-1',
        playerId: 'player-1',
        period: '1',
        periodSecond: 300,
        position: 'FW',
        eventType: mockSubInEventType,
        player: { id: 'player-1', firstName: 'John', lastName: 'Doe' },
        createdAt: new Date('2024-01-01T00:00:00Z'),
      } as unknown as GameEvent;

      mockGameEventsRepository.find.mockResolvedValue([subInEvent]);

      const result = await service.getPlayerPositionStats(mockGameTeamId);

      expect(result).toHaveLength(1);
      expect(result[0].playerId).toBe('player-1');
      // Player was on field for 300 seconds (600 - 300)
      expect(result[0].totalMinutes).toBe(5);
      expect(result[0].totalSeconds).toBe(0);
    });

    it('should calculate player time from SUB_IN to SUB_OUT', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeam);
      mockGamesRepository.findOne.mockResolvedValue(mockGame);

      const subInEvent = {
        id: 'event-1',
        playerId: 'player-1',
        period: '1',
        periodSecond: 100,
        position: 'MF',
        eventType: mockSubInEventType,
        player: { id: 'player-1', firstName: 'Jane', lastName: 'Smith' },
        createdAt: new Date('2024-01-01T00:00:00Z'),
      } as unknown as GameEvent;

      const subOutEvent = {
        id: 'event-2',
        playerId: 'player-1',
        period: '1',
        periodSecond: 400,
        position: 'MF',
        eventType: mockSubOutEventType,
        player: { id: 'player-1', firstName: 'Jane', lastName: 'Smith' },
        createdAt: new Date('2024-01-01T00:05:00Z'),
      } as unknown as GameEvent;

      mockGameEventsRepository.find.mockResolvedValue([
        subInEvent,
        subOutEvent,
      ]);

      const result = await service.getPlayerPositionStats(mockGameTeamId);

      expect(result).toHaveLength(1);
      expect(result[0].playerId).toBe('player-1');
      // Player was on field for 300 seconds (400 - 100)
      expect(result[0].totalMinutes).toBe(5);
      expect(result[0].totalSeconds).toBe(0);
    });

    it('should track multiple position times for position changes', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeam);
      mockGamesRepository.findOne.mockResolvedValue(mockGame);

      // Player starts at FW at 0, switches to MF at 300, current time 600
      const subInEvent = {
        id: 'event-1',
        playerId: 'player-1',
        period: '1',
        periodSecond: 0,
        position: 'FW',
        eventType: mockSubInEventType,
        player: { id: 'player-1', firstName: 'Test', lastName: 'Player' },
        createdAt: new Date('2024-01-01T00:00:00Z'),
      } as unknown as GameEvent;

      const positionChangeEvent = {
        id: 'event-2',
        playerId: 'player-1',
        period: '1',
        periodSecond: 300,
        position: 'MF',
        eventType: { id: 'event-type-pos-change', name: 'POSITION_CHANGE' },
        player: { id: 'player-1', firstName: 'Test', lastName: 'Player' },
        createdAt: new Date('2024-01-01T00:05:00Z'),
      } as unknown as GameEvent;

      mockGameEventsRepository.find.mockResolvedValue([
        subInEvent,
        positionChangeEvent,
      ]);

      const result = await service.getPlayerPositionStats(mockGameTeamId);

      expect(result).toHaveLength(1);
      expect(result[0].positionTimes).toHaveLength(2);

      // FW for 300 seconds (0-300)
      const fwTime = result[0].positionTimes.find((pt) => pt.position === 'FW');
      expect(fwTime).toBeDefined();
      expect(fwTime!.minutes).toBe(5);
      expect(fwTime!.seconds).toBe(0);

      // MF for 300 seconds (300-600)
      const mfTime = result[0].positionTimes.find((pt) => pt.position === 'MF');
      expect(mfTime).toBeDefined();
      expect(mfTime!.minutes).toBe(5);
      expect(mfTime!.seconds).toBe(0);
    });

    it('should sort events by period then by periodSecond', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(mockGameTeam);
      mockGamesRepository.findOne.mockResolvedValue(mockGame);

      // Events in wrong order - should be sorted
      const event2 = {
        id: 'event-2',
        playerId: 'player-1',
        period: '1',
        periodSecond: 500,
        position: 'FW',
        eventType: mockSubOutEventType,
        player: { id: 'player-1', firstName: 'Test', lastName: 'Player' },
        createdAt: new Date('2024-01-01T00:08:00Z'),
      } as unknown as GameEvent;

      const event1 = {
        id: 'event-1',
        playerId: 'player-1',
        period: '1',
        periodSecond: 100,
        position: 'FW',
        eventType: mockSubInEventType,
        player: { id: 'player-1', firstName: 'Test', lastName: 'Player' },
        createdAt: new Date('2024-01-01T00:01:40Z'),
      } as unknown as GameEvent;

      // Return events in wrong order
      mockGameEventsRepository.find.mockResolvedValue([event2, event1]);

      const result = await service.getPlayerPositionStats(mockGameTeamId);

      expect(result).toHaveLength(1);
      // Player was on field for 400 seconds (500 - 100)
      expect(result[0].totalMinutes).toBe(6);
      expect(result[0].totalSeconds).toBe(40);
    });
  });
});

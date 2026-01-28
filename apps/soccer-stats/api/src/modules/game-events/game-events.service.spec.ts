import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { GameEvent } from '../../entities/game-event.entity';

import { GameEventsService } from './game-events.service';
import {
  EventCoreService,
  LineupService,
  GoalService,
  SubstitutionService,
  StatsService,
  PeriodService,
  EventManagementService,
} from './services';

describe('GameEventsService', () => {
  let service: GameEventsService;
  let periodService: jest.Mocked<PeriodService>;
  let lineupService: jest.Mocked<LineupService>;

  // Mock specialized services
  const mockEventCoreService = {
    onModuleInit: jest.fn(),
    getEventTypeByName: jest.fn(),
    getGameTeam: jest.fn(),
    ensurePlayerInfoProvided: jest.fn(),
    publishGameEvent: jest.fn(),
    checkForDuplicateOrConflict: jest.fn(),
    buildConflictInfo: jest.fn(),
    getPlayerNameFromEvent: jest.fn(),
    getRecordedByUserName: jest.fn(),
    gameEventsRepository: {},
    eventTypesRepository: {},
    gameTeamsRepository: {},
    gamesRepository: {},
    teamsRepository: {},
  };

  const mockLineupService = {
    addPlayerToLineup: jest.fn(),
    addPlayerToBench: jest.fn(),
    removeFromLineup: jest.fn(),
    updatePlayerPosition: jest.fn(),
    getGameLineup: jest.fn(),
    findEventsByGameTeam: jest.fn(),
    findOne: jest.fn(),
  };

  const mockGoalService = {
    recordGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
  };

  const mockSubstitutionService = {
    substitutePlayer: jest.fn(),
    bringPlayerOntoField: jest.fn(),
    removePlayerFromField: jest.fn(),
    deleteSubstitution: jest.fn(),
    deleteStarterEntry: jest.fn(),
    createSubstitutionOutForAllOnField: jest.fn(),
    batchLineupChanges: jest.fn(),
  };

  const mockStatsService = {
    getPlayerPositionStats: jest.fn(),
    getPlayerStats: jest.fn(),
  };

  const mockPeriodService = {
    startPeriod: jest.fn(),
    endPeriod: jest.fn(),
    setSecondHalfLineup: jest.fn(),
    ensureSecondHalfLineupExists: jest.fn(),
    linkOrphanSubInsToSecondHalfPeriodStart: jest.fn(),
    linkFirstHalfStartersToPeriodStart: jest.fn(),
  };

  const mockEventManagementService = {
    recordFormationChange: jest.fn(),
    recordPositionChange: jest.fn(),
    swapPositions: jest.fn(),
    deletePositionSwap: jest.fn(),
    findDependentEvents: jest.fn(),
    deleteEventWithCascade: jest.fn(),
    resolveEventConflict: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameEventsService,
        { provide: EventCoreService, useValue: mockEventCoreService },
        { provide: LineupService, useValue: mockLineupService },
        { provide: GoalService, useValue: mockGoalService },
        { provide: SubstitutionService, useValue: mockSubstitutionService },
        { provide: StatsService, useValue: mockStatsService },
        { provide: PeriodService, useValue: mockPeriodService },
        {
          provide: EventManagementService,
          useValue: mockEventManagementService,
        },
      ],
    }).compile();

    service = module.get<GameEventsService>(GameEventsService);
    periodService = module.get(PeriodService);
    lineupService = module.get(LineupService);

    jest.clearAllMocks();
  });

  describe('setSecondHalfLineup', () => {
    const mockGameTeamId = 'game-team-1';
    const mockUserId = 'user-1';

    // New lineup for second half
    const mockSecondHalfLineup = [
      { playerId: 'player-1', position: 'CM' },
      { playerId: 'player-4', position: 'ST' },
      { playerId: 'player-3', position: 'GK' },
    ];

    const mockResult = {
      substitutionsOut: 0,
      substitutionsIn: 3,
      events: [] as GameEvent[],
    };

    beforeEach(() => {
      mockPeriodService.setSecondHalfLineup.mockResolvedValue(mockResult);
    });

    it('should delegate to periodService.setSecondHalfLineup', async () => {
      const input = {
        gameTeamId: mockGameTeamId,
        lineup: mockSecondHalfLineup,
      };

      const result = await service.setSecondHalfLineup(input, mockUserId);

      expect(periodService.setSecondHalfLineup).toHaveBeenCalledWith(
        input,
        mockUserId,
      );
      expect(result).toBe(mockResult);
    });

    it('should propagate BadRequestException from periodService', async () => {
      mockPeriodService.setSecondHalfLineup.mockRejectedValue(
        new BadRequestException('Game is not in HALFTIME status'),
      );

      await expect(
        service.setSecondHalfLineup(
          { gameTeamId: mockGameTeamId, lineup: mockSecondHalfLineup },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate NotFoundException from periodService', async () => {
      mockPeriodService.setSecondHalfLineup.mockRejectedValue(
        new NotFoundException('GameTeam not found'),
      );

      await expect(
        service.setSecondHalfLineup(
          { gameTeamId: 'non-existent', lineup: mockSecondHalfLineup },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return correct counts of substitutions', async () => {
      const result = await service.setSecondHalfLineup(
        { gameTeamId: mockGameTeamId, lineup: mockSecondHalfLineup },
        mockUserId,
      );

      expect(result.substitutionsOut).toBe(0);
      expect(result.substitutionsIn).toBe(3);
    });
  });

  describe('getGameLineup', () => {
    const mockGameTeamId = 'game-team-1';
    const mockLineup = {
      gameTeamId: mockGameTeamId,
      currentOnField: [{ playerId: 'player-1', position: 'ST' }],
      bench: [{ playerId: 'player-2' }],
      starters: [{ playerId: 'player-1', position: 'ST' }],
    };

    beforeEach(() => {
      mockLineupService.getGameLineup.mockResolvedValue(mockLineup);
    });

    it('should delegate to lineupService.getGameLineup', async () => {
      const result = await service.getGameLineup(mockGameTeamId);

      expect(lineupService.getGameLineup).toHaveBeenCalledWith(mockGameTeamId);
      expect(result).toBe(mockLineup);
    });
  });

  describe('facade delegation', () => {
    it('should delegate addPlayerToLineup to lineupService', async () => {
      const input = {
        gameTeamId: 'gt-1',
        position: 'ST',
        playerId: 'player-1',
      };
      const mockEvent = { id: 'event-1' } as GameEvent;
      mockLineupService.addPlayerToLineup.mockResolvedValue(mockEvent);

      const result = await service.addPlayerToLineup(input, 'user-1');

      expect(mockLineupService.addPlayerToLineup).toHaveBeenCalledWith(
        input,
        'user-1',
      );
      expect(result).toBe(mockEvent);
    });

    it('should delegate recordGoal to goalService', async () => {
      const input = {
        gameTeamId: 'gt-1',
        scorerId: 'player-1',
        gameMinute: 25,
        gameSecond: 30,
      };
      const mockEvent = { id: 'goal-1' } as GameEvent;
      mockGoalService.recordGoal.mockResolvedValue(mockEvent);

      const result = await service.recordGoal(input, 'user-1');

      expect(mockGoalService.recordGoal).toHaveBeenCalledWith(input, 'user-1');
      expect(result).toBe(mockEvent);
    });

    it('should delegate substitutePlayer to substitutionService', async () => {
      const input = {
        gameTeamId: 'gt-1',
        playerOutEventId: 'event-1',
        playerInId: 'player-2',
        gameMinute: 60,
        gameSecond: 0,
      };
      const mockEvents = [{ id: 'sub-out' }, { id: 'sub-in' }] as GameEvent[];
      mockSubstitutionService.substitutePlayer.mockResolvedValue(mockEvents);

      const result = await service.substitutePlayer(input, 'user-1');

      expect(mockSubstitutionService.substitutePlayer).toHaveBeenCalledWith(
        input,
        'user-1',
      );
      expect(result).toBe(mockEvents);
    });

    it('should delegate startPeriod to periodService', async () => {
      const input = {
        gameTeamId: 'gt-1',
        period: 1,
        lineup: [{ playerId: 'player-1', position: 'ST' }],
        gameMinute: 0,
        gameSecond: 0,
      };
      const mockEvent = { id: 'period-start' } as GameEvent;
      mockPeriodService.startPeriod.mockResolvedValue(mockEvent);

      const result = await service.startPeriod(input, 'user-1');

      expect(mockPeriodService.startPeriod).toHaveBeenCalledWith(
        input,
        'user-1',
      );
      expect(result).toBe(mockEvent);
    });

    it('should delegate getPlayerStats to statsService', async () => {
      const input = { teamId: 'team-1' };
      const mockStats = [{ playerId: 'player-1', totalMinutes: 45 }];
      mockStatsService.getPlayerStats.mockResolvedValue(mockStats);

      const result = await service.getPlayerStats(input);

      expect(mockStatsService.getPlayerStats).toHaveBeenCalledWith(input);
      expect(result).toBe(mockStats);
    });

    it('should delegate swapPositions to eventManagementService', async () => {
      const input = {
        gameTeamId: 'gt-1',
        player1EventId: 'event-1',
        player2EventId: 'event-2',
        gameMinute: 30,
        gameSecond: 0,
      };
      const mockEvents = [{ id: 'swap-1' }, { id: 'swap-2' }] as GameEvent[];
      mockEventManagementService.swapPositions.mockResolvedValue(mockEvents);

      const result = await service.swapPositions(input, 'user-1');

      expect(mockEventManagementService.swapPositions).toHaveBeenCalledWith(
        input,
        'user-1',
      );
      expect(result).toBe(mockEvents);
    });

    it('should delegate deleteGoal to goalService', async () => {
      mockGoalService.deleteGoal.mockResolvedValue(true);

      const result = await service.deleteGoal('goal-1');

      expect(mockGoalService.deleteGoal).toHaveBeenCalledWith('goal-1');
      expect(result).toBe(true);
    });
  });
});

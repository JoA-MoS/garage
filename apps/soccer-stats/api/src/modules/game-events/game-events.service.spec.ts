import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { GameEvent } from '../../entities/game-event.entity';
import { EventType, EventCategory } from '../../entities/event-type.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { Game, GameStatus } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameTimingService } from '../games/game-timing.service';

import { GameEventsService } from './game-events.service';

describe('GameEventsService', () => {
  let service: GameEventsService;
  let gameEventsRepository: jest.Mocked<Repository<GameEvent>>;
  let gameTeamsRepository: jest.Mocked<Repository<GameTeam>>;

  const mockGameEventsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEventTypesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockGameTeamsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockGamesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTeamsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPubSub = {
    publish: jest.fn(),
  };

  const mockGameTimingService = {
    getGameDurationSeconds: jest.fn(),
    getGameTiming: jest.fn(),
  };

  // Mock event types
  const mockEventTypes: Partial<EventType>[] = [
    {
      id: 'et-sub-in',
      name: 'SUBSTITUTION_IN',
      category: EventCategory.SUBSTITUTION,
    },
    {
      id: 'et-sub-out',
      name: 'SUBSTITUTION_OUT',
      category: EventCategory.SUBSTITUTION,
    },
    {
      id: 'et-starting',
      name: 'STARTING_LINEUP',
      category: EventCategory.SUBSTITUTION,
    },
    { id: 'et-bench', name: 'BENCH', category: EventCategory.SUBSTITUTION },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameEventsService,
        {
          provide: getRepositoryToken(GameEvent),
          useValue: mockGameEventsRepository,
        },
        {
          provide: getRepositoryToken(EventType),
          useValue: mockEventTypesRepository,
        },
        {
          provide: getRepositoryToken(GameTeam),
          useValue: mockGameTeamsRepository,
        },
        { provide: getRepositoryToken(Game), useValue: mockGamesRepository },
        { provide: getRepositoryToken(Team), useValue: mockTeamsRepository },
        { provide: 'PUB_SUB', useValue: mockPubSub },
        { provide: GameTimingService, useValue: mockGameTimingService },
      ],
    }).compile();

    service = module.get<GameEventsService>(GameEventsService);
    gameEventsRepository = module.get(getRepositoryToken(GameEvent));
    gameTeamsRepository = module.get(getRepositoryToken(GameTeam));

    // Initialize event type cache by simulating onModuleInit
    mockEventTypesRepository.find.mockResolvedValue(
      mockEventTypes as EventType[],
    );
    await service.onModuleInit();

    jest.clearAllMocks();
  });

  describe('setSecondHalfLineup', () => {
    const mockGameTeamId = 'game-team-1';
    const mockGameId = 'game-1';
    const mockUserId = 'user-1';

    const mockGame: Partial<Game> = {
      id: mockGameId,
      status: GameStatus.HALFTIME,
      durationMinutes: 60,
      gameFormat: { id: 'format-1', durationMinutes: 60 } as any,
    };

    const mockGameTeam: Partial<GameTeam> = {
      id: mockGameTeamId,
      gameId: mockGameId,
      game: mockGame as Game,
    };

    // Current players on field (from first half)
    const mockCurrentOnField = [
      {
        playerId: 'player-1',
        externalPlayerName: null,
        externalPlayerNumber: null,
        position: 'ST',
      },
      {
        playerId: 'player-2',
        externalPlayerName: null,
        externalPlayerNumber: null,
        position: 'CM',
      },
      {
        playerId: 'player-3',
        externalPlayerName: null,
        externalPlayerNumber: null,
        position: 'GK',
      },
    ];

    // New lineup for second half
    const mockSecondHalfLineup = [
      { playerId: 'player-1', position: 'CM' }, // Same player, different position
      { playerId: 'player-4', position: 'ST' }, // New player from bench
      { playerId: 'player-3', position: 'GK' }, // Same player, same position
    ];

    beforeEach(() => {
      // Reset event type cache for each test
      mockEventTypesRepository.find.mockResolvedValue(
        mockEventTypes as EventType[],
      );

      // Default mocks
      mockGameTeamsRepository.findOne.mockResolvedValue(
        mockGameTeam as GameTeam,
      );
      mockGameTimingService.getGameDurationSeconds.mockResolvedValue(1832); // 30:32 (30 min, 32 sec)
      mockPubSub.publish.mockResolvedValue(undefined);

      // Mock getGameLineup by mocking the find call it uses
      mockGameEventsRepository.find
        .mockResolvedValueOnce([]) // First call for getGameLineup events
        .mockResolvedValue([]); // Subsequent calls for loading relations

      // Mock create and save to return events with IDs
      let eventCounter = 0;
      mockGameEventsRepository.create.mockImplementation((data) => ({
        id: `event-${++eventCounter}`,
        ...data,
      }));
      mockGameEventsRepository.save.mockImplementation((event) =>
        Promise.resolve(event as GameEvent),
      );
    });

    it('should throw BadRequestException if game is not in HALFTIME status', async () => {
      const gameNotInHalftime = {
        ...mockGameTeam,
        game: { ...mockGame, status: GameStatus.IN_PROGRESS },
      };
      mockGameTeamsRepository.findOne.mockResolvedValue(
        gameNotInHalftime as GameTeam,
      );

      await expect(
        service.setSecondHalfLineup(
          { gameTeamId: mockGameTeamId, lineup: mockSecondHalfLineup },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if gameTeam does not exist', async () => {
      mockGameTeamsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setSecondHalfLineup(
          { gameTeamId: 'non-existent', lineup: mockSecondHalfLineup },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use actual game clock time for events', async () => {
      // Actual halftime was at 30:32 (1832 seconds)
      mockGameTimingService.getGameDurationSeconds.mockResolvedValue(1832);

      // Mock getGameLineup to return empty (no players on field)
      jest.spyOn(service, 'getGameLineup').mockResolvedValue({
        gameTeamId: mockGameTeamId,
        currentOnField: [],
        bench: [],
        starters: [],
      });

      await service.setSecondHalfLineup(
        { gameTeamId: mockGameTeamId, lineup: mockSecondHalfLineup },
        mockUserId,
      );

      // Verify gameTimingService was called with correct parameters
      expect(mockGameTimingService.getGameDurationSeconds).toHaveBeenCalledWith(
        mockGameId,
        60, // game duration
      );

      // Verify SUBSTITUTION_IN events use minute 30, second 32
      const createCalls = mockGameEventsRepository.create.mock.calls;
      createCalls.forEach((call) => {
        expect(call[0].gameMinute).toBe(30);
        expect(call[0].gameSecond).toBe(32);
      });
    });

    it('should NOT create SUBSTITUTION_OUT events (those are created during HALFTIME transition)', async () => {
      mockGameTimingService.getGameDurationSeconds.mockResolvedValue(2700); // 45:00

      jest.spyOn(service, 'getGameLineup').mockResolvedValue({
        gameTeamId: mockGameTeamId,
        currentOnField: mockCurrentOnField as any,
        bench: [],
        starters: [],
      });

      await service.setSecondHalfLineup(
        { gameTeamId: mockGameTeamId, lineup: mockSecondHalfLineup },
        mockUserId,
      );

      const createCalls = mockGameEventsRepository.create.mock.calls;

      // All calls should be SUBSTITUTION_IN only (SUB_OUT is now handled by HALFTIME transition)
      createCalls.forEach((call) => {
        expect(call[0].eventTypeId).toBe('et-sub-in');
      });
    });

    it('should create SUBSTITUTION_IN events for all players in new lineup', async () => {
      mockGameTimingService.getGameDurationSeconds.mockResolvedValue(2700); // 45:00

      jest.spyOn(service, 'getGameLineup').mockResolvedValue({
        gameTeamId: mockGameTeamId,
        currentOnField: mockCurrentOnField as any,
        bench: [],
        starters: [],
      });

      await service.setSecondHalfLineup(
        { gameTeamId: mockGameTeamId, lineup: mockSecondHalfLineup },
        mockUserId,
      );

      const createCalls = mockGameEventsRepository.create.mock.calls;

      // All calls should be SUBSTITUTION_IN (one for each player in new lineup)
      expect(createCalls.length).toBe(3);
      createCalls.forEach((call, index) => {
        expect(call[0].eventTypeId).toBe('et-sub-in');
        expect(call[0].playerId).toBe(mockSecondHalfLineup[index].playerId);
        expect(call[0].position).toBe(mockSecondHalfLineup[index].position);
        expect(call[0].gameMinute).toBe(45);
        expect(call[0].gameSecond).toBe(0);
      });
    });

    it('should return correct counts of substitutions', async () => {
      mockGameTimingService.getGameDurationSeconds.mockResolvedValue(2700);

      jest.spyOn(service, 'getGameLineup').mockResolvedValue({
        gameTeamId: mockGameTeamId,
        currentOnField: mockCurrentOnField as any,
        bench: [],
        starters: [],
      });

      // Mock find to return the created events with relations
      mockGameEventsRepository.find.mockResolvedValue([]);

      const result = await service.setSecondHalfLineup(
        { gameTeamId: mockGameTeamId, lineup: mockSecondHalfLineup },
        mockUserId,
      );

      // SUB_OUT events are now created during HALFTIME transition, not in setSecondHalfLineup
      expect(result.substitutionsOut).toBe(0);
      expect(result.substitutionsIn).toBe(3); // 3 players in new lineup
    });

    it('should handle extended first half (e.g., 47:32 instead of 45:00)', async () => {
      // First half ran long - 47 minutes and 32 seconds
      mockGameTimingService.getGameDurationSeconds.mockResolvedValue(2852); // 47:32

      jest.spyOn(service, 'getGameLineup').mockResolvedValue({
        gameTeamId: mockGameTeamId,
        currentOnField: [mockCurrentOnField[0]] as any,
        bench: [],
        starters: [],
      });

      await service.setSecondHalfLineup(
        { gameTeamId: mockGameTeamId, lineup: [mockSecondHalfLineup[0]] },
        mockUserId,
      );

      const createCalls = mockGameEventsRepository.create.mock.calls;

      // All events should use the actual halftime clock: 47:32
      createCalls.forEach((call) => {
        expect(call[0].gameMinute).toBe(47);
        expect(call[0].gameSecond).toBe(32);
      });
    });

    it('should handle external players in lineup', async () => {
      mockGameTimingService.getGameDurationSeconds.mockResolvedValue(2700);

      const lineupWithExternalPlayer = [
        {
          externalPlayerName: 'John Doe',
          externalPlayerNumber: '10',
          position: 'ST',
        },
      ];

      jest.spyOn(service, 'getGameLineup').mockResolvedValue({
        gameTeamId: mockGameTeamId,
        currentOnField: [],
        bench: [],
        starters: [],
      });

      await service.setSecondHalfLineup(
        { gameTeamId: mockGameTeamId, lineup: lineupWithExternalPlayer },
        mockUserId,
      );

      const createCalls = mockGameEventsRepository.create.mock.calls;
      expect(createCalls[0][0].externalPlayerName).toBe('John Doe');
      expect(createCalls[0][0].externalPlayerNumber).toBe('10');
      expect(createCalls[0][0].playerId).toBeUndefined();
    });

    it('should call repository.find to load events with relations', async () => {
      mockGameTimingService.getGameDurationSeconds.mockResolvedValue(2700);

      jest.spyOn(service, 'getGameLineup').mockResolvedValue({
        gameTeamId: mockGameTeamId,
        currentOnField: [mockCurrentOnField[0]] as any,
        bench: [],
        starters: [],
      });

      await service.setSecondHalfLineup(
        { gameTeamId: mockGameTeamId, lineup: [mockSecondHalfLineup[0]] },
        mockUserId,
      );

      // Verify find was called to load events with relations
      expect(mockGameEventsRepository.find).toHaveBeenCalled();
    });
  });
});

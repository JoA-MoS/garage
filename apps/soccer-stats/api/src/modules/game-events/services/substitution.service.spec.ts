import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { GameEvent } from '../../../entities/game-event.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { Game } from '../../../entities/game.entity';
import { EventType } from '../../../entities/event-type.entity';
import {
  StatsFeatures,
  DEFAULT_STATS_FEATURES,
} from '../../../entities/stats-features.type';

import { SubstitutionService } from './substitution.service';
import { EventCoreService } from './event-core.service';
import { LineupService } from './lineup.service';

// ─── helpers ────────────────────────────────────────────────────────────────

const GAME_TEAM_ID = 'gt-1';
const GAME_ID = 'game-1';
const PLAYER_ID = 'player-1';
const USER_ID = 'user-1';
const PLAYER_EVENT_ID = 'evt-1';

function makeGameTeam(overrides: Partial<GameTeam> = {}): GameTeam {
  return {
    id: GAME_TEAM_ID,
    gameId: GAME_ID,
    statsFeatures: undefined,
    ...overrides,
  } as GameTeam;
}

function makeGame(statsFeatures: StatsFeatures | null = null): Game {
  return { id: GAME_ID, statsFeatures } as Game;
}

function makeEventType(name: string): EventType {
  return { id: `et-${name}`, name } as EventType;
}

function makeGameEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: PLAYER_EVENT_ID,
    gameId: GAME_ID,
    gameTeamId: GAME_TEAM_ID,
    playerId: PLAYER_ID,
    position: 'GK',
    eventType: makeEventType('SUBSTITUTION_IN'),
    ...overrides,
  } as GameEvent;
}

// ─── test setup ─────────────────────────────────────────────────────────────

describe('SubstitutionService', () => {
  let service: SubstitutionService;

  let mockGameEventsRepository: jest.Mocked<Partial<Repository<GameEvent>>>;
  let mockGameTeamsRepository: jest.Mocked<Partial<Repository<GameTeam>>>;
  let mockGamesRepository: jest.Mocked<Partial<Repository<Game>>>;
  let mockCoreService: jest.Mocked<Partial<EventCoreService>>;
  let mockLineupService: jest.Mocked<Partial<LineupService>>;

  beforeEach(() => {
    mockGameEventsRepository = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      findOne: jest.fn(),
    };

    mockGameTeamsRepository = {
      findOne: jest.fn(),
    };

    mockGamesRepository = {
      findOne: jest.fn(),
    };

    mockCoreService = {
      gameEventsRepository:
        mockGameEventsRepository as unknown as Repository<GameEvent>,
      gameTeamsRepository:
        mockGameTeamsRepository as unknown as Repository<GameTeam>,
      gamesRepository: mockGamesRepository as unknown as Repository<Game>,
      getGameTeam: jest.fn(),
      getEventTypeByName: jest.fn().mockImplementation(makeEventType),
      ensurePlayerInfoProvided: jest.fn(),
      publishGameEvent: jest.fn().mockResolvedValue(undefined),
    };

    mockLineupService = {
      getGameLineup: jest.fn(),
    };

    service = new SubstitutionService(
      mockCoreService as unknown as EventCoreService,
      mockLineupService as unknown as LineupService,
    );
  });

  // ─── getEffectiveFeatures cascade ─────────────────────────────────────────

  describe('getEffectiveFeatures (via bringPlayerOntoField)', () => {
    it('returns gameTeam.statsFeatures when set', async () => {
      const teamFeatures: StatsFeatures = {
        ...DEFAULT_STATS_FEATURES,
        trackPositions: false,
      };
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({ statsFeatures: teamFeatures }),
      );

      await service.bringPlayerOntoField(
        {
          gameTeamId: GAME_TEAM_ID,
          playerId: PLAYER_ID,
          position: 'GK',
          period: '1',
          periodSecond: 0,
        },
        USER_ID,
      );

      // gamesRepository should NOT be consulted when gameTeam has features
      expect(mockGamesRepository.findOne).not.toHaveBeenCalled();
    });

    it('falls through to game.statsFeatures when gameTeam has none', async () => {
      const gameFeatures: StatsFeatures = {
        ...DEFAULT_STATS_FEATURES,
        trackPositions: false,
      };
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({ statsFeatures: undefined }),
      );
      mockGamesRepository.findOne!.mockResolvedValue(makeGame(gameFeatures));

      const saved = await service.bringPlayerOntoField(
        {
          gameTeamId: GAME_TEAM_ID,
          playerId: PLAYER_ID,
          position: 'GK',
          period: '1',
          periodSecond: 0,
        },
        USER_ID,
      );

      expect(mockGamesRepository.findOne).toHaveBeenCalled();
      expect(saved.position).toBeUndefined();
    });

    it('falls through to DEFAULT_STATS_FEATURES when both gameTeam and game have none', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({ statsFeatures: undefined }),
      );
      mockGamesRepository.findOne!.mockResolvedValue(makeGame(null));

      const saved = await service.bringPlayerOntoField(
        {
          gameTeamId: GAME_TEAM_ID,
          playerId: PLAYER_ID,
          position: 'GK',
          period: '1',
          periodSecond: 0,
        },
        USER_ID,
      );

      // DEFAULT_STATS_FEATURES has trackPositions=true → position should be kept
      expect(saved.position).toBe('GK');
    });

    it('throws NotFoundException when game record is missing', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({ statsFeatures: undefined }),
      );
      mockGamesRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.bringPlayerOntoField(
          {
            gameTeamId: GAME_TEAM_ID,
            playerId: PLAYER_ID,
            position: 'GK',
            period: '1',
            periodSecond: 0,
          },
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── bringPlayerOntoField — position tracking ─────────────────────────────

  describe('bringPlayerOntoField', () => {
    it('includes position when trackPositions=true', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );

      const saved = await service.bringPlayerOntoField(
        {
          gameTeamId: GAME_TEAM_ID,
          playerId: PLAYER_ID,
          position: 'ST',
          period: '1',
          periodSecond: 0,
        },
        USER_ID,
      );

      expect(saved.position).toBe('ST');
    });

    it('strips position when trackPositions=false', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: false },
        }),
      );

      const saved = await service.bringPlayerOntoField(
        {
          gameTeamId: GAME_TEAM_ID,
          playerId: PLAYER_ID,
          position: 'GK',
          period: '1',
          periodSecond: 0,
        },
        USER_ID,
      );

      expect(saved.position).toBeUndefined();
    });
  });

  // ─── removePlayerFromField — position tracking ────────────────────────────

  describe('removePlayerFromField', () => {
    it('includes position on SUBSTITUTION_OUT when trackPositions=true', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );
      (mockGameEventsRepository.findOne as jest.Mock).mockResolvedValue(
        makeGameEvent({ position: 'CB' }),
      );

      const saved = await service.removePlayerFromField(
        {
          gameTeamId: GAME_TEAM_ID,
          playerEventId: PLAYER_EVENT_ID,
          period: '1',
          periodSecond: 30,
        },
        USER_ID,
      );

      expect(saved.position).toBe('CB');
    });

    it('strips position on SUBSTITUTION_OUT when trackPositions=false', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: false },
        }),
      );
      (mockGameEventsRepository.findOne as jest.Mock).mockResolvedValue(
        makeGameEvent({ position: 'CB' }),
      );

      const saved = await service.removePlayerFromField(
        {
          gameTeamId: GAME_TEAM_ID,
          playerEventId: PLAYER_EVENT_ID,
          period: '1',
          periodSecond: 30,
        },
        USER_ID,
      );

      expect(saved.position).toBeUndefined();
    });
  });

  // ─── substitutePlayer — position tracking ─────────────────────────────────

  describe('substitutePlayer', () => {
    const PLAYER_IN_ID = 'player-in-1';

    it('includes position on both SUB_OUT and SUB_IN when trackPositions=true', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );
      (mockGameEventsRepository.findOne as jest.Mock).mockResolvedValue(
        makeGameEvent({ position: 'LM' }),
      );
      // Give each save call a distinct id so we can tell them apart
      (mockGameEventsRepository.save as jest.Mock)
        .mockResolvedValueOnce({ position: 'LM', id: 'sub-out-1' })
        .mockResolvedValueOnce({ position: 'LM', id: 'sub-in-1' });

      const [subOut, subIn] = await service.substitutePlayer(
        {
          gameTeamId: GAME_TEAM_ID,
          playerOutEventId: PLAYER_EVENT_ID,
          playerInId: PLAYER_IN_ID,
          period: '1',
          periodSecond: 30,
        },
        USER_ID,
      );

      const subOutCreate = (mockGameEventsRepository.create as jest.Mock).mock
        .calls[0][0];
      const subInCreate = (mockGameEventsRepository.create as jest.Mock).mock
        .calls[1][0];
      expect(subOutCreate.position).toBe('LM');
      expect(subInCreate.position).toBe('LM');
    });

    it('strips position on both SUB_OUT and SUB_IN when trackPositions=false', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: false },
        }),
      );
      (mockGameEventsRepository.findOne as jest.Mock).mockResolvedValue(
        makeGameEvent({ position: 'LM' }),
      );

      await service.substitutePlayer(
        {
          gameTeamId: GAME_TEAM_ID,
          playerOutEventId: PLAYER_EVENT_ID,
          playerInId: PLAYER_IN_ID,
          period: '1',
          periodSecond: 30,
        },
        USER_ID,
      );

      const subOutCreate = (mockGameEventsRepository.create as jest.Mock).mock
        .calls[0][0];
      const subInCreate = (mockGameEventsRepository.create as jest.Mock).mock
        .calls[1][0];
      expect(subOutCreate.position).toBeUndefined();
      expect(subInCreate.position).toBeUndefined();
    });
  });

  // ─── createSubstitutionOutForAllOnField — position tracking ───────────────

  describe('createSubstitutionOutForAllOnField', () => {
    const PERIOD = '1';
    const PERIOD_SECOND = 1800;

    const onFieldPlayers = [
      {
        playerId: 'p1',
        position: 'GK',
        externalPlayerName: undefined,
        externalPlayerNumber: undefined,
      },
      {
        playerId: 'p2',
        position: 'CB',
        externalPlayerName: undefined,
        externalPlayerNumber: undefined,
      },
    ];

    it('includes position on batch SUB_OUTs when trackPositions=true', async () => {
      (mockGameTeamsRepository.findOne as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );
      (mockLineupService.getGameLineup as jest.Mock).mockResolvedValue({
        currentOnField: onFieldPlayers,
      });

      await service.createSubstitutionOutForAllOnField(
        GAME_TEAM_ID,
        PERIOD,
        PERIOD_SECOND,
        USER_ID,
      );

      const createCalls = (mockGameEventsRepository.create as jest.Mock).mock
        .calls;
      expect(createCalls[0][0].position).toBe('GK');
      expect(createCalls[1][0].position).toBe('CB');
    });

    it('strips position on batch SUB_OUTs when trackPositions=false', async () => {
      (mockGameTeamsRepository.findOne as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: false },
        }),
      );
      (mockLineupService.getGameLineup as jest.Mock).mockResolvedValue({
        currentOnField: onFieldPlayers,
      });

      await service.createSubstitutionOutForAllOnField(
        GAME_TEAM_ID,
        PERIOD,
        PERIOD_SECOND,
        USER_ID,
      );

      const createCalls = (mockGameEventsRepository.create as jest.Mock).mock
        .calls;
      expect(createCalls[0][0].position).toBeUndefined();
      expect(createCalls[1][0].position).toBeUndefined();
    });

    it('uses game-level features when gameTeam has none (cascade)', async () => {
      (mockGameTeamsRepository.findOne as jest.Mock).mockResolvedValue(
        makeGameTeam({ statsFeatures: undefined }),
      );
      mockGamesRepository.findOne!.mockResolvedValue(
        makeGame({ ...DEFAULT_STATS_FEATURES, trackPositions: false }),
      );
      (mockLineupService.getGameLineup as jest.Mock).mockResolvedValue({
        currentOnField: onFieldPlayers,
      });

      await service.createSubstitutionOutForAllOnField(
        GAME_TEAM_ID,
        PERIOD,
        PERIOD_SECOND,
        USER_ID,
      );

      const createCalls = (mockGameEventsRepository.create as jest.Mock).mock
        .calls;
      expect(createCalls[0][0].position).toBeUndefined();
    });

    it('throws NotFoundException when GameTeam not found', async () => {
      (mockGameTeamsRepository.findOne as jest.Mock).mockResolvedValue(null);
      (mockLineupService.getGameLineup as jest.Mock).mockResolvedValue({
        currentOnField: [],
      });

      await expect(
        service.createSubstitutionOutForAllOnField(
          'nonexistent',
          PERIOD,
          PERIOD_SECOND,
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

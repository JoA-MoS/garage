import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { GameEvent } from '../../../entities/game-event.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { Game } from '../../../entities/game.entity';
import { EventType } from '../../../entities/event-type.entity';
import {
  StatsFeatures,
  DEFAULT_STATS_FEATURES,
} from '../../../entities/stats-features.type';

import {
  SubstitutionService,
  type ActionWriteContext,
} from './substitution.service';
import { EventCoreService } from './event-core.service';
import { LineupService } from './lineup.service';
import { ActionReceiptService } from './action-receipt.service';

// ─── helpers ────────────────────────────────────────────────────────────────

const GAME_TEAM_ID = 'gt-1';
const GAME_ID = 'game-1';
const PLAYER_ID = 'player-1';
const USER_ID = 'user-1';
const PLAYER_EVENT_ID = 'evt-1';
const ACTION_ID = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';
const SUB_OUT_ID = '7a1c2e3f-4b5d-4c6e-9f8a-0b1c2d3e4f5a';
const SUB_IN_ID = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const SUB_OUT_2_ID = '11111111-2222-4333-8444-555555555555';
const SUB_IN_2_ID = '66666666-7777-4888-9999-aaaaaaaaaaaa';
const SWAP_1_ID = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
const SWAP_2_ID = '01234567-89ab-4cde-8f01-23456789abcd';
const EVENT_ID = 'abcdef01-2345-4678-89ab-cdef01234567';

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
  let mockReceiptService: { applyOnce: jest.Mock; loadEvents: jest.Mock };

  beforeEach(() => {
    mockGameEventsRepository = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      insert: jest.fn().mockResolvedValue({ identifiers: [] }),
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

    // Runs `apply` against the same mocked repository, as if inside the
    // transaction. Individual tests override this to simulate a replay.
    const fakeManager = {
      getRepository: () => mockGameEventsRepository,
    };
    mockReceiptService = {
      applyOnce: jest.fn(async (_action, { apply }) => ({
        result: (await apply(fakeManager)).result,
        replayed: false,
      })),
      loadEvents: jest.fn(),
    };

    service = new SubstitutionService(
      mockCoreService as unknown as EventCoreService,
      mockLineupService as unknown as LineupService,
      mockReceiptService as unknown as ActionReceiptService,
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

      // gamesRepository is still consulted once for the capacity guard, but
      // not for feature resolution (gameTeam already has features) - so the
      // one call it does see is the capacity check's relations-based lookup.
      expect(mockGamesRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockGamesRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['format'] }),
      );
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
      expect(saved.position).toBe('FIELD');
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

    it('uses FIELD sentinel when trackPositions=false', async () => {
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

      expect(saved.position).toBe('FIELD');
    });
  });

  // ─── bringPlayerOntoField — capacity guard ────────────────────────────────

  describe('bringPlayerOntoField — capacity guard', () => {
    it('rejects the add when the team already has playersPerTeam players on the field', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );
      mockGamesRepository.findOne!.mockResolvedValue({
        id: GAME_ID,
        format: { playersPerTeam: 2 },
      } as Game);
      (mockLineupService.getGameLineup as jest.Mock).mockResolvedValue({
        currentOnField: [{ playerId: 'a' }, { playerId: 'b' }],
      });

      await expect(
        service.bringPlayerOntoField(
          {
            gameTeamId: GAME_TEAM_ID,
            playerId: PLAYER_ID,
            position: 'ST',
            period: '1',
            periodSecond: 0,
          },
          USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockGameEventsRepository.save).not.toHaveBeenCalled();
      expect(mockGameEventsRepository.insert).not.toHaveBeenCalled();
    });

    it('replays a retry even when the original add is what filled the field', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );
      mockGamesRepository.findOne!.mockResolvedValue({
        id: GAME_ID,
        format: { playersPerTeam: 2 },
      } as Game);
      (mockLineupService.getGameLineup as jest.Mock).mockResolvedValue({
        currentOnField: [{ playerId: 'a' }, { playerId: PLAYER_ID }],
      });
      const recorded = { id: SUB_IN_ID };
      mockReceiptService.applyOnce.mockImplementation(
        async (_action, { replay }) => ({
          result: await replay([SUB_IN_ID]),
          replayed: true,
        }),
      );
      mockReceiptService.loadEvents.mockResolvedValue([recorded]);

      const result = await service.bringPlayerOntoField(
        {
          gameTeamId: GAME_TEAM_ID,
          playerId: PLAYER_ID,
          position: 'ST',
          period: '1',
          periodSecond: 0,
          actionId: ACTION_ID,
          eventId: SUB_IN_ID,
        },
        USER_ID,
      );

      expect(result).toBe(recorded);
      expect(mockLineupService.getGameLineup).not.toHaveBeenCalled();
    });

    it('allows the add when the team is below the format capacity', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );
      mockGamesRepository.findOne!.mockResolvedValue({
        id: GAME_ID,
        format: { playersPerTeam: 2 },
      } as Game);
      (mockLineupService.getGameLineup as jest.Mock).mockResolvedValue({
        currentOnField: [{ playerId: 'a' }],
      });

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

    it('does not block the add when the format is unknown (fails open)', async () => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );
      mockGamesRepository.findOne!.mockResolvedValue({
        id: GAME_ID,
        format: null,
      } as unknown as Game);
      (mockLineupService.getGameLineup as jest.Mock).mockResolvedValue({
        currentOnField: [{ playerId: 'a' }, { playerId: 'b' }],
      });

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
      expect(subOutCreate.position).toBe('LM');
      expect(subInCreate.position).toBe('LM');
    });

    it('strips the real position on SUB_OUT but stamps the "FIELD" sentinel on SUB_IN when trackPositions=false', async () => {
      // Regression test: the incoming player must still read as on-field
      // (position != null) even though position tracking is off, or a
      // freshly subbed-in player is indistinguishable from one on the bench.
      // The outgoing player's real position code ('LM' here) must not leak
      // onto the new events - SUB_OUT is stripped like before, and SUB_IN
      // gets the sentinel instead of the real code.
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
      expect(subInCreate.position).toBe('FIELD');
    });

    describe('client actions (outbox)', () => {
      const baseInput = {
        gameTeamId: GAME_TEAM_ID,
        playerOutEventId: PLAYER_EVENT_ID,
        playerInId: PLAYER_IN_ID,
        period: '2',
        periodSecond: 600,
      };

      beforeEach(() => {
        (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
          makeGameTeam({
            statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
          }),
        );
        (mockGameEventsRepository.findOne as jest.Mock).mockResolvedValue(
          makeGameEvent({ position: 'LM' }),
        );
      });

      it('applies the substitution once per actionId', async () => {
        await service.substitutePlayer(
          { ...baseInput, actionId: ACTION_ID },
          USER_ID,
        );

        expect(mockReceiptService.applyOnce).toHaveBeenCalledWith(
          {
            actionId: ACTION_ID,
            gameId: GAME_ID,
            recordedByUserId: USER_ID,
            kind: 'substitutePlayer',
          },
          expect.objectContaining({
            apply: expect.any(Function),
            replay: expect.any(Function),
          }),
        );
      });

      it('creates the rows with the client-chosen IDs, linked, and stamped with occurredAt', async () => {
        const occurredAt = new Date(Date.now() - 60_000);

        const [subOut, subIn] = await service.substitutePlayer(
          {
            ...baseInput,
            actionId: ACTION_ID,
            subOutEventId: SUB_OUT_ID,
            subInEventId: SUB_IN_ID,
            occurredAt,
          },
          USER_ID,
        );

        expect(subOut).toMatchObject({ id: SUB_OUT_ID, occurredAt });
        expect(subIn).toMatchObject({
          id: SUB_IN_ID,
          parentEventId: SUB_OUT_ID,
          occurredAt,
        });
      });

      it('inserts new rows rather than saving, so a reused ID cannot overwrite an existing event', async () => {
        await service.substitutePlayer(
          { ...baseInput, subOutEventId: SUB_OUT_ID, subInEventId: SUB_IN_ID },
          USER_ID,
        );

        expect(mockGameEventsRepository.insert).toHaveBeenCalledTimes(2);
        expect(mockGameEventsRepository.save).not.toHaveBeenCalled();
      });

      it('publishes the substitution when applied', async () => {
        await service.substitutePlayer(
          { ...baseInput, actionId: ACTION_ID },
          USER_ID,
        );

        expect(mockCoreService.publishGameEvent).toHaveBeenCalledTimes(1);
      });

      it('returns the recorded events and does not publish again on a retry', async () => {
        const recorded = [{ id: SUB_OUT_ID }, { id: SUB_IN_ID }];
        mockReceiptService.applyOnce.mockImplementation(
          async (_action, { replay }) => ({
            result: await replay([SUB_OUT_ID, SUB_IN_ID]),
            replayed: true,
          }),
        );
        mockReceiptService.loadEvents.mockResolvedValue(recorded);

        const result = await service.substitutePlayer(
          { ...baseInput, actionId: ACTION_ID },
          USER_ID,
        );

        expect(result).toBe(recorded);
        expect(mockReceiptService.loadEvents).toHaveBeenCalledWith([
          SUB_OUT_ID,
          SUB_IN_ID,
        ]);
        expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
      });

      it('rejects a client event ID that is not a UUID', async () => {
        await expect(
          service.substitutePlayer(
            { ...baseInput, subInEventId: 'sub-in-1' },
            USER_ID,
          ),
        ).rejects.toThrow(
          new BadRequestException('subInEventId must be a UUID'),
        );
      });
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

  // ─── bringPlayerOntoField / removePlayerFromField — client actions ────────

  describe('client actions (outbox) for field entry and exit', () => {
    const bringInput = {
      gameTeamId: GAME_TEAM_ID,
      playerId: PLAYER_ID,
      position: 'ST',
      period: '2',
      periodSecond: 300,
    };
    const removeInput = {
      gameTeamId: GAME_TEAM_ID,
      playerEventId: PLAYER_EVENT_ID,
      period: '2',
      periodSecond: 300,
    };

    function replayWith(recorded: unknown[]) {
      mockReceiptService.applyOnce.mockImplementation(
        async (_action, { replay }) => ({
          result: await replay(['recorded-id']),
          replayed: true,
        }),
      );
      mockReceiptService.loadEvents.mockResolvedValue(recorded);
    }

    beforeEach(() => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );
      (mockGameEventsRepository.findOne as jest.Mock).mockResolvedValue(
        makeGameEvent({ position: 'CB' }),
      );
    });

    describe('bringPlayerOntoField', () => {
      it('applies once per actionId', async () => {
        await service.bringPlayerOntoField(
          { ...bringInput, actionId: ACTION_ID },
          USER_ID,
        );

        expect(mockReceiptService.applyOnce).toHaveBeenCalledWith(
          {
            actionId: ACTION_ID,
            gameId: GAME_ID,
            recordedByUserId: USER_ID,
            kind: 'bringPlayerOntoField',
          },
          expect.objectContaining({
            apply: expect.any(Function),
            replay: expect.any(Function),
          }),
        );
      });

      it('creates the row with the client ID and occurredAt, using insert not save', async () => {
        const occurredAt = new Date(Date.now() - 60_000);

        const event = await service.bringPlayerOntoField(
          { ...bringInput, eventId: EVENT_ID, occurredAt },
          USER_ID,
        );

        expect(event).toMatchObject({ id: EVENT_ID, occurredAt });
        expect(mockGameEventsRepository.insert).toHaveBeenCalledWith(event);
        expect(mockGameEventsRepository.save).not.toHaveBeenCalled();
      });

      it('publishes once when applied', async () => {
        await service.bringPlayerOntoField(bringInput, USER_ID);

        expect(mockCoreService.publishGameEvent).toHaveBeenCalledTimes(1);
      });

      it('returns the recorded event and does not publish on a retry', async () => {
        const recorded = { id: EVENT_ID };
        replayWith([recorded]);

        const result = await service.bringPlayerOntoField(
          { ...bringInput, actionId: ACTION_ID },
          USER_ID,
        );

        expect(result).toBe(recorded);
        expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
      });

      it('throws a conflict on a retry whose event has since been deleted', async () => {
        replayWith([]);

        await expect(
          service.bringPlayerOntoField(
            { ...bringInput, actionId: ACTION_ID },
            USER_ID,
          ),
        ).rejects.toThrow(
          new ConflictException(
            `Action ${ACTION_ID} was already applied; its events have since been deleted`,
          ),
        );
      });

      it('rejects an eventId that is not a UUID', async () => {
        await expect(
          service.bringPlayerOntoField(
            { ...bringInput, eventId: 'evt-x' },
            USER_ID,
          ),
        ).rejects.toThrow(new BadRequestException('eventId must be a UUID'));
        expect(mockReceiptService.applyOnce).not.toHaveBeenCalled();
      });

      it('still rejects when the team is at field capacity', async () => {
        (mockGamesRepository.findOne as jest.Mock).mockResolvedValue({
          ...makeGame(),
          format: { playersPerTeam: 1 },
        });
        (mockLineupService.getGameLineup as jest.Mock).mockResolvedValue({
          currentOnField: [{}],
        });

        await expect(
          service.bringPlayerOntoField(bringInput, USER_ID),
        ).rejects.toThrow(BadRequestException);
        // Checked inside apply, so the throw rolls back the receipt.
        expect(mockGameEventsRepository.insert).not.toHaveBeenCalled();
      });
    });

    describe('removePlayerFromField', () => {
      it('applies once per actionId', async () => {
        await service.removePlayerFromField(
          { ...removeInput, actionId: ACTION_ID },
          USER_ID,
        );

        expect(mockReceiptService.applyOnce).toHaveBeenCalledWith(
          {
            actionId: ACTION_ID,
            gameId: GAME_ID,
            recordedByUserId: USER_ID,
            kind: 'removePlayerFromField',
          },
          expect.objectContaining({
            apply: expect.any(Function),
            replay: expect.any(Function),
          }),
        );
      });

      it('creates the row with the client ID and occurredAt, using insert not save', async () => {
        const occurredAt = new Date(Date.now() - 60_000);

        const event = await service.removePlayerFromField(
          { ...removeInput, eventId: EVENT_ID, occurredAt },
          USER_ID,
        );

        expect(event).toMatchObject({
          id: EVENT_ID,
          occurredAt,
          position: 'CB',
        });
        expect(mockGameEventsRepository.insert).toHaveBeenCalledWith(event);
        expect(mockGameEventsRepository.save).not.toHaveBeenCalled();
      });

      it('publishes once when applied', async () => {
        await service.removePlayerFromField(removeInput, USER_ID);

        expect(mockCoreService.publishGameEvent).toHaveBeenCalledTimes(1);
      });

      it('returns the recorded event and does not publish on a retry', async () => {
        const recorded = { id: EVENT_ID };
        replayWith([recorded]);

        const result = await service.removePlayerFromField(
          { ...removeInput, actionId: ACTION_ID },
          USER_ID,
        );

        expect(result).toBe(recorded);
        expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
      });

      it('does not look up the player event on a retry', async () => {
        replayWith([{ id: EVENT_ID }]);

        await service.removePlayerFromField(
          { ...removeInput, actionId: ACTION_ID },
          USER_ID,
        );

        expect(mockGameEventsRepository.findOne).not.toHaveBeenCalled();
      });

      it('throws a conflict on a retry whose event has since been deleted', async () => {
        replayWith([]);

        await expect(
          service.removePlayerFromField(
            { ...removeInput, actionId: ACTION_ID },
            USER_ID,
          ),
        ).rejects.toThrow(ConflictException);
      });

      it('rejects an eventId that is not a UUID', async () => {
        await expect(
          service.removePlayerFromField(
            { ...removeInput, eventId: 'evt-x' },
            USER_ID,
          ),
        ).rejects.toThrow(new BadRequestException('eventId must be a UUID'));
        expect(mockReceiptService.applyOnce).not.toHaveBeenCalled();
      });

      it('throws NotFoundException when the player event is missing', async () => {
        (mockGameEventsRepository.findOne as jest.Mock).mockResolvedValue(null);

        await expect(
          service.removePlayerFromField(removeInput, USER_ID),
        ).rejects.toThrow(
          new NotFoundException(`GameEvent ${PLAYER_EVENT_ID} not found`),
        );
        expect(mockGameEventsRepository.insert).not.toHaveBeenCalled();
        expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
      });

      it('rejects a player event that is not an on-field type', async () => {
        (mockGameEventsRepository.findOne as jest.Mock).mockResolvedValue(
          makeGameEvent({ eventType: makeEventType('GOAL') }),
        );

        await expect(
          service.removePlayerFromField(removeInput, USER_ID),
        ).rejects.toThrow(
          new BadRequestException(
            `Player event ${PLAYER_EVENT_ID} is not an on-field event type. Expected SUBSTITUTION_IN, got GOAL`,
          ),
        );
        expect(mockGameEventsRepository.insert).not.toHaveBeenCalled();
      });
    });
  });

  // ─── batchLineupChanges ───────────────────────────────────────────────────

  describe('batchLineupChanges', () => {
    let applySwap: jest.Mock;

    const swapEvents = (n: number) => [
      { id: `swap-${n}-a` } as GameEvent,
      { id: `swap-${n}-b` } as GameEvent,
    ];

    const subs = [
      {
        playerOutEventId: PLAYER_EVENT_ID,
        playerInId: 'p-in-1',
        subOutEventId: SUB_OUT_ID,
        subInEventId: SUB_IN_ID,
      },
      {
        playerOutEventId: 'evt-2',
        playerInId: 'p-in-2',
        subOutEventId: SUB_OUT_2_ID,
        subInEventId: SUB_IN_2_ID,
      },
    ];

    const baseInput = {
      gameTeamId: GAME_TEAM_ID,
      period: '2',
      periodSecond: 600,
      substitutions: subs,
      swaps: [],
    };

    beforeEach(() => {
      applySwap = jest
        .fn()
        .mockResolvedValueOnce(swapEvents(1))
        .mockResolvedValueOnce(swapEvents(2));
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue(
        makeGameTeam({
          statsFeatures: { ...DEFAULT_STATS_FEATURES, trackPositions: true },
        }),
      );
      (mockGameEventsRepository.findOne as jest.Mock).mockResolvedValue(
        makeGameEvent({ position: 'LM' }),
      );
    });

    it('runs the whole batch as one action with the batch actionId', async () => {
      await service.batchLineupChanges(
        {
          ...baseInput,
          swaps: [
            {
              player1: { eventId: 'e1' },
              player2: { eventId: 'e2' },
            },
          ],
          actionId: ACTION_ID,
        },
        USER_ID,
        applySwap,
      );

      expect(mockReceiptService.applyOnce).toHaveBeenCalledTimes(1);
      expect(mockReceiptService.applyOnce).toHaveBeenCalledWith(
        {
          actionId: ACTION_ID,
          gameId: GAME_ID,
          recordedByUserId: USER_ID,
          kind: 'batchLineupChanges',
        },
        expect.objectContaining({
          apply: expect.any(Function),
          replay: expect.any(Function),
        }),
      );
    });

    it('writes substitutions then swaps, passing the same context to every swap', async () => {
      const occurredAt = new Date(Date.now() - 60_000);
      const callOrder: string[] = [];
      (mockGameEventsRepository.insert as jest.Mock).mockImplementation(
        async () => {
          callOrder.push('insert');
        },
      );
      applySwap.mockReset();
      applySwap.mockImplementation(async () => {
        callOrder.push('swap');
        return swapEvents(1);
      });

      const { events } = await service.batchLineupChanges(
        {
          ...baseInput,
          occurredAt,
          swaps: [
            { player1: { eventId: 'e1' }, player2: { eventId: 'e2' } },
            { player1: { eventId: 'e3' }, player2: { eventId: 'e4' } },
          ],
        },
        USER_ID,
        applySwap,
      );

      // 2 subs x 2 inserts, then 2 swaps
      expect(callOrder).toEqual([
        'insert',
        'insert',
        'insert',
        'insert',
        'swap',
        'swap',
      ]);
      const ctx1: ActionWriteContext = applySwap.mock.calls[0][0];
      const ctx2: ActionWriteContext = applySwap.mock.calls[1][0];
      expect(ctx1).toBe(ctx2);
      expect(ctx1).toMatchObject({
        events: mockGameEventsRepository,
        gameId: GAME_ID,
        recordedByUserId: USER_ID,
        occurredAt,
      });
      expect(events).toHaveLength(2 * 2 + 2 * 2);
    });

    it("resolves a swap substitutionIndex to that substitution's SUB_IN id", async () => {
      const { substitutionEventIds } = await service.batchLineupChanges(
        {
          ...baseInput,
          swaps: [
            {
              player1: { substitutionIndex: 1 },
              player2: { eventId: 'e2' },
            },
          ],
        },
        USER_ID,
        applySwap,
      );

      expect(applySwap.mock.calls[0][1]).toMatchObject({
        gameTeamId: GAME_TEAM_ID,
        player1EventId: SUB_IN_2_ID,
        player2EventId: 'e2',
        period: '2',
        periodSecond: 600,
      });
      expect(substitutionEventIds.get(0)).toBe(SUB_IN_ID);
      expect(substitutionEventIds.get(1)).toBe(SUB_IN_2_ID);
    });

    it('lets a swap reference a client subInEventId through eventId', async () => {
      await service.batchLineupChanges(
        {
          ...baseInput,
          swaps: [
            {
              player1: { eventId: SUB_IN_ID },
              player2: { eventId: 'e2' },
              swap1EventId: SWAP_1_ID,
              swap2EventId: SWAP_2_ID,
            },
          ],
        },
        USER_ID,
        applySwap,
      );

      expect(applySwap.mock.calls[0][1]).toMatchObject({
        player1EventId: SUB_IN_ID,
        swap1EventId: SWAP_1_ID,
        swap2EventId: SWAP_2_ID,
      });
    });

    it('publishes one CREATED per substitution (SUB_OUT) and per swap (first event) when applied', async () => {
      await service.batchLineupChanges(
        {
          ...baseInput,
          swaps: [
            { player1: { eventId: 'e1' }, player2: { eventId: 'e2' } },
            { player1: { eventId: 'e3' }, player2: { eventId: 'e4' } },
          ],
        },
        USER_ID,
        applySwap,
      );

      const publish = mockCoreService.publishGameEvent as jest.Mock;
      expect(publish).toHaveBeenCalledTimes(4);
      expect(publish.mock.calls.map((c) => c[2].id)).toEqual([
        SUB_OUT_ID,
        SUB_OUT_2_ID,
        'swap-1-a',
        'swap-2-a',
      ]);
      for (const call of publish.mock.calls) {
        expect(call[0]).toBe(GAME_ID);
        expect(call[1]).toBe('CREATED');
      }
    });

    it('returns the recorded events and publishes nothing on a retry', async () => {
      const recorded = [{ id: SUB_OUT_ID }, { id: SUB_IN_ID }];
      mockReceiptService.applyOnce.mockImplementation(
        async (_action, { replay }) => ({
          result: await replay([SUB_OUT_ID, SUB_IN_ID]),
          replayed: true,
        }),
      );
      mockReceiptService.loadEvents.mockResolvedValue(recorded);

      const { events } = await service.batchLineupChanges(
        { ...baseInput, actionId: ACTION_ID },
        USER_ID,
        applySwap,
      );

      expect(events).toBe(recorded);
      expect(mockReceiptService.loadEvents).toHaveBeenCalledWith([
        SUB_OUT_ID,
        SUB_IN_ID,
      ]);
      expect(mockGameEventsRepository.insert).not.toHaveBeenCalled();
      expect(applySwap).not.toHaveBeenCalled();
      expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
    });

    it('throws BadRequest for an unresolvable substitutionIndex, publishing nothing', async () => {
      await expect(
        service.batchLineupChanges(
          {
            ...baseInput,
            swaps: [
              {
                player1: { substitutionIndex: 5 },
                player2: { eventId: 'e2' },
              },
            ],
          },
          USER_ID,
          applySwap,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Could not resolve substitution index 5 for player1',
        ),
      );
      expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
    });
  });
});

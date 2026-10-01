import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { GameEvent } from '../../../entities/game-event.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { EventType } from '../../../entities/event-type.entity';
import { PositionChangeReason } from '../dto/record-position-change.input';

import { EventManagementService } from './event-management.service';
import { EventCoreService } from './event-core.service';
import { GoalService } from './goal.service';
import { SubstitutionService } from './substitution.service';
import { ActionReceiptService } from './action-receipt.service';

// ─── helpers ────────────────────────────────────────────────────────────────

const GAME_TEAM_ID = 'gt-1';
const GAME_ID = 'game-1';
const USER_ID = 'user-1';
const ACTION_ID = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';
const SWAP_1_ID = '7a1c2e3f-4b5d-4c6e-9f8a-0b1c2d3e4f5a';
const SWAP_2_ID = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const EVENT_ID = 'abcdef01-2345-4678-89ab-cdef01234567';

function makeEventType(name: string): EventType {
  return { id: `et-${name}`, name } as EventType;
}

function makeEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'evt',
    gameId: GAME_ID,
    gameTeamId: GAME_TEAM_ID,
    playerId: 'player',
    position: 'CM',
    eventType: makeEventType('SUBSTITUTION_IN'),
    ...overrides,
  } as GameEvent;
}

// ─── test setup ─────────────────────────────────────────────────────────────

describe('EventManagementService', () => {
  let service: EventManagementService;

  let mockEventsRepo: jest.Mocked<Partial<Repository<GameEvent>>>;
  let mockGameTeamRepo: { update: jest.Mock };
  let mockCoreService: jest.Mocked<Partial<EventCoreService>>;
  let mockReceiptService: { applyOnce: jest.Mock; loadEvents: jest.Mock };

  /** Makes applyOnce report a retry whose recorded events are `recorded`. */
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
    mockEventsRepo = {
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      insert: jest.fn().mockResolvedValue({ identifiers: [] }),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOneOrFail: jest
        .fn()
        .mockImplementation(({ where }) => Promise.resolve({ id: where.id })),
    };
    mockGameTeamRepo = { update: jest.fn().mockResolvedValue(undefined) };

    mockCoreService = {
      gameEventsRepository: mockEventsRepo as unknown as Repository<GameEvent>,
      getGameTeam: jest
        .fn()
        .mockResolvedValue({ id: GAME_TEAM_ID, gameId: GAME_ID }),
      getEventTypeByName: jest.fn().mockImplementation(makeEventType),
      publishGameEvent: jest.fn().mockResolvedValue(undefined),
    };

    // Runs `apply` against the mocked repositories, as if inside the
    // transaction. Individual tests override applyOnce to simulate a replay.
    const fakeManager = {
      getRepository: (entity: unknown) =>
        entity === GameTeam ? mockGameTeamRepo : mockEventsRepo,
    };
    mockReceiptService = {
      applyOnce: jest.fn(async (_action, { apply }) => ({
        result: (await apply(fakeManager)).result,
        replayed: false,
      })),
      loadEvents: jest.fn(),
    };

    service = new EventManagementService(
      mockCoreService as unknown as EventCoreService,
      {} as unknown as GoalService,
      {} as unknown as SubstitutionService,
      mockReceiptService as unknown as ActionReceiptService,
    );
  });

  // ─── swapPositions / applySwap ────────────────────────────────────────────

  describe('swapPositions', () => {
    const input = {
      gameTeamId: GAME_TEAM_ID,
      player1EventId: 'p1-evt',
      player2EventId: 'p2-evt',
      period: '2',
      periodSecond: 600,
    };

    beforeEach(() => {
      (mockEventsRepo.findOne as jest.Mock).mockImplementation(({ where }) =>
        Promise.resolve(
          where.id === 'p1-evt'
            ? makeEvent({ id: 'p1-evt', playerId: 'p1', position: 'LM' })
            : makeEvent({ id: 'p2-evt', playerId: 'p2', position: 'RM' }),
        ),
      );
    });

    it('applies once per actionId as kind swapPositions', async () => {
      await service.swapPositions({ ...input, actionId: ACTION_ID }, USER_ID);

      expect(mockReceiptService.applyOnce).toHaveBeenCalledWith(
        {
          actionId: ACTION_ID,
          gameId: GAME_ID,
          recordedByUserId: USER_ID,
          kind: 'swapPositions',
        },
        expect.objectContaining({
          apply: expect.any(Function),
          replay: expect.any(Function),
        }),
      );
    });

    it('applies client IDs and occurredAt, linking swap2 to swap1', async () => {
      const occurredAt = new Date(Date.now() - 60_000);

      const [swap1, swap2] = await service.swapPositions(
        {
          ...input,
          swap1EventId: SWAP_1_ID,
          swap2EventId: SWAP_2_ID,
          occurredAt,
        },
        USER_ID,
      );

      expect(swap1).toMatchObject({ id: SWAP_1_ID, occurredAt });
      expect(swap2).toMatchObject({
        id: SWAP_2_ID,
        occurredAt,
        parentEventId: swap1.id,
      });
      expect(swap2.parentEventId).toBe(SWAP_1_ID);
    });

    it('exchanges the two players positions', async () => {
      const [swap1, swap2] = await service.swapPositions(input, USER_ID);

      expect(swap1).toMatchObject({ playerId: 'p1', position: 'RM' });
      expect(swap2).toMatchObject({ playerId: 'p2', position: 'LM' });
    });

    it('inserts both rows rather than saving', async () => {
      await service.swapPositions(input, USER_ID);

      expect(mockEventsRepo.insert).toHaveBeenCalledTimes(2);
      expect(mockEventsRepo.save).not.toHaveBeenCalled();
    });

    it('publishes the first swap once when applied', async () => {
      const [swap1] = await service.swapPositions(input, USER_ID);

      expect(mockCoreService.publishGameEvent).toHaveBeenCalledTimes(1);
      expect(mockCoreService.publishGameEvent).toHaveBeenCalledWith(
        GAME_ID,
        'CREATED',
        swap1,
      );
    });

    it('returns the recorded events and publishes nothing on a retry', async () => {
      const recorded = [{ id: SWAP_1_ID }, { id: SWAP_2_ID }];
      replayWith(recorded);

      const result = await service.swapPositions(
        { ...input, actionId: ACTION_ID },
        USER_ID,
      );

      expect(result).toBe(recorded);
      expect(mockEventsRepo.insert).not.toHaveBeenCalled();
      expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
    });

    it('rejects a swap1EventId that is not a UUID', async () => {
      await expect(
        service.swapPositions({ ...input, swap1EventId: 'swap-1' }, USER_ID),
      ).rejects.toThrow(new BadRequestException('swap1EventId must be a UUID'));
      expect(mockEventsRepo.insert).not.toHaveBeenCalled();
      expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
    });

    it('rejects a swap2EventId that is not a UUID', async () => {
      await expect(
        service.swapPositions({ ...input, swap2EventId: 'swap-2' }, USER_ID),
      ).rejects.toThrow(new BadRequestException('swap2EventId must be a UUID'));
    });

    it('requires both players to have positions', async () => {
      (mockEventsRepo.findOne as jest.Mock).mockImplementation(({ where }) =>
        Promise.resolve(
          makeEvent({
            id: where.id,
            position: where.id === 'p1-evt' ? undefined : 'RM',
          }),
        ),
      );

      await expect(service.swapPositions(input, USER_ID)).rejects.toThrow(
        new BadRequestException('Both players must have positions to swap'),
      );
      expect(mockEventsRepo.insert).not.toHaveBeenCalled();
      expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when a player event is missing', async () => {
      (mockEventsRepo.findOne as jest.Mock).mockImplementation(({ where }) =>
        Promise.resolve(where.id === 'p1-evt' ? null : makeEvent()),
      );

      await expect(service.swapPositions(input, USER_ID)).rejects.toThrow(
        new NotFoundException('GameEvent p1-evt not found'),
      );
    });
  });

  // ─── recordPositionChange ─────────────────────────────────────────────────

  describe('recordPositionChange', () => {
    const input = {
      gameTeamId: GAME_TEAM_ID,
      playerEventId: 'entry-evt',
      newPosition: 'ST',
      period: '2',
      periodSecond: 300,
    };

    beforeEach(() => {
      (mockEventsRepo.findOne as jest.Mock).mockResolvedValue(
        makeEvent({ id: 'entry-evt', playerId: 'p1', position: 'CM' }),
      );
    });

    it('applies once per actionId as kind recordPositionChange', async () => {
      await service.recordPositionChange(
        { ...input, actionId: ACTION_ID },
        USER_ID,
      );

      expect(mockReceiptService.applyOnce).toHaveBeenCalledWith(
        {
          actionId: ACTION_ID,
          gameId: GAME_ID,
          recordedByUserId: USER_ID,
          kind: 'recordPositionChange',
        },
        expect.objectContaining({
          apply: expect.any(Function),
          replay: expect.any(Function),
        }),
      );
    });

    it('inserts the row with the client ID and occurredAt, not save', async () => {
      const occurredAt = new Date(Date.now() - 60_000);

      await service.recordPositionChange(
        { ...input, eventId: EVENT_ID, occurredAt },
        USER_ID,
      );

      expect(mockEventsRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: EVENT_ID,
          occurredAt,
          position: 'ST',
          playerId: 'p1',
        }),
      );
      expect(mockEventsRepo.save).not.toHaveBeenCalled();
    });

    it('records the previous position from the player history', async () => {
      (mockEventsRepo.find as jest.Mock).mockResolvedValue([
        makeEvent({ playerId: 'p1', position: 'CM' }),
        makeEvent({
          playerId: 'p1',
          position: 'LM',
          eventType: makeEventType('POSITION_SWAP'),
        }),
        makeEvent({ playerId: 'other', position: 'GK' }),
      ]);

      await service.recordPositionChange(
        { ...input, reason: PositionChangeReason.FORMATION_CHANGE },
        USER_ID,
      );

      expect(mockEventsRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            previousPosition: 'LM',
            newPosition: 'ST',
            reason: PositionChangeReason.FORMATION_CHANGE,
          },
        }),
      );
    });

    it('publishes the event with relations once when applied', async () => {
      const withRelations = { id: 'loaded' };
      (mockEventsRepo.findOneOrFail as jest.Mock).mockResolvedValue(
        withRelations,
      );

      const result = await service.recordPositionChange(input, USER_ID);

      expect(result).toBe(withRelations);
      expect(mockCoreService.publishGameEvent).toHaveBeenCalledTimes(1);
      expect(mockCoreService.publishGameEvent).toHaveBeenCalledWith(
        GAME_ID,
        'CREATED',
        withRelations,
      );
    });

    it('returns the recorded event and publishes nothing on a retry', async () => {
      const recorded = { id: EVENT_ID };
      replayWith([recorded]);

      const result = await service.recordPositionChange(
        { ...input, actionId: ACTION_ID },
        USER_ID,
      );

      expect(result).toBe(recorded);
      expect(mockEventsRepo.findOne).not.toHaveBeenCalled();
      expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
    });

    it('throws a conflict on a retry whose event has since been deleted', async () => {
      replayWith([]);

      await expect(
        service.recordPositionChange(
          { ...input, actionId: ACTION_ID },
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
        service.recordPositionChange({ ...input, eventId: 'evt-x' }, USER_ID),
      ).rejects.toThrow(new BadRequestException('eventId must be a UUID'));
      expect(mockReceiptService.applyOnce).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the player event is missing', async () => {
      (mockEventsRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.recordPositionChange(input, USER_ID),
      ).rejects.toThrow(
        new NotFoundException('Player event entry-evt not found'),
      );
      expect(mockEventsRepo.insert).not.toHaveBeenCalled();
      expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
    });
  });

  // ─── recordFormationChange ────────────────────────────────────────────────

  describe('recordFormationChange', () => {
    const input = {
      gameTeamId: GAME_TEAM_ID,
      formation: '4-3-3',
      period: '2',
      periodSecond: 120,
    };

    beforeEach(() => {
      (mockCoreService.getGameTeam as jest.Mock).mockResolvedValue({
        id: GAME_TEAM_ID,
        gameId: GAME_ID,
        formation: '4-4-2',
      });
    });

    it('applies once per actionId as kind recordFormationChange', async () => {
      await service.recordFormationChange(
        { ...input, actionId: ACTION_ID },
        USER_ID,
      );

      expect(mockReceiptService.applyOnce).toHaveBeenCalledWith(
        {
          actionId: ACTION_ID,
          gameId: GAME_ID,
          recordedByUserId: USER_ID,
          kind: 'recordFormationChange',
        },
        expect.objectContaining({
          apply: expect.any(Function),
          replay: expect.any(Function),
        }),
      );
    });

    it('inserts the row with the client ID, occurredAt and previous formation, not save', async () => {
      const occurredAt = new Date(Date.now() - 60_000);

      await service.recordFormationChange(
        { ...input, eventId: EVENT_ID, occurredAt },
        USER_ID,
      );

      expect(mockEventsRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: EVENT_ID,
          occurredAt,
          formation: '4-3-3',
          metadata: { previousFormation: '4-4-2', newFormation: '4-3-3' },
        }),
      );
      expect(mockEventsRepo.save).not.toHaveBeenCalled();
    });

    it('updates the game team formation through the transaction manager', async () => {
      await service.recordFormationChange(input, USER_ID);

      expect(mockGameTeamRepo.update).toHaveBeenCalledWith(
        { id: GAME_TEAM_ID },
        { formation: '4-3-3' },
      );
    });

    it('publishes the event with relations once when applied', async () => {
      const withRelations = { id: 'loaded' };
      (mockEventsRepo.findOneOrFail as jest.Mock).mockResolvedValue(
        withRelations,
      );

      const result = await service.recordFormationChange(input, USER_ID);

      expect(result).toBe(withRelations);
      expect(mockCoreService.publishGameEvent).toHaveBeenCalledTimes(1);
      expect(mockCoreService.publishGameEvent).toHaveBeenCalledWith(
        GAME_ID,
        'CREATED',
        withRelations,
      );
    });

    it('returns the recorded event, writes nothing and publishes nothing on a retry', async () => {
      const recorded = { id: EVENT_ID };
      replayWith([recorded]);

      const result = await service.recordFormationChange(
        { ...input, actionId: ACTION_ID },
        USER_ID,
      );

      expect(result).toBe(recorded);
      expect(mockEventsRepo.insert).not.toHaveBeenCalled();
      expect(mockGameTeamRepo.update).not.toHaveBeenCalled();
      expect(mockCoreService.publishGameEvent).not.toHaveBeenCalled();
    });

    it('throws a conflict on a retry whose event has since been deleted', async () => {
      replayWith([]);

      await expect(
        service.recordFormationChange(
          { ...input, actionId: ACTION_ID },
          USER_ID,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects an eventId that is not a UUID', async () => {
      await expect(
        service.recordFormationChange({ ...input, eventId: 'evt-x' }, USER_ID),
      ).rejects.toThrow(new BadRequestException('eventId must be a UUID'));
      expect(mockReceiptService.applyOnce).not.toHaveBeenCalled();
      expect(mockGameTeamRepo.update).not.toHaveBeenCalled();
    });
  });
});

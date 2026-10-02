import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { GameEvent } from '../../../entities/game-event.entity';
import { EventType } from '../../../entities/event-type.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { GameEventAction } from '../dto/game-event-subscription.output';
import { RecordGoalInput } from '../dto/record-goal.input';

import { GoalService } from './goal.service';
import { EventCoreService } from './event-core.service';
import { ActionReceiptService } from './action-receipt.service';

const GAME_ID = 'game-1';
const GAME_TEAM_ID = 'gt-1';
const USER_ID = 'user-1';
const SCORER_ID = 'player-9';
const ASSISTER_ID = 'player-10';
const ACTION_ID = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';
const GOAL_ID = '7a1c2e3f-4b5d-4c6e-9f8a-0b1c2d3e4f5a';
const ASSIST_ID = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

const NO_MATCH = { isDuplicate: false, isConflict: false };

describe('GoalService.recordGoal', () => {
  let service: GoalService;
  let repo: {
    create: jest.Mock;
    insert: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    find: jest.Mock;
  };
  let core: {
    gameEventsRepository: Repository<GameEvent>;
    getGameTeam: jest.Mock;
    getEventTypeByName: jest.Mock;
    checkForDuplicateOrConflict: jest.Mock;
    publishGameEvent: jest.Mock;
    buildConflictInfo: jest.Mock;
  };
  let receipts: { applyOnce: jest.Mock; loadEvents: jest.Mock };

  const baseInput: RecordGoalInput = {
    gameTeamId: GAME_TEAM_ID,
    scorerId: SCORER_ID,
    period: '2',
    periodSecond: 480,
  };

  beforeEach(() => {
    repo = {
      create: jest.fn((data) => ({ ...data })),
      insert: jest.fn().mockResolvedValue({ identifiers: [] }),
      save: jest.fn((e) => Promise.resolve(e)),
      update: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([]),
    };
    core = {
      gameEventsRepository: repo as unknown as Repository<GameEvent>,
      getGameTeam: jest
        .fn()
        .mockResolvedValue({ id: GAME_TEAM_ID, gameId: GAME_ID } as GameTeam),
      getEventTypeByName: jest.fn(
        (name: string) => ({ id: `et-${name}`, name }) as EventType,
      ),
      checkForDuplicateOrConflict: jest.fn().mockResolvedValue(NO_MATCH),
      publishGameEvent: jest.fn().mockResolvedValue(undefined),
      buildConflictInfo: jest.fn().mockReturnValue({ conflictId: 'c-1' }),
    };
    receipts = {
      applyOnce: jest.fn(async (_action, { apply }) => ({
        result: (await apply({ getRepository: () => repo })).result,
        replayed: false,
      })),
      loadEvents: jest.fn(),
    };
    service = new GoalService(
      core as unknown as EventCoreService,
      receipts as unknown as ActionReceiptService,
    );
  });

  it('applies the goal once per actionId', async () => {
    await service.recordGoal({ ...baseInput, actionId: ACTION_ID }, USER_ID);

    expect(receipts.applyOnce).toHaveBeenCalledWith(
      {
        actionId: ACTION_ID,
        gameId: GAME_ID,
        recordedByUserId: USER_ID,
        kind: 'recordGoal',
      },
      expect.objectContaining({ apply: expect.any(Function) }),
    );
  });

  it('inserts the goal and its assist with client IDs and occurredAt, linked', async () => {
    const occurredAt = new Date(Date.now() - 20_000);

    const goal = await service.recordGoal(
      {
        ...baseInput,
        assisterId: ASSISTER_ID,
        actionId: ACTION_ID,
        goalEventId: GOAL_ID,
        assistEventId: ASSIST_ID,
        occurredAt,
      },
      USER_ID,
    );

    expect(goal).toMatchObject({
      id: GOAL_ID,
      playerId: SCORER_ID,
      occurredAt,
    });
    expect(repo.insert).toHaveBeenCalledTimes(2);
    expect(repo.insert.mock.calls[1][0]).toMatchObject({
      id: ASSIST_ID,
      playerId: ASSISTER_ID,
      parentEventId: GOAL_ID,
      occurredAt,
    });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('publishes CREATED once for a new goal', async () => {
    await service.recordGoal(baseInput, USER_ID);

    expect(core.publishGameEvent).toHaveBeenCalledTimes(1);
    expect(core.publishGameEvent.mock.calls[0][1]).toBe(
      GameEventAction.CREATED,
    );
  });

  it('returns the recorded goal and publishes nothing on a retry', async () => {
    const recorded = { id: GOAL_ID } as GameEvent;
    receipts.applyOnce.mockImplementation(async (_action, { replay }) => ({
      result: await replay([GOAL_ID, ASSIST_ID]),
      replayed: true,
    }));
    receipts.loadEvents.mockResolvedValue([recorded]);

    const goal = await service.recordGoal(
      { ...baseInput, actionId: ACTION_ID },
      USER_ID,
    );

    expect(goal).toBe(recorded);
    expect(core.checkForDuplicateOrConflict).not.toHaveBeenCalled();
    expect(core.publishGameEvent).not.toHaveBeenCalled();
  });

  it('keeps the duplicate rule: returns the existing goal and publishes DUPLICATE_DETECTED', async () => {
    const existing = { id: 'existing-goal' } as GameEvent;
    core.checkForDuplicateOrConflict.mockResolvedValue({
      isDuplicate: true,
      isConflict: false,
      existingEvent: existing,
    });

    const goal = await service.recordGoal(
      { ...baseInput, actionId: ACTION_ID },
      USER_ID,
    );

    expect(goal).toBe(existing);
    expect(repo.insert).not.toHaveBeenCalled();
    expect(core.publishGameEvent.mock.calls[0][1]).toBe(
      GameEventAction.DUPLICATE_DETECTED,
    );
  });

  it('keeps the conflict rule: flags both goals in the transaction and publishes CONFLICT_DETECTED', async () => {
    core.checkForDuplicateOrConflict.mockResolvedValue({
      isDuplicate: false,
      isConflict: true,
      conflictingEvents: [{ id: 'other-goal' } as GameEvent],
    });

    const goal = await service.recordGoal(baseInput, USER_ID);

    expect(repo.update).toHaveBeenCalledWith(
      { id: 'other-goal' },
      { conflictId: goal.conflictId },
    );
    expect(goal.conflictId).toEqual(expect.any(String));
    expect(core.publishGameEvent.mock.calls[0][1]).toBe(
      GameEventAction.CONFLICT_DETECTED,
    );
  });

  it('rejects a client goal ID that is not a UUID', async () => {
    await expect(
      service.recordGoal({ ...baseInput, goalEventId: 'goal-1' }, USER_ID),
    ).rejects.toThrow(new BadRequestException('goalEventId must be a UUID'));
    expect(receipts.applyOnce).not.toHaveBeenCalled();
  });
});

import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { AppliedAction } from '../../../entities/applied-action.entity';

import {
  ActionReceiptService,
  type ClientAction,
} from './action-receipt.service';

const ACTION_ID = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';
const GAME_ID = 'game-1';
const USER_ID = 'user-1';

function makeAction(overrides: Partial<ClientAction> = {}): ClientAction {
  return {
    actionId: ACTION_ID,
    gameId: GAME_ID,
    recordedByUserId: USER_ID,
    kind: 'substitutePlayer',
    ...overrides,
  };
}

describe('ActionReceiptService', () => {
  let manager: {
    query: jest.Mock;
    update: jest.Mock;
    findOneBy: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let service: ActionReceiptService;

  beforeEach(() => {
    manager = {
      // Default: the receipt insert succeeds (first time this action is seen).
      query: jest.fn().mockResolvedValue([{ actionId: ACTION_ID }]),
      update: jest.fn().mockResolvedValue(undefined),
      findOneBy: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn((work: (m: EntityManager) => unknown) =>
        work(manager as unknown as EntityManager),
      ),
    };
    service = new ActionReceiptService(dataSource as unknown as DataSource);
  });

  it('applies a new action inside a transaction and records its event IDs', async () => {
    const apply = jest
      .fn()
      .mockResolvedValue({ result: 'applied', eventIds: ['e1', 'e2'] });
    const replay = jest.fn();

    const outcome = await service.applyOnce(makeAction(), { apply, replay });

    expect(outcome).toEqual({ result: 'applied', replayed: false });
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(manager);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT ("actionId") DO NOTHING'),
      [ACTION_ID, GAME_ID, USER_ID, 'substitutePlayer'],
    );
    expect(manager.update).toHaveBeenCalledWith(
      AppliedAction,
      { actionId: ACTION_ID },
      { resultEventIds: ['e1', 'e2'] },
    );
    expect(replay).not.toHaveBeenCalled();
  });

  it('replays the recorded result without applying again when the action was already applied', async () => {
    manager.query.mockResolvedValue([]); // insert hit the existing receipt
    manager.findOneBy.mockResolvedValue({
      actionId: ACTION_ID,
      gameId: GAME_ID,
      recordedByUserId: USER_ID,
      kind: 'substitutePlayer',
      resultEventIds: ['e1', 'e2'],
    });
    const apply = jest.fn();
    const replay = jest.fn().mockResolvedValue('replayed-result');

    const outcome = await service.applyOnce(makeAction(), { apply, replay });

    expect(outcome).toEqual({ result: 'replayed-result', replayed: true });
    expect(apply).not.toHaveBeenCalled();
    expect(replay).toHaveBeenCalledWith(['e1', 'e2']);
  });

  it('rejects reusing an action ID for a different game or user', async () => {
    manager.query.mockResolvedValue([]);
    manager.findOneBy.mockResolvedValue({
      actionId: ACTION_ID,
      gameId: 'another-game',
      recordedByUserId: USER_ID,
      kind: 'substitutePlayer',
      resultEventIds: [],
    });

    await expect(
      service.applyOnce(makeAction(), { apply: jest.fn(), replay: jest.fn() }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects reusing an action ID for a different kind of action', async () => {
    manager.query.mockResolvedValue([]);
    manager.findOneBy.mockResolvedValue({
      actionId: ACTION_ID,
      gameId: GAME_ID,
      recordedByUserId: USER_ID,
      kind: 'swapPositions',
      resultEventIds: [],
    });

    await expect(
      service.applyOnce(makeAction(), { apply: jest.fn(), replay: jest.fn() }),
    ).rejects.toThrow(BadRequestException);
  });

  it('still uses a transaction but writes no receipt when no action ID is given', async () => {
    const apply = jest
      .fn()
      .mockResolvedValue({ result: 'applied', eventIds: ['e1'] });

    const outcome = await service.applyOnce(
      makeAction({ actionId: undefined }),
      { apply, replay: jest.fn() },
    );

    expect(outcome).toEqual({ result: 'applied', replayed: false });
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).not.toHaveBeenCalled();
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('rejects a malformed action ID before touching the database', async () => {
    await expect(
      service.applyOnce(makeAction({ actionId: 'not-a-uuid' }), {
        apply: jest.fn(),
        replay: jest.fn(),
      }),
    ).rejects.toThrow(new BadRequestException('actionId must be a UUID'));
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('propagates a failure from apply so the transaction (and receipt) roll back', async () => {
    const apply = jest.fn().mockRejectedValue(new Error('validation failed'));

    await expect(
      service.applyOnce(makeAction(), { apply, replay: jest.fn() }),
    ).rejects.toThrow('validation failed');
    expect(manager.update).not.toHaveBeenCalled();
  });
});

import { RecordGoalInput } from '../dto/record-goal.input';

import { GoalService } from './goal.service';
import { EventCoreService } from './event-core.service';

describe('local-first goal idempotency', () => {
  const input = {
    clientActionId: '11111111-1111-4111-8111-111111111111',
    gameTeamId: 'team',
    period: '1',
    periodSecond: 12,
    assisterId: 'assist',
  } as RecordGoalInput & { clientActionId: string };
  function setup() {
    let receipt: { payload: string; result: object } | undefined;
    let rows: object[] = [];
    let lock = Promise.resolve();
    const repo = {
      create: jest.fn((x) => x),
      insert: jest.fn(async (x) => {
        rows.push({ ...x });
      }),
      findOneByOrFail: jest.fn(async ({ id }) =>
        rows.find((row: any) => row.id === id),
      ),
      update: jest.fn(async () => undefined),
      find: jest.fn(async () => []),
      save: jest.fn(async (x) => {
        const row = { ...x, id: x.id || 'assist-id' };
        rows.push(row);
        return row;
      }),
    };
    const manager = {
      getRepository: () => repo,
      query: jest.fn(async (sql: string, params: unknown[]) => {
        if (sql.startsWith('SELECT payload')) return receipt ? [receipt] : [];
        if (sql.startsWith('INSERT INTO goal_action_receipts'))
          receipt = {
            payload: params[2] as string,
            result: JSON.parse(params[3] as string),
          };
        return [];
      }),
    };
    const transaction = jest.fn((fn) => {
      const work = lock.then(async () => {
        const before = [...rows];
        try {
          return await fn(manager);
        } catch (e) {
          rows = before;
          throw e;
        }
      });
      lock = work.catch(() => undefined);
      return work;
    });
    const core = {
      gameEventsRepository: { ...repo, manager: { transaction } },
      getGameTeam: jest.fn(async () => ({ gameId: 'game' })),
      getEventTypeByName: (name: string) => ({ id: name }),
      checkForDuplicateOrConflict: jest.fn(async () => ({
        isDuplicate: false,
      })),
      publishGameEvent: jest.fn(async () => undefined),
      buildConflictInfo: jest.fn(() => ({ conflictId: 'conflict' })),
    };
    return {
      service: new GoalService(core as unknown as EventCoreService),
      core,
      repo,
      transaction,
      rows: () => rows,
    };
  }
  it.each(['22001', '23503', '23505', '23514'])(
    'maps permanent database rejection %s to BAD_REQUEST',
    async (code) => {
      const s = setup();
      s.transaction.mockRejectedValueOnce(
        Object.assign(new Error('database details'), { driverError: { code } }),
      );
      await expect(s.service.recordGoal(input, 'user')).rejects.toMatchObject({
        status: 400,
      });
      expect(s.core.publishGameEvent).not.toHaveBeenCalled();
    },
  );
  it('commits goal and assist once on concurrent retries', async () => {
    const s = setup();
    const results = await Promise.all([
      s.service.recordGoal(input, 'user'),
      s.service.recordGoal(input, 'user'),
    ]);
    expect(s.transaction).toHaveBeenCalledTimes(2);
    expect(s.rows()).toHaveLength(2);
    expect(results[0].id).toBe(input.clientActionId);
    expect(results[1].id).toBe(results[0].id);
    // The retry is answered from the receipt before semantic dedup runs
    expect(s.core.checkForDuplicateOrConflict).toHaveBeenCalledTimes(1);
  });
  it('returns the existing goal when another device already recorded it', async () => {
    const s = setup();
    s.repo.insert({ id: 'existing-goal', gameTeamId: 'team' });
    s.core.checkForDuplicateOrConflict.mockResolvedValueOnce({
      isDuplicate: true,
      existingEvent: { id: 'existing-goal' },
    } as never);
    const result = await s.service.recordGoal(input, 'user');
    expect(result.id).toBe('existing-goal');
    expect(s.rows()).toHaveLength(1);
    expect(s.core.publishGameEvent).toHaveBeenCalledWith(
      'game',
      'DUPLICATE_DETECTED',
      expect.objectContaining({ id: 'existing-goal' }),
    );
    // A retry replays the receipt instead of re-running dedup or publishing
    await s.service.recordGoal(input, 'user');
    expect(s.core.checkForDuplicateOrConflict).toHaveBeenCalledTimes(1);
    expect(s.core.publishGameEvent).toHaveBeenCalledTimes(1);
  });
  it('flags a conflicting goal from another device and publishes CONFLICT_DETECTED', async () => {
    const s = setup();
    s.core.checkForDuplicateOrConflict.mockResolvedValueOnce({
      isDuplicate: false,
      isConflict: true,
      conflictingEvents: [{ id: 'other-goal' }],
    } as never);
    const result = await s.service.recordGoal(input, 'user');
    const conflictId = (result as { conflictId?: string }).conflictId;
    expect(conflictId).toEqual(expect.any(String));
    expect(s.repo.update).toHaveBeenCalledWith(
      { id: expect.anything() },
      { conflictId },
    );
    expect(s.core.publishGameEvent).toHaveBeenCalledWith(
      'game',
      'CONFLICT_DETECTED',
      expect.objectContaining({ id: input.clientActionId }),
      undefined,
      { conflictId: 'conflict' },
    );
  });
  it('rolls back goal if assist fails and does not publish', async () => {
    const s = setup();
    s.repo.save.mockRejectedValueOnce(new Error('assist failure'));
    await expect(s.service.recordGoal(input, 'user')).rejects.toThrow(
      'assist failure',
    );
    expect(s.transaction).toHaveBeenCalled();
    expect(s.rows()).toHaveLength(0);
    expect(s.core.publishGameEvent).not.toHaveBeenCalled();
  });
  it('replays after lost publish acknowledgement without another write', async () => {
    const s = setup();
    s.core.publishGameEvent.mockRejectedValueOnce(new Error('lost ack'));
    await expect(s.service.recordGoal(input, 'user')).rejects.toThrow(
      'lost ack',
    );
    await s.service.recordGoal(input, 'user');
    expect(s.rows()).toHaveLength(2);
  });
  it('never overwrites an existing event when a new action collides with its ID', async () => {
    const s = setup();
    (s.repo as any).insert = jest
      .fn()
      .mockRejectedValue(new Error('duplicate key'));
    await expect(s.service.recordGoal(input, 'other-user')).rejects.toThrow(
      'duplicate key',
    );
    expect(s.repo.save).not.toHaveBeenCalled();
    expect(s.core.publishGameEvent).not.toHaveBeenCalled();
  });
  it('does not replay deleted or edited historical goal events into subscriptions', async () => {
    const s = setup();
    await s.service.recordGoal(input, 'user');
    await s.service.recordGoal(input, 'user');
    expect(s.core.publishGameEvent).toHaveBeenCalledTimes(1);
  });
  it('rejects reuse of an action ID with different payload', async () => {
    const s = setup();
    await s.service.recordGoal(input, 'user');
    await expect(
      s.service.recordGoal({ ...input, periodSecond: 99 }, 'user'),
    ).rejects.toThrow('different payload');
  });
});

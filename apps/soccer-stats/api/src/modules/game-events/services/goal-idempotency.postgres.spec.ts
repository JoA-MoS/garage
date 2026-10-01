import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import { DataSource } from 'typeorm';

import { migrations } from '../../../database/migrations';
import { GameEvent } from '../../../entities/game-event.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { RecordGoalInput } from '../dto/record-goal.input';

import { EventCoreService } from './event-core.service';
import { GoalService } from './goal.service';

// Explicit opt-in: creates/drops only a random isolated database on a test server.
const databaseUrl = process.env.GOAL_TEST_DATABASE_URL;
(databaseUrl ? describe : describe.skip)('goal receipts on PostgreSQL', () => {
  const schema = `goal_test_${randomUUID().replace(/-/g, '')}`;
  let db: DataSource;
  let service: GoalService;
  const publish = jest.fn(async () => undefined);
  const userId = randomUUID();
  const gameTeamId = randomUUID();
  const goalTypeId = randomUUID();
  const assistTypeId = randomUUID();
  const input = (): RecordGoalInput => ({
    clientActionId: randomUUID(),
    gameTeamId,
    period: '1',
    periodSecond: 12,
    externalScorerName: 'Scorer',
    externalAssisterName: 'Assist',
  });
  beforeAll(async () => {
    const admin = await new DataSource({
      type: 'postgres',
      url: databaseUrl,
    }).initialize();
    try {
      await admin.query(`CREATE DATABASE "${schema}"`);
    } finally {
      await admin.destroy();
    }
    const url = new URL(databaseUrl!);
    url.pathname = `/${schema}`;
    db = await new DataSource({
      type: 'postgres',
      url: url.toString(),
      entities: [join(__dirname, '../../../entities/*.entity.ts')],
      migrations,
      migrationsRun: true,
    }).initialize();

    const gameId = randomUUID(),
      teamId = randomUUID(),
      formatId = randomUUID();
    await db.query(
      'INSERT INTO users (id, "firstName", "lastName") VALUES ($1, $2, $3)',
      [userId, 'Test', 'Coach'],
    );
    await db.query(
      'INSERT INTO game_formats (id, name, "playersPerTeam") VALUES ($1, $2, 11)',
      [formatId, 'test'],
    );
    await db.query('INSERT INTO games (id, "gameFormatId") VALUES ($1, $2)', [
      gameId,
      formatId,
    ]);
    await db.query('INSERT INTO teams (id, name) VALUES ($1, $2)', [
      teamId,
      'Test',
    ]);
    await db.query(
      'INSERT INTO game_teams (id, "gameId", "teamId", "teamType") VALUES ($1, $2, $3, $4)',
      [gameTeamId, gameId, teamId, 'home'],
    );
    await db.query(
      'INSERT INTO event_types (id, name, category) VALUES ($1, $2, $3), ($4, $5, $3)',
      [goalTypeId, 'GOAL', 'SCORING', assistTypeId, 'ASSIST'],
    );
    service = new GoalService({
      gameEventsRepository: db.getRepository(GameEvent),
      getGameTeam: (id: string) =>
        db.getRepository(GameTeam).findOneByOrFail({ id }),
      getEventTypeByName: (name: string) => ({
        id: name === 'GOAL' ? goalTypeId : assistTypeId,
      }),
      publishGameEvent: publish,
    } as unknown as EventCoreService);
  }, 30000);
  beforeEach(async () => {
    publish.mockClear();
    await db.query('TRUNCATE game_events, goal_action_receipts CASCADE');
  });
  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
    const admin = await new DataSource({
      type: 'postgres',
      url: databaseUrl,
    }).initialize();
    try {
      await admin.query(`DROP DATABASE IF EXISTS "${schema}" WITH (FORCE)`);
    } finally {
      await admin.destroy();
    }
  });
  it('concurrent requests commit exactly one goal, assist and receipt', async () => {
    const action = input();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => service.recordGoal(action, userId)),
    );
    expect(new Set(results.map((result) => result.id))).toEqual(
      new Set([action.clientActionId]),
    );
    expect(await db.getRepository(GameEvent).count()).toBe(2);
    expect(await db.query('SELECT * FROM goal_action_receipts')).toHaveLength(
      1,
    );
    expect(publish).toHaveBeenCalledTimes(1);
  });
  it('assist constraint failure rolls back goal and receipt', async () => {
    await expect(
      service.recordGoal(
        { ...input(), externalAssisterName: 'x'.repeat(101) },
        userId,
      ),
    ).rejects.toThrow();
    expect(await db.getRepository(GameEvent).count()).toBe(0);
    expect(await db.query('SELECT * FROM goal_action_receipts')).toHaveLength(
      0,
    );
    expect(publish).not.toHaveBeenCalled();
  });
  it('lost publish acknowledgement replays; deletion never resurrects the event', async () => {
    const action = input();
    publish.mockRejectedValueOnce(new Error('lost acknowledgement'));
    await expect(service.recordGoal(action, userId)).rejects.toThrow(
      'lost acknowledgement',
    );
    await service.recordGoal(action, userId);
    expect(await db.getRepository(GameEvent).count()).toBe(2);
    await db.getRepository(GameEvent).delete(action.clientActionId!);
    await service.recordGoal(action, userId);
    expect(await db.getRepository(GameEvent).count()).toBe(0);
    expect(publish).toHaveBeenCalledTimes(1);
  });
  it('different payload and other-user collisions cannot mutate committed events', async () => {
    const action = input();
    await service.recordGoal(action, userId);
    await expect(
      service.recordGoal({ ...action, periodSecond: 13 }, userId),
    ).rejects.toThrow('different payload');
    await expect(service.recordGoal(action, randomUUID())).rejects.toThrow();
    expect(await db.getRepository(GameEvent).count()).toBe(2);
    expect(
      (
        await db
          .getRepository(GameEvent)
          .findOneByOrFail({ id: action.clientActionId })
      ).periodSecond,
    ).toBe(12);
  });
});

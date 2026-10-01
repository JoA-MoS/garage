/**
 * Parity check between the API's LineupService.getGameRoster SQL and the
 * shared deriveGameRoster() the UI uses (libs/soccer-stats/utils).
 *
 * 1. Every game team in the database: compares players, formation and
 *    previousPeriodLineup.
 * 2. 300 random event histories, inserted inside transactions that are
 *    rolled back. Times share milliseconds but differ in microseconds,
 *    which JS Dates can't see, to exercise the tie-breaking.
 *
 * Run against a local database only (it writes inside rolled-back
 * transactions). From the repo root:
 *
 *   set -a && . apps/soccer-stats/api/.env && set +a
 *   DB_LOGGING=false TS_NODE_PROJECT=apps/soccer-stats/api/tsconfig.app.json \
 *     npx ts-node --transpile-only apps/soccer-stats/api/scripts/roster-parity.ts
 *
 * Re-run after changing either getGameRoster or deriveGameRoster.
 */
import { deriveGameRoster } from '@garage/soccer-stats/utils';

import AppDataSource from '../src/database/data-source';

const norm = (v: unknown) => (v === null || v === undefined ? undefined : v);
const canon = (p: Record<string, unknown>) =>
  JSON.stringify({
    gameEventId: p.gameEventId,
    playerId: norm(p.playerId),
    externalPlayerName: norm(p.externalPlayerName),
    externalPlayerNumber: norm(p.externalPlayerNumber),
    position: p.position ?? null,
    firstName: norm(p.firstName),
    lastName: norm(p.lastName),
  });
const sortedCanon = (list: Record<string, unknown>[] | undefined) =>
  list ? list.map(canon).sort() : undefined;

async function main() {
  const ds = await AppDataSource.initialize();
  const teams: { id: string; defaultFormation: string | null }[] =
    await ds.query(`
    SELECT gt.id, tc."defaultFormation"
    FROM game_teams gt
    LEFT JOIN team_configurations tc ON tc."teamId" = gt."teamId"`);
  let compared = 0;
  const mismatches: string[] = [];

  for (const team of teams) {
    // Same SQL as LineupService.getGameRoster
    const sqlPlayers = await ds.query(
      `SELECT sub."gameEventId", sub."playerId", sub."externalPlayerName",
              sub."externalPlayerNumber", sub."position", sub."firstName", sub."lastName"
       FROM (
         SELECT e.id AS "gameEventId", e."playerId", e."externalPlayerName",
                e."externalPlayerNumber",
                CASE WHEN et.name = 'SUBSTITUTION_OUT' THEN NULL ELSE e.position END AS position,
                p."firstName", p."lastName",
                ROW_NUMBER() OVER (
                  PARTITION BY COALESCE(e."playerId"::text, e."externalPlayerName")
                  ORDER BY e.period DESC, e."periodSecond" DESC, e."createdAt" DESC) AS rn
         FROM game_events e
         JOIN event_types et ON e."eventTypeId" = et.id
         LEFT JOIN users p ON e."playerId" = p.id
         WHERE e."gameTeamId" = $1
           AND et.name IN ('GAME_ROSTER','SUBSTITUTION_IN','SUBSTITUTION_OUT','POSITION_SWAP','POSITION_CHANGE')
       ) sub WHERE sub.rn = 1`,
      [team.id],
    );
    const [formationRow] = await ds.query(
      `SELECT e.formation FROM game_events e JOIN event_types et ON e."eventTypeId" = et.id
       WHERE e."gameTeamId" = $1 AND et.name = 'FORMATION_CHANGE'
       ORDER BY e.period DESC, e."periodSecond" DESC, e."createdAt" DESC LIMIT 1`,
      [team.id],
    );
    const [periodEnd] = await ds.query(
      `SELECT e.id FROM game_events e JOIN event_types et ON e."eventTypeId" = et.id
       WHERE e."gameTeamId" = $1 AND et.name = 'PERIOD_END'
       ORDER BY e."createdAt" DESC LIMIT 1`,
      [team.id],
    );
    const sqlPrevious = periodEnd
      ? await ds.query(
          `SELECT e.id AS "gameEventId", e."playerId", e."externalPlayerName",
                  e."externalPlayerNumber", e.position, p."firstName", p."lastName"
           FROM game_events e JOIN event_types et ON e."eventTypeId" = et.id
           LEFT JOIN users p ON e."playerId" = p.id
           WHERE e."gameTeamId" = $1 AND et.name = 'SUBSTITUTION_OUT' AND e."parentEventId" = $2`,
          [team.id, periodEnd.id],
        )
      : undefined;

    // Same order as the gameEventsByGameTeamLoader the UI's events come from
    const rows = await ds.query(
      `SELECT e.id, et.name AS "typeName", e."playerId", e."externalPlayerName",
              e."externalPlayerNumber", e.position, e.formation, e.period,
              e."periodSecond", e."createdAt", e."parentEventId",
              p."firstName", p."lastName", p.id AS "userId"
       FROM game_events e JOIN event_types et ON e."eventTypeId" = et.id
       LEFT JOIN users p ON e."playerId" = p.id
       WHERE e."gameTeamId" = $1
       ORDER BY e.period ASC, e."periodSecond" ASC, e."createdAt" ASC`,
      [team.id],
    );
    if (rows.length === 0) continue;
    const derived = deriveGameRoster(
      rows.map((r: any) => ({
        id: r.id,
        eventType: { name: r.typeName },
        playerId: r.playerId,
        externalPlayerName: r.externalPlayerName,
        externalPlayerNumber: r.externalPlayerNumber,
        position: r.position,
        formation: r.formation,
        period: r.period,
        periodSecond: r.periodSecond,
        createdAt: new Date(r.createdAt).toISOString(), // ms, as GraphQL sends it
        parentEventId: r.parentEventId,
        player: r.userId
          ? { firstName: r.firstName, lastName: r.lastName }
          : null,
      })),
      { defaultFormation: team.defaultFormation },
    );
    compared++;

    const problems: string[] = [];
    const a = JSON.stringify(sortedCanon(sqlPlayers));
    const b = JSON.stringify(sortedCanon(derived.players as any));
    if (a !== b) problems.push(`players\n  sql:     ${a}\n  derived: ${b}`);
    const sqlFormation =
      formationRow?.formation ?? team.defaultFormation ?? null;
    if (sqlFormation !== derived.formation)
      problems.push(
        `formation sql=${sqlFormation} derived=${derived.formation}`,
      );
    const pa = JSON.stringify(sortedCanon(sqlPrevious));
    const pb = JSON.stringify(sortedCanon(derived.previousPeriodLineup as any));
    if (pa !== pb)
      problems.push(`previousPeriodLineup\n  sql:     ${pa}\n  derived: ${pb}`);
    if (problems.length)
      mismatches.push(`gameTeam ${team.id}: ${problems.join('\n')}`);
  }

  console.log(
    `compared ${compared} game teams, ${mismatches.length} mismatches`,
  );

  // ── Fuzz: random histories, rolled back ──────────────────────────────
  const [target] = await ds.query(
    `SELECT gt.id, gt."gameId" FROM game_teams gt LIMIT 1`,
  );
  const users: { id: string }[] = await ds.query(
    `SELECT id FROM users LIMIT 3`,
  );
  const types: { id: string; name: string }[] = await ds.query(
    `SELECT id, name FROM event_types WHERE name IN
     ('GAME_ROSTER','SUBSTITUTION_IN','SUBSTITUTION_OUT','POSITION_SWAP',
      'POSITION_CHANGE','FORMATION_CHANGE','PERIOD_END','GOAL')`,
  );
  const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
  const recorder = users[0].id;
  let fuzzMismatches = 0;
  const RUNS = 300;
  for (let run = 0; run < RUNS; run++) {
    const qr = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.query(`DELETE FROM game_events WHERE "gameTeamId" = $1`, [
        target.id,
      ]);
      const ids: string[] = [];
      const periodEnds: string[] = [];
      for (let i = 0; i < 12; i++) {
        const t = pick(types);
        const who = pick<[string | null, string | null]>([
          [users[0].id, null],
          [users[1].id, null],
          [users[2].id, null],
          [null, 'Guest A'],
          [null, 'Guest B'],
          [null, null],
        ]);
        // Same millisecond, different microseconds, to defeat JS Dates
        // Unique microseconds within one or two milliseconds: JS can't tell
        // them apart, Postgres can. Shuffled so insert order != time order.
        const micro = 100 + ((i * 7919 + run * 31) % 900);
        const created = `2026-01-01 10:00:00.00${i % 2}${micro}+00`;
        const parent =
          t.name === 'SUBSTITUTION_OUT' &&
          periodEnds.length &&
          Math.random() < 0.5
            ? pick(periodEnds)
            : null;
        const [row] = await qr.query(
          `INSERT INTO game_events ("gameId","eventTypeId","recordedByUserId","gameTeamId",
             "playerId","externalPlayerName",period,"periodSecond",position,formation,
             "parentEventId","createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
          [
            target.gameId,
            t.id,
            recorder,
            target.id,
            who[0],
            who[1],
            pick(['1', '2', null]),
            pick([0, 10, 10, 20]),
            pick(['GK', 'ST', null]),
            pick(['4-4-2', '4-3-3', null]),
            parent,
            created,
          ],
        );
        ids.push(row.id);
        if (t.name === 'PERIOD_END') periodEnds.push(row.id);
      }
      const sql = await qr.query(
        `SELECT sub."gameEventId", sub."playerId", sub."externalPlayerName",
                sub."externalPlayerNumber", sub."position", sub."firstName", sub."lastName"
         FROM (SELECT e.id AS "gameEventId", e."playerId", e."externalPlayerName",
                e."externalPlayerNumber",
                CASE WHEN et.name = 'SUBSTITUTION_OUT' THEN NULL ELSE e.position END AS position,
                p."firstName", p."lastName",
                ROW_NUMBER() OVER (PARTITION BY COALESCE(e."playerId"::text, e."externalPlayerName")
                  ORDER BY e.period DESC, e."periodSecond" DESC, e."createdAt" DESC) AS rn
               FROM game_events e JOIN event_types et ON e."eventTypeId" = et.id
               LEFT JOIN users p ON e."playerId" = p.id
               WHERE e."gameTeamId" = $1 AND et.name IN
                 ('GAME_ROSTER','SUBSTITUTION_IN','SUBSTITUTION_OUT','POSITION_SWAP','POSITION_CHANGE')
              ) sub WHERE sub.rn = 1`,
        [target.id],
      );
      const rows = await qr.query(
        `SELECT e.id, et.name AS "typeName", e."playerId", e."externalPlayerName",
                e."externalPlayerNumber", e.position, e.formation, e.period, e."periodSecond",
                e."createdAt", e."parentEventId", p."firstName", p."lastName", p.id AS "userId"
         FROM game_events e JOIN event_types et ON e."eventTypeId" = et.id
         LEFT JOIN users p ON e."playerId" = p.id
         WHERE e."gameTeamId" = $1
         ORDER BY e.period ASC, e."periodSecond" ASC, e."createdAt" ASC`,
        [target.id],
      );
      const derived = deriveGameRoster(
        rows.map((r: any) => ({
          id: r.id,
          eventType: { name: r.typeName },
          playerId: r.playerId,
          externalPlayerName: r.externalPlayerName,
          externalPlayerNumber: r.externalPlayerNumber,
          position: r.position,
          formation: r.formation,
          period: r.period,
          periodSecond: r.periodSecond,
          createdAt: new Date(r.createdAt).toISOString(),
          parentEventId: r.parentEventId,
          player: r.userId
            ? { firstName: r.firstName, lastName: r.lastName }
            : null,
        })),
      );
      const a = JSON.stringify(sortedCanon(sql));
      const b = JSON.stringify(sortedCanon(derived.players as any));
      if (a !== b) {
        fuzzMismatches++;
        if (fuzzMismatches <= 2)
          console.log(`fuzz run ${run}
  sql:     ${a}
  derived: ${b}`);
      }
    } finally {
      await qr.rollbackTransaction();
      await qr.release();
    }
  }
  console.log(`fuzz: ${RUNS} random histories, ${fuzzMismatches} mismatches`);
  for (const m of mismatches.slice(0, 5)) console.log(m.slice(0, 1500));
  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

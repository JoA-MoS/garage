import { describe, expect, it } from 'vitest';

import { deriveGameRoster, type RosterSourceEvent } from './game-roster';

let seq = 0;
function ev(
  type: string,
  fields: Partial<RosterSourceEvent> = {},
): RosterSourceEvent {
  seq += 1;
  return {
    id: `e${seq}`,
    eventType: { name: type },
    period: '1',
    periodSecond: 0,
    createdAt: new Date(Date.UTC(2026, 9, 1, 10, 0, 0, seq)).toISOString(),
    ...fields,
  };
}

const ALICE = {
  playerId: 'alice',
  player: { firstName: 'Alice', lastName: 'Ng' },
};
const BOB = { playerId: 'bob', player: { firstName: 'Bob', lastName: null } };

function byPlayer(roster: ReturnType<typeof deriveGameRoster>) {
  return Object.fromEntries(
    roster.players.map((p) => [p.playerId ?? p.externalPlayerName, p]),
  );
}

describe('deriveGameRoster', () => {
  it('puts a starter on the field at their position, named from the latest row', () => {
    const rosterEntry = ev('GAME_ROSTER', { ...ALICE, position: 'GK' });
    const subIn = ev('SUBSTITUTION_IN', { ...ALICE, position: 'GK' });

    const roster = deriveGameRoster([rosterEntry, subIn]);

    expect(roster.players).toEqual([
      {
        gameEventId: subIn.id,
        playerId: 'alice',
        externalPlayerName: undefined,
        externalPlayerNumber: undefined,
        position: 'GK',
        firstName: 'Alice',
        lastName: 'Ng',
        playerName: 'Alice Ng',
      },
    ]);
  });

  it('benches a player whose latest row is a SUBSTITUTION_OUT (position null)', () => {
    const out = ev('SUBSTITUTION_OUT', {
      ...ALICE,
      position: 'GK',
      periodSecond: 600,
    });

    const roster = deriveGameRoster([
      ev('SUBSTITUTION_IN', { ...ALICE, position: 'GK' }),
      out,
    ]);

    expect(byPlayer(roster).alice).toMatchObject({
      gameEventId: out.id,
      position: null,
    });
  });

  it('keeps a GAME_ROSTER player with no position on the bench', () => {
    const roster = deriveGameRoster([ev('GAME_ROSTER', { ...BOB })]);

    expect(byPlayer(roster).bob).toMatchObject({
      position: null,
      playerName: 'Bob',
    });
  });

  it('applies position swaps and changes as the latest row', () => {
    const swap = ev('POSITION_SWAP', {
      ...ALICE,
      position: 'ST',
      periodSecond: 300,
    });
    const change = ev('POSITION_CHANGE', {
      ...BOB,
      position: 'LB',
      periodSecond: 400,
    });

    const roster = byPlayer(
      deriveGameRoster([
        ev('SUBSTITUTION_IN', { ...ALICE, position: 'GK' }),
        ev('SUBSTITUTION_IN', { ...BOB, position: 'CB' }),
        swap,
        change,
      ]),
    );

    expect(roster.alice).toMatchObject({
      gameEventId: swap.id,
      position: 'ST',
    });
    expect(roster.bob).toMatchObject({
      gameEventId: change.id,
      position: 'LB',
    });
  });

  it('orders by period, then periodSecond - not by arrival', () => {
    // The second-half sub-in arrived first; the first-half sub-out later.
    const secondHalfIn = ev('SUBSTITUTION_IN', {
      ...ALICE,
      position: 'GK',
      period: '2',
      periodSecond: 0,
    });
    const firstHalfOut = ev('SUBSTITUTION_OUT', {
      ...ALICE,
      period: '1',
      periodSecond: 1500,
    });

    const roster = deriveGameRoster([secondHalfIn, firstHalfOut]);

    expect(byPlayer(roster).alice).toMatchObject({
      gameEventId: secondHalfIn.id,
      position: 'GK',
    });
  });

  it('breaks period/second ties by createdAt', () => {
    const later = ev('POSITION_SWAP', {
      ...ALICE,
      position: 'ST',
      periodSecond: 100,
      createdAt: '2026-10-01T10:05:00.002Z',
    });
    const earlier = ev('SUBSTITUTION_IN', {
      ...ALICE,
      position: 'GK',
      periodSecond: 100,
      createdAt: '2026-10-01T10:05:00.001Z',
    });

    const roster = deriveGameRoster([later, earlier]);

    expect(byPlayer(roster).alice.gameEventId).toBe(later.id);
  });

  it('breaks full ties by input order, which follows the database order', () => {
    const sameTime = '2026-10-01T10:05:00.000Z';
    const subIn = ev('SUBSTITUTION_IN', {
      ...ALICE,
      position: 'GK',
      periodSecond: 100,
      createdAt: sameTime,
    });
    const swap = ev('POSITION_SWAP', {
      ...ALICE,
      position: 'ST',
      periodSecond: 100,
      createdAt: sameTime,
    });

    expect(byPlayer(deriveGameRoster([subIn, swap])).alice.gameEventId).toBe(
      swap.id,
    );
  });

  it('treats a null period as the latest, matching Postgres NULLS FIRST on DESC', () => {
    const noPeriod = ev('GAME_ROSTER', { ...ALICE, period: null });

    const roster = deriveGameRoster([
      noPeriod,
      ev('SUBSTITUTION_IN', { ...ALICE, position: 'GK', period: '2' }),
    ]);

    expect(byPlayer(roster).alice.gameEventId).toBe(noPeriod.id);
  });

  it('groups external players by name', () => {
    const out = ev('SUBSTITUTION_OUT', {
      externalPlayerName: 'Guest 7',
      externalPlayerNumber: '7',
      periodSecond: 200,
    });

    const roster = deriveGameRoster([
      ev('SUBSTITUTION_IN', {
        externalPlayerName: 'Guest 7',
        externalPlayerNumber: '7',
        position: 'ST',
      }),
      out,
    ]);

    expect(roster.players).toHaveLength(1);
    expect(roster.players[0]).toMatchObject({
      gameEventId: out.id,
      externalPlayerName: 'Guest 7',
      externalPlayerNumber: '7',
      position: null,
      playerName: undefined,
    });
  });

  it('ignores events that do not affect the roster', () => {
    const roster = deriveGameRoster([
      ev('GOAL', { ...ALICE }),
      ev('PERIOD_START', {}),
    ]);

    expect(roster.players).toEqual([]);
  });

  describe('formation', () => {
    it('uses the latest FORMATION_CHANGE', () => {
      const roster = deriveGameRoster(
        [
          ev('FORMATION_CHANGE', { formation: '4-4-2', periodSecond: 0 }),
          ev('FORMATION_CHANGE', { formation: '4-3-3', periodSecond: 900 }),
        ],
        { defaultFormation: '3-5-2' },
      );

      expect(roster.formation).toBe('4-3-3');
    });

    it('falls back to the default, then null', () => {
      expect(
        deriveGameRoster([], { defaultFormation: '3-5-2' }).formation,
      ).toBe('3-5-2');
      expect(deriveGameRoster([]).formation).toBeNull();
    });
  });

  describe('previousPeriodLineup', () => {
    it('lists the SUBSTITUTION_OUTs created by the most recent PERIOD_END', () => {
      const halftime = ev('PERIOD_END', {
        period: '1',
        periodSecond: 1500,
        createdAt: '2026-10-01T10:45:00.000Z',
      });
      const aliceOut = ev('SUBSTITUTION_OUT', {
        ...ALICE,
        position: 'GK',
        periodSecond: 1500,
        parentEventId: halftime.id,
      });

      const roster = deriveGameRoster([
        halftime,
        aliceOut,
        ev('SUBSTITUTION_OUT', { ...BOB, periodSecond: 900 }), // a normal sub
      ]);

      expect(roster.previousPeriodLineup).toEqual([
        {
          gameEventId: aliceOut.id,
          playerId: 'alice',
          externalPlayerName: undefined,
          externalPlayerNumber: undefined,
          position: 'GK',
          firstName: 'Alice',
          lastName: 'Ng',
          playerName: 'Alice Ng',
        },
      ]);
    });

    it('picks the PERIOD_END recorded last, by createdAt', () => {
      const first = ev('PERIOD_END', {
        period: '1',
        createdAt: '2026-10-01T10:45:00.000Z',
      });
      const second = ev('PERIOD_END', {
        period: '2',
        createdAt: '2026-10-01T11:30:00.000Z',
      });
      const out = ev('SUBSTITUTION_OUT', { ...BOB, parentEventId: second.id });

      const roster = deriveGameRoster([
        second,
        first,
        out,
        ev('SUBSTITUTION_OUT', { ...ALICE, parentEventId: first.id }),
      ]);

      expect(roster.previousPeriodLineup?.map((p) => p.gameEventId)).toEqual([
        out.id,
      ]);
    });

    it('is undefined before any period has ended', () => {
      expect(deriveGameRoster([]).previousPeriodLineup).toBeUndefined();
    });
  });
});

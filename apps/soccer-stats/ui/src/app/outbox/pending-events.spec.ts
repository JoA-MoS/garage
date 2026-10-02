import { describe, expect, it } from 'vitest';

import { deriveGameRoster } from '@garage/soccer-stats/utils';

import {
  additionEvents,
  goalEvents,
  removalEvents,
  substitutionEvents,
  swapEvents,
  type ActionStamp,
} from './pending-events';

const stamp: ActionStamp = {
  gameTeamId: 'gt-1',
  period: '2',
  periodSecond: 600,
  createdAt: '2026-10-01T11:10:00.000Z',
};

const alice = {
  gameEventId: 'alice-in',
  playerId: 'alice',
  firstName: 'Alice',
  lastName: 'Ng',
  position: 'LM',
};
const bob = { playerId: 'bob', firstName: 'Bob', lastName: 'Lee' };
const cara = {
  gameEventId: 'cara-in',
  playerId: 'cara',
  firstName: 'Cara',
  lastName: 'Diaz',
  position: 'ST',
};

/** The confirmed events that put Alice (LM) and Cara (ST) on the field. */
const confirmed = [
  {
    id: 'alice-in',
    eventType: { name: 'SUBSTITUTION_IN' },
    playerId: 'alice',
    position: 'LM',
    period: '1',
    periodSecond: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    player: { firstName: 'Alice', lastName: 'Ng' },
  },
  {
    id: 'cara-in',
    eventType: { name: 'SUBSTITUTION_IN' },
    playerId: 'cara',
    position: 'ST',
    period: '1',
    periodSecond: 0,
    createdAt: '2026-10-01T10:00:00.001Z',
    player: { firstName: 'Cara', lastName: 'Diaz' },
  },
];

function rosterAfter(pending: ReturnType<typeof substitutionEvents>) {
  return Object.fromEntries(
    deriveGameRoster([...confirmed, ...pending]).players.map((p) => [
      p.playerId,
      p,
    ]),
  );
}

describe('pending events', () => {
  it('a substitution benches the outgoing player and puts the incoming one in their position', () => {
    const pending = substitutionEvents(stamp, alice, bob, {
      trackPositions: true,
      subOutEventId: 'sub-out',
      subInEventId: 'sub-in',
    });

    expect(pending).toEqual([
      expect.objectContaining({
        id: 'sub-out',
        gameTeamId: 'gt-1',
        eventType: { name: 'SUBSTITUTION_OUT' },
        playerId: 'alice',
        position: 'LM',
        period: '2',
        periodSecond: 600,
        createdAt: stamp.createdAt,
      }),
      expect.objectContaining({
        id: 'sub-in',
        eventType: { name: 'SUBSTITUTION_IN' },
        playerId: 'bob',
        position: 'LM',
        parentEventId: 'sub-out',
        player: { firstName: 'Bob', lastName: 'Lee' },
      }),
    ]);
    const roster = rosterAfter(pending);
    expect(roster.alice).toMatchObject({ position: null });
    expect(roster.bob).toMatchObject({
      gameEventId: 'sub-in',
      position: 'LM',
      playerName: 'Bob Lee',
    });
  });

  it('uses the FIELD sentinel (and no SUB_OUT position) when positions are not tracked, like the server', () => {
    const [out, into] = substitutionEvents(stamp, alice, bob, {
      trackPositions: false,
      subOutEventId: 'sub-out',
      subInEventId: 'sub-in',
    });

    expect(out.position).toBeNull();
    expect(into.position).toBe('FIELD');
  });

  it('a swap exchanges two positions, the second event linked to the first', () => {
    const pending = swapEvents(stamp, alice, cara, {
      swap1EventId: 'swap-1',
      swap2EventId: 'swap-2',
    });

    expect(pending.map((e) => [e.id, e.playerId, e.position])).toEqual([
      ['swap-1', 'alice', 'ST'],
      ['swap-2', 'cara', 'LM'],
    ]);
    expect(pending[1].parentEventId).toBe('swap-1');
    const roster = rosterAfter(pending);
    expect(roster.alice.position).toBe('ST');
    expect(roster.cara.position).toBe('LM');
  });

  it('a removal benches a player without a replacement', () => {
    const pending = removalEvents(stamp, alice, {
      trackPositions: true,
      eventId: 'out',
    });

    expect(rosterAfter(pending).alice).toMatchObject({
      gameEventId: 'out',
      position: null,
    });
  });

  it('an addition brings a bench player on at a position (FIELD when untracked)', () => {
    const tracked = additionEvents(stamp, bob, 'RB', {
      trackPositions: true,
      eventId: 'in',
    });
    const untracked = additionEvents(stamp, bob, 'RB', {
      trackPositions: false,
      eventId: 'in',
    });

    expect(rosterAfter(tracked).bob).toMatchObject({ position: 'RB' });
    expect(untracked[0].position).toBe('FIELD');
  });

  it('a goal (with assist) records GOAL plus a linked ASSIST', () => {
    const pending = goalEvents(stamp, bob, alice, {
      goalEventId: 'goal',
      assistEventId: 'assist',
    });

    expect(pending).toEqual([
      expect.objectContaining({
        id: 'goal',
        eventType: { name: 'GOAL' },
        playerId: 'bob',
      }),
      expect.objectContaining({
        id: 'assist',
        eventType: { name: 'ASSIST' },
        playerId: 'alice',
        parentEventId: 'goal',
      }),
    ]);
  });

  it('a goal without scorer or assist records just the GOAL', () => {
    expect(
      goalEvents(stamp, undefined, undefined, {
        goalEventId: 'goal',
        assistEventId: 'assist',
      }),
    ).toHaveLength(1);
  });
});

import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import {
  toRosterSourceEvents,
  useTeamRoster,
  type LiveGameEvent,
} from './use-live-game-state';

const T0 = '2026-10-01T10:00:00.000Z';

function event(
  id: string,
  type: string,
  fields: Partial<LiveGameEvent> = {},
): LiveGameEvent {
  return {
    id,
    eventType: { name: type },
    period: '1',
    periodSecond: 0,
    createdAt: T0,
    ...fields,
  };
}

describe('toRosterSourceEvents', () => {
  it('passes top-level events through in order', () => {
    const events = [event('a', 'GAME_ROSTER'), event('b', 'SUBSTITUTION_IN')];

    expect(toRosterSourceEvents(events).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('adds child events only seen nested (e.g. a SUB_IN pushed by the subscription) right after their parent, inheriting its time', () => {
    const subOut = event('out', 'SUBSTITUTION_OUT', {
      playerId: 'alice',
      period: '2',
      periodSecond: 300,
      createdAt: '2026-10-01T11:00:00.000Z',
      childEvents: [
        {
          id: 'in',
          eventType: { name: 'SUBSTITUTION_IN' },
          playerId: 'bob',
          position: 'ST',
        },
      ],
    });

    const result = toRosterSourceEvents([event('x', 'GAME_ROSTER'), subOut]);

    expect(result.map((e) => e.id)).toEqual(['x', 'out', 'in']);
    expect(result[2]).toMatchObject({
      id: 'in',
      playerId: 'bob',
      position: 'ST',
      period: '2',
      periodSecond: 300,
      createdAt: '2026-10-01T11:00:00.000Z',
      parentEventId: 'out',
    });
  });

  it('prefers the real top-level copy of a child once a refetch brings it', () => {
    const subOut = event('out', 'SUBSTITUTION_OUT', {
      childEvents: [{ id: 'in', eventType: { name: 'SUBSTITUTION_IN' } }],
    });
    const realSubIn = event('in', 'SUBSTITUTION_IN', {
      position: 'ST',
      parentEventId: 'out',
    });

    const result = toRosterSourceEvents([subOut, realSubIn]);

    expect(result.filter((e) => e.id === 'in')).toEqual([realSubIn]);
  });

  it('tolerates missing events', () => {
    expect(toRosterSourceEvents(undefined)).toEqual([]);
    expect(toRosterSourceEvents(null)).toEqual([]);
  });
});

describe('useTeamRoster', () => {
  it('derives the roster for a game team, falling back to the configured formation', () => {
    const team = {
      id: 'gt-1',
      team: { teamConfiguration: { defaultFormation: '4-3-3' } },
      events: [
        event('r1', 'GAME_ROSTER', {
          playerId: 'alice',
          player: { firstName: 'Alice', lastName: 'Ng' },
        }),
        event('s1', 'SUBSTITUTION_IN', {
          playerId: 'alice',
          position: 'GK',
          createdAt: '2026-10-01T10:00:00.001Z',
          player: { firstName: 'Alice', lastName: 'Ng' },
        }),
      ],
    };

    const { result } = renderHook(() => useTeamRoster(team));

    expect(result.current).toMatchObject({
      gameTeamId: 'gt-1',
      formation: '4-3-3',
      players: [{ gameEventId: 's1', playerId: 'alice', position: 'GK' }],
    });
  });

  it('returns undefined until the team is loaded', () => {
    const { result } = renderHook(() => useTeamRoster(undefined));

    expect(result.current).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import { InMemoryCache, gql } from '@apollo/client';

import { deriveGameRoster } from '@garage/soccer-stats/utils';

import { cacheTypePolicies } from './cache-type-policies';
import {
  addEventsToGameTeam,
  pruneDeletedGameEvents,
  removeEventFromGameTeam,
} from './game-event-cache';

const TEAM_EVENTS = gql`
  query TeamEvents {
    gameTeam {
      id
      events {
        id
        createdAt
        parentEventId
        period
        periodSecond
        position
        playerId
        externalPlayerName
        player {
          id
          firstName
          lastName
        }
        eventType {
          id
          name
          category
        }
      }
    }
  }
`;

function makeEvent(
  id: string,
  type: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    __typename: 'GameEvent',
    id,
    createdAt: '2026-01-01T10:00:00.000Z',
    parentEventId: null,
    period: '1',
    periodSecond: 0,
    position: null,
    formation: null,
    playerId: `player-${id}`,
    externalPlayerName: null,
    externalPlayerNumber: null,
    player: {
      __typename: 'User',
      id: `player-${id}`,
      firstName: 'First',
      lastName: id,
      email: null,
    },
    eventType: {
      __typename: 'EventType',
      id: `type-${type}`,
      name: type,
      category: 'LINEUP',
    },
    childEvents: [],
    ...overrides,
  };
}

function seedCache() {
  const cache = new InMemoryCache({ typePolicies: cacheTypePolicies });
  cache.writeQuery({
    query: TEAM_EVENTS,
    data: {
      gameTeam: {
        __typename: 'GameTeam',
        id: 'gt-1',
        events: [makeEvent('e1', 'GAME_ROSTER', { position: 'GK' })],
      },
    },
  });
  return cache;
}

function readIds(cache: InMemoryCache): string[] {
  const data = cache.readQuery<{
    gameTeam: { events: Array<{ id: string }> };
  }>({ query: TEAM_EVENTS });
  return data?.gameTeam.events.map((e) => e.id) ?? [];
}

describe('addEventsToGameTeam', () => {
  it('appends new events to GameTeam.events', () => {
    const cache = seedCache();

    addEventsToGameTeam(cache, 'gt-1', [
      makeEvent('e2', 'SUBSTITUTION_OUT', { position: 'GK' }),
      makeEvent('e3', 'SUBSTITUTION_IN', {
        parentEventId: 'e2',
        position: 'GK',
      }),
    ]);

    expect(readIds(cache)).toEqual(['e1', 'e2', 'e3']);
  });

  it('does not list an event twice but refreshes its fields', () => {
    const cache = seedCache();

    addEventsToGameTeam(cache, 'gt-1', [
      makeEvent('e1', 'GAME_ROSTER', {
        position: 'LB',
        createdAt: '2026-01-01T10:00:05.000Z',
      }),
    ]);

    const data = cache.readQuery<{
      gameTeam: {
        events: Array<{ id: string; position: string; createdAt: string }>;
      };
    }>({ query: TEAM_EVENTS });
    expect(data?.gameTeam.events).toHaveLength(1);
    expect(data?.gameTeam.events[0]).toMatchObject({
      position: 'LB',
      createdAt: '2026-01-01T10:00:05.000Z',
    });
  });

  it('ignores null, empty and id-less input', () => {
    const cache = seedCache();

    addEventsToGameTeam(cache, 'gt-1', undefined);
    addEventsToGameTeam(cache, 'gt-1', [null, undefined, {}]);

    expect(readIds(cache)).toEqual(['e1']);
  });

  it('keeps events when a later query result merges into the list', () => {
    const cache = seedCache();
    addEventsToGameTeam(cache, 'gt-1', [makeEvent('e2', 'SUBSTITUTION_OUT')]);

    // A refetch that predates e2 must not drop it (the type policy dedupes)
    cache.writeQuery({
      query: TEAM_EVENTS,
      data: {
        gameTeam: {
          __typename: 'GameTeam',
          id: 'gt-1',
          events: [makeEvent('e1', 'GAME_ROSTER', { position: 'GK' })],
        },
      },
    });

    expect(readIds(cache)).toEqual(['e1', 'e2']);
  });

  it('feeds the roster derivation as soon as a substitution is written', () => {
    const cache = seedCache();

    addEventsToGameTeam(cache, 'gt-1', [
      makeEvent('e2', 'SUBSTITUTION_OUT', {
        playerId: 'player-e1',
        createdAt: '2026-01-01T10:05:00.000Z',
        periodSecond: 300,
      }),
    ]);

    const data = cache.readQuery<{ gameTeam: { events: never[] } }>({
      query: TEAM_EVENTS,
    });
    const roster = deriveGameRoster(data?.gameTeam.events ?? []);
    expect(roster.players).toEqual([
      expect.objectContaining({ gameEventId: 'e2', position: null }),
    ]);
  });
});

describe('removeEventFromGameTeam', () => {
  it('removes the event from the list', () => {
    const cache = seedCache();
    addEventsToGameTeam(cache, 'gt-1', [makeEvent('e2', 'GAME_ROSTER')]);

    removeEventFromGameTeam(cache, 'gt-1', 'e1');

    expect(readIds(cache)).toEqual(['e2']);
    expect(cache.extract()['GameEvent:e1']).toBeUndefined();
  });
});

describe('pruneDeletedGameEvents', () => {
  it('drops cached events the server response no longer has', () => {
    const cache = seedCache();
    addEventsToGameTeam(cache, 'gt-1', [
      makeEvent('e2', 'SUBSTITUTION_OUT'),
      makeEvent('e3', 'SUBSTITUTION_IN', { parentEventId: 'e2' }),
    ]);

    pruneDeletedGameEvents(cache, {
      teams: [{ id: 'gt-1', events: [{ id: 'e1' }] }],
    });

    expect(readIds(cache)).toEqual(['e1']);
  });

  it('leaves a team alone when the response has no events for it', () => {
    const cache = seedCache();

    pruneDeletedGameEvents(cache, { teams: [{ id: 'gt-1' }] });

    expect(readIds(cache)).toEqual(['e1']);
  });
});

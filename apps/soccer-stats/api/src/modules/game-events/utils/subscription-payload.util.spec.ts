import { GameEvent } from '../../../entities/game-event.entity';
import { EventType } from '../../../entities/event-type.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { User } from '../../../entities/user.entity';

import { createSlimGameEventForSubscription } from './subscription-payload.util';

function buildPostgresNotifyPayload(event: GameEvent): string {
  return JSON.stringify({
    gameEventChanged: {
      action: 'CREATED',
      gameId: 'game-1',
      event,
    },
  });
}

function buildHydratedEvent(childCount: number): GameEvent {
  return {
    id: 'event-1',
    gameId: 'game-1',
    eventTypeId: 'type-1',
    playerId: 'player-1',
    recordedByUserId: 'user-1',
    gameTeamId: 'game-team-1',
    parentEventId: 'parent-1',
    period: '1',
    periodSecond: 0,
    position: 'GK',
    formation: '2-3-1',
    externalPlayerName: 'External Player',
    externalPlayerNumber: '12',
    description: 'Period started',
    conflictId: 'conflict-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    metadata: { source: 'test' },
    eventType: { id: 'type-1', name: 'PERIOD_START' } as EventType,
    player: { id: 'player-1', firstName: 'Ada' } as User,
    recordedByUser: { id: 'user-1', firstName: 'Coach' } as User,
    gameTeam: { id: 'game-team-1' } as GameTeam,
    childEvents: Array.from(
      { length: childCount },
      (_, index) =>
        ({
          id: `child-${index}`,
          gameId: 'game-1',
          eventTypeId: 'type-sub-in',
          playerId: `player-${index}`,
          recordedByUserId: 'user-1',
          gameTeamId: 'game-team-1',
          parentEventId: 'event-1',
          period: '1',
          periodSecond: 0,
          position: 'MID',
          description: `Substitution for player ${index}`,
          eventType: {
            id: 'type-sub-in',
            name: 'SUBSTITUTION_IN',
          } as EventType,
          player: {
            id: `player-${index}`,
            firstName: `Player ${index}`,
          } as User,
        }) as GameEvent,
    ),
  } as GameEvent;
}

describe('createSlimGameEventForSubscription', () => {
  it('removes nested relations and unbounded/prod-risky fields', () => {
    const event = buildHydratedEvent(14);

    const slimEvent = createSlimGameEventForSubscription(event);

    expect(slimEvent).toMatchObject({
      id: 'event-1',
      gameId: 'game-1',
      eventTypeId: 'type-1',
      playerId: 'player-1',
      recordedByUserId: 'user-1',
      gameTeamId: 'game-team-1',
      parentEventId: 'parent-1',
      period: '1',
      periodSecond: 0,
      position: 'GK',
      formation: '2-3-1',
      externalPlayerName: 'External Player',
      externalPlayerNumber: '12',
      description: 'Period started',
      conflictId: 'conflict-1',
    });
    expect(slimEvent).not.toHaveProperty('eventType');
    expect(slimEvent).not.toHaveProperty('player');
    expect(slimEvent).not.toHaveProperty('recordedByUser');
    expect(slimEvent).not.toHaveProperty('gameTeam');
    expect(slimEvent).not.toHaveProperty('parentEvent');
    expect(slimEvent).not.toHaveProperty('childEvents');
    // createdAt/updatedAt would arrive as strings (not Date instances) after
    // the Postgres NOTIFY JSON round-trip, which GraphQL's non-nullable
    // ISODateTime scalar would reject if any subscriber selected them.
    expect(slimEvent).not.toHaveProperty('createdAt');
    expect(slimEvent).not.toHaveProperty('updatedAt');
    // metadata is free-form/unbounded and isn't part of the GraphQL schema.
    expect(slimEvent).not.toHaveProperty('metadata');
  });

  it('keeps the NOTIFY payload under the ~8000-byte Postgres limit for an event large enough to threaten it', () => {
    // Use enough child events (with their own nested relations) that the
    // *unslimmed* payload actually exceeds the limit first. That proves
    // this fixture is large enough for the assertion below to mean
    // something - a fixture that stays under budget either way wouldn't
    // catch a regression where slimming silently stopped happening.
    const event = buildHydratedEvent(40);
    const unslimmedSize = Buffer.byteLength(
      buildPostgresNotifyPayload(event),
      'utf8',
    );
    expect(unslimmedSize).toBeGreaterThan(8000);

    const slimEvent = createSlimGameEventForSubscription(event);
    const slimmedSize = Buffer.byteLength(
      buildPostgresNotifyPayload(slimEvent),
      'utf8',
    );
    expect(slimmedSize).toBeLessThan(8000);
  });
});

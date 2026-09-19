import { GameEvent } from '../../../entities/game-event.entity';
import { EventType } from '../../../entities/event-type.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { User } from '../../../entities/user.entity';

import { createSlimGameEventForSubscription } from './subscription-payload.util';

describe('createSlimGameEventForSubscription', () => {
  it('removes nested relations so PostgreSQL NOTIFY payloads stay small', () => {
    const event = {
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
      metadata: { source: 'test' },
      eventType: { id: 'type-1', name: 'PERIOD_START' } as EventType,
      player: { id: 'player-1', firstName: 'Ada' } as User,
      recordedByUser: { id: 'user-1', firstName: 'Coach' } as User,
      gameTeam: { id: 'game-team-1' } as GameTeam,
      childEvents: Array.from(
        { length: 14 },
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
      metadata: { source: 'test' },
    });
    expect(slimEvent).not.toHaveProperty('eventType');
    expect(slimEvent).not.toHaveProperty('player');
    expect(slimEvent).not.toHaveProperty('recordedByUser');
    expect(slimEvent).not.toHaveProperty('gameTeam');
    expect(slimEvent).not.toHaveProperty('childEvents');

    const postgresNotificationPayload = JSON.stringify({
      gameEventChanged: {
        action: 'CREATED',
        gameId: 'game-1',
        event: slimEvent,
      },
    });

    expect(Buffer.byteLength(postgresNotificationPayload, 'utf8')).toBeLessThan(
      8000,
    );
  });
});

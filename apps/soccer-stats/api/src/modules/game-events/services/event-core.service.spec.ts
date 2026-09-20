import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Game } from '../../../entities/game.entity';
import { GameEvent } from '../../../entities/game-event.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { Team } from '../../../entities/team.entity';
import { EventType } from '../../../entities/event-type.entity';
import { GameEventAction } from '../dto/game-event-subscription.output';

import { EventCoreService } from './event-core.service';

describe('EventCoreService publishGameEvent', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  const createService = (publish = jest.fn().mockResolvedValue(undefined)) =>
    new EventCoreService(
      {} as Repository<GameEvent>,
      {} as Repository<EventType>,
      {} as Repository<GameTeam>,
      {} as Repository<Game>,
      {} as Repository<Team>,
      { publish } as never,
    );

  it('publishes a slim event payload without nested relations', async () => {
    const publish = jest.fn().mockResolvedValue(undefined);
    const service = createService(publish);
    const event = {
      id: 'event-1',
      gameId: 'game-1',
      eventTypeId: 'type-1',
      playerId: 'player-1',
      recordedByUserId: 'user-1',
      gameTeamId: 'game-team-1',
      period: '1',
      periodSecond: 0,
      eventType: { id: 'type-1', name: 'PERIOD_START' } as EventType,
      childEvents: [
        {
          id: 'child-1',
          gameId: 'game-1',
          eventTypeId: 'type-sub-in',
          recordedByUserId: 'user-1',
          gameTeamId: 'game-team-1',
          parentEventId: 'event-1',
        } as GameEvent,
      ],
    } as GameEvent;

    await service.publishGameEvent('game-1', GameEventAction.CREATED, event);

    expect(publish).toHaveBeenCalledWith('gameEvent:game-1', {
      gameEventChanged: {
        action: GameEventAction.CREATED,
        gameId: 'game-1',
        event: expect.objectContaining({
          id: 'event-1',
          gameId: 'game-1',
          eventTypeId: 'type-1',
        }),
      },
    });
    const payloadEvent = publish.mock.calls[0][1].gameEventChanged.event;
    expect(payloadEvent).not.toHaveProperty('eventType');
    expect(payloadEvent).not.toHaveProperty('childEvents');
  });

  it('does not reject the mutation path when realtime publish fails', async () => {
    const publish = jest
      .fn()
      .mockRejectedValue(new Error('payload string too long'));
    const service = createService(publish);

    await expect(
      service.publishGameEvent('game-1', GameEventAction.CREATED, {
        id: 'event-1',
        gameId: 'game-1',
      } as GameEvent),
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      'Real-time game event notification failed',
      expect.objectContaining({
        action: GameEventAction.CREATED,
        error: 'payload string too long',
        gameId: 'game-1',
      }),
    );
  });

  it('publishes with an undefined event field when no event is provided (e.g. conflict resolution)', async () => {
    const publish = jest.fn().mockResolvedValue(undefined);
    const service = createService(publish);

    await service.publishGameEvent(
      'game-1',
      GameEventAction.DELETED,
      undefined,
      'deleted-event-1',
    );

    expect(publish).toHaveBeenCalledWith('gameEvent:game-1', {
      gameEventChanged: {
        action: GameEventAction.DELETED,
        gameId: 'game-1',
        event: undefined,
        deletedEventId: 'deleted-event-1',
        conflict: undefined,
      },
    });
  });
});

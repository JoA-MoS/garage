import { describe, expect, it } from 'vitest';

import {
  buildGameEventNotification,
  formatGameClock,
  GameEventNotificationEvent,
} from './game-event-notifications';

const baseEvent = {
  id: 'event-1',
  gameTeamId: 'game-team-home',
  period: '1',
  periodSecond: 615,
} satisfies Partial<GameEventNotificationEvent>;

const baseContext = {
  gameName: 'Mountain Lions vs River Hawks',
  teamName: 'Mountain Lions',
  opponentName: 'River Hawks',
  teamType: 'home' as const,
  homeScore: 2,
  awayScore: 1,
};

describe('game event notifications', () => {
  it('formats game clock values with period labels', () => {
    expect(formatGameClock('1', 615)).toBe('1 10:15');
    expect(formatGameClock(null, 59)).toBe('0:59');
  });

  it('builds a goal notification with scorer, assist, score, and game context', () => {
    const notification = buildGameEventNotification(
      {
        ...baseEvent,
        eventType: { name: 'GOAL' },
        player: { firstName: 'Alex', lastName: 'Morgan' },
        childEvents: [
          {
            eventType: { name: 'ASSIST' },
            player: { firstName: 'Sam', lastName: 'Rivera' },
          },
        ],
      } as GameEventNotificationEvent,
      baseContext,
    );

    expect(notification).toEqual({
      title: '⚽ Goal — Mountain Lions',
      body: 'Mountain Lions vs River Hawks · 1 10:15\nScorer: Alex Morgan\nAssist: Sam Rivera\nScore: 2-1',
      tag: 'soccer-stats:event-1',
    });
  });

  it('builds substitution notifications for game events beyond goals', () => {
    const notification = buildGameEventNotification(
      {
        ...baseEvent,
        eventType: { name: 'SUBSTITUTION_IN' },
        externalPlayerNumber: '12',
      } as GameEventNotificationEvent,
      baseContext,
    );

    expect(notification).toEqual({
      title: 'Substitution — Mountain Lions',
      body: '#12 on\nMountain Lions vs River Hawks · 1 10:15',
      tag: 'soccer-stats:event-1',
    });
  });

  it('ignores events that are not notification-worthy', () => {
    expect(
      buildGameEventNotification(
        {
          ...baseEvent,
          eventType: { name: 'GAME_ROSTER' },
        } as GameEventNotificationEvent,
        baseContext,
      ),
    ).toBeNull();
  });
});

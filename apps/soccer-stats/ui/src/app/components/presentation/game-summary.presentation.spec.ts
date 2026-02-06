import { describe, it, expect } from 'vitest';

import { isHalftimeEvent, GameEvent } from './game-summary.presentation';

describe('isHalftimeEvent', () => {
  // Helper to create a minimal GameEvent for testing
  function createEvent(
    eventTypeName: string,
    period?: string | null,
  ): GameEvent {
    return {
      id: 'test-id',
      createdAt: new Date().toISOString(),
      periodSecond: 2700,
      eventType: {
        name: eventTypeName,
        category: 'GAME_FLOW',
      },
      period: period,
    };
  }

  describe('legacy HALFTIME events', () => {
    it('should return true for legacy HALFTIME event type', () => {
      const event = createEvent('HALFTIME');

      expect(isHalftimeEvent(event)).toBe(true);
    });

    it('should return true for HALFTIME even without period metadata', () => {
      const event = createEvent('HALFTIME', undefined);

      expect(isHalftimeEvent(event)).toBe(true);
    });

    it('should return true for HALFTIME with any period value', () => {
      // HALFTIME doesn't need period, but should still be detected if present
      const event = createEvent('HALFTIME', '1');

      expect(isHalftimeEvent(event)).toBe(true);
    });
  });

  describe('new PERIOD_END events', () => {
    it('should return true for PERIOD_END with period="1"', () => {
      const event = createEvent('PERIOD_END', '1');

      expect(isHalftimeEvent(event)).toBe(true);
    });

    it('should return false for PERIOD_END with period="2" (end of game)', () => {
      const event = createEvent('PERIOD_END', '2');

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false for PERIOD_END with period="OT1" (overtime)', () => {
      const event = createEvent('PERIOD_END', 'OT1');

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false for PERIOD_END with period="OT2"', () => {
      const event = createEvent('PERIOD_END', 'OT2');

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false for PERIOD_END without period metadata', () => {
      const event = createEvent('PERIOD_END', undefined);

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false for PERIOD_END with null period', () => {
      const event = createEvent('PERIOD_END', null);

      expect(isHalftimeEvent(event)).toBe(false);
    });
  });

  describe('other event types', () => {
    it('should return false for GOAL events', () => {
      const event = createEvent('GOAL');

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false for KICKOFF events', () => {
      const event = createEvent('KICKOFF');

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false for GAME_START events', () => {
      const event = createEvent('GAME_START');

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false for GAME_END events', () => {
      const event = createEvent('GAME_END');

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false for PERIOD_START events', () => {
      const event = createEvent('PERIOD_START', '1');

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false for SUBSTITUTION_IN events', () => {
      const event = createEvent('SUBSTITUTION_IN');

      expect(isHalftimeEvent(event)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false when eventType is null', () => {
      const event: GameEvent = {
        id: 'test-id',
        createdAt: new Date().toISOString(),
        periodSecond: 2700,
        eventType: null,
      };

      expect(isHalftimeEvent(event)).toBe(false);
    });

    it('should return false when eventType is undefined', () => {
      const event: GameEvent = {
        id: 'test-id',
        createdAt: new Date().toISOString(),
        periodSecond: 2700,
        eventType: undefined,
      };

      expect(isHalftimeEvent(event)).toBe(false);
    });
  });
});

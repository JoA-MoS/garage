import { Test, TestingModule } from '@nestjs/testing';

import { Game } from '../../entities/game.entity';

import { GameFieldsResolver } from './game-fields.resolver';
import { GameTimingService } from './game-timing.service';

describe('GameFieldsResolver', () => {
  let resolver: GameFieldsResolver;
  let timingService: jest.Mocked<GameTimingService>;

  beforeEach(async () => {
    const mockTimingService = {
      getPeriodTimingInfo: jest.fn().mockResolvedValue({
        period1DurationSeconds: 300,
        period2DurationSeconds: 0,
        currentPeriod: '1',
        currentPeriodSeconds: 300,
        serverTimestamp: 1706889600000,
      }),
      getGameTimingBatch: jest.fn(),
      getGameTiming: jest.fn(),
      getGameDurationSeconds: jest.fn(),
      isGamePaused: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameFieldsResolver,
        { provide: GameTimingService, useValue: mockTimingService },
      ],
    }).compile();

    resolver = module.get<GameFieldsResolver>(GameFieldsResolver);
    timingService = module.get(GameTimingService);
  });

  describe('currentPeriod', () => {
    it('should return current period from timing service', async () => {
      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriod(game);

      expect(result).toBe('1');
      expect(timingService.getPeriodTimingInfo).toHaveBeenCalledWith(
        'game-123',
        60,
      );
    });

    it('should return undefined when game is not started', async () => {
      timingService.getPeriodTimingInfo.mockResolvedValueOnce({
        period1DurationSeconds: 0,
        period2DurationSeconds: 0,
        currentPeriod: undefined,
        currentPeriodSeconds: 0,
        serverTimestamp: 1706889600000,
      });

      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriod(game);

      expect(result).toBeUndefined();
    });

    it('should return "2" when game is in second half', async () => {
      timingService.getPeriodTimingInfo.mockResolvedValueOnce({
        period1DurationSeconds: 1800,
        period2DurationSeconds: 600,
        currentPeriod: '2',
        currentPeriodSeconds: 600,
        serverTimestamp: 1706889600000,
      });

      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriod(game);

      expect(result).toBe('2');
    });

    it('should handle undefined durationMinutes', async () => {
      const game = { id: 'game-123', durationMinutes: undefined } as Game;
      await resolver.currentPeriod(game);

      expect(timingService.getPeriodTimingInfo).toHaveBeenCalledWith(
        'game-123',
        undefined,
      );
    });
  });

  describe('currentPeriodSecond', () => {
    it('should return current period seconds from timing service', async () => {
      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriodSecond(game);

      expect(result).toBe(300);
      expect(timingService.getPeriodTimingInfo).toHaveBeenCalledWith(
        'game-123',
        60,
      );
    });

    it('should return 0 when game is not started', async () => {
      timingService.getPeriodTimingInfo.mockResolvedValueOnce({
        period1DurationSeconds: 0,
        period2DurationSeconds: 0,
        currentPeriod: undefined,
        currentPeriodSeconds: 0,
        serverTimestamp: 1706889600000,
      });

      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriodSecond(game);

      expect(result).toBe(0);
    });

    it('should return seconds in second half', async () => {
      timingService.getPeriodTimingInfo.mockResolvedValueOnce({
        period1DurationSeconds: 1800,
        period2DurationSeconds: 600,
        currentPeriod: '2',
        currentPeriodSeconds: 600,
        serverTimestamp: 1706889600000,
      });

      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriodSecond(game);

      expect(result).toBe(600);
    });
  });

  describe('serverTimestamp', () => {
    it('should return server timestamp from timing service', async () => {
      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.serverTimestamp(game);

      expect(result).toBe(1706889600000);
      expect(timingService.getPeriodTimingInfo).toHaveBeenCalledWith(
        'game-123',
        60,
      );
    });

    it('should return different timestamps for different calls', async () => {
      const timestamp1 = 1706889600000;
      const timestamp2 = 1706889601000;

      timingService.getPeriodTimingInfo
        .mockResolvedValueOnce({
          period1DurationSeconds: 300,
          period2DurationSeconds: 0,
          currentPeriod: '1',
          currentPeriodSeconds: 300,
          serverTimestamp: timestamp1,
        })
        .mockResolvedValueOnce({
          period1DurationSeconds: 301,
          period2DurationSeconds: 0,
          currentPeriod: '1',
          currentPeriodSeconds: 301,
          serverTimestamp: timestamp2,
        });

      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result1 = await resolver.serverTimestamp(game);
      const result2 = await resolver.serverTimestamp(game);

      expect(result1).toBe(timestamp1);
      expect(result2).toBe(timestamp2);
    });
  });
});

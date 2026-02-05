import { Test, TestingModule } from '@nestjs/testing';
import DataLoader from 'dataloader';

import { Game } from '../../entities/game.entity';
import { GraphQLContext, IDataLoaders, PeriodTimingInfo } from '../dataloaders';

import { GameFieldsResolver } from './game-fields.resolver';

describe('GameFieldsResolver', () => {
  let resolver: GameFieldsResolver;
  let mockPeriodTimingInfoLoader: jest.Mocked<
    DataLoader<string, PeriodTimingInfo>
  >;
  let mockContext: GraphQLContext;

  const defaultTimingInfo: PeriodTimingInfo = {
    period1DurationSeconds: 300,
    period2DurationSeconds: 0,
    currentPeriod: '1',
    currentPeriodSeconds: 300,
    serverTimestamp: 1706889600000,
  };

  beforeEach(async () => {
    // Create mock DataLoader
    mockPeriodTimingInfoLoader = {
      load: jest.fn().mockResolvedValue(defaultTimingInfo),
      loadMany: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn(),
      prime: jest.fn(),
      name: 'periodTimingInfoLoader',
    } as unknown as jest.Mocked<DataLoader<string, PeriodTimingInfo>>;

    // Create mock context with loaders
    mockContext = {
      loaders: {
        periodTimingInfoLoader: mockPeriodTimingInfoLoader,
      } as unknown as IDataLoaders,
    } as GraphQLContext;

    const module: TestingModule = await Test.createTestingModule({
      providers: [GameFieldsResolver],
    }).compile();

    resolver = module.get<GameFieldsResolver>(GameFieldsResolver);
  });

  describe('currentPeriod', () => {
    it('should return current period from DataLoader', async () => {
      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriod(game, mockContext);

      expect(result).toBe('1');
      expect(mockPeriodTimingInfoLoader.load).toHaveBeenCalledWith(
        'game-123:60',
      );
    });

    it('should return undefined when game is not started', async () => {
      mockPeriodTimingInfoLoader.load.mockResolvedValueOnce({
        period1DurationSeconds: 0,
        period2DurationSeconds: 0,
        currentPeriod: undefined,
        currentPeriodSeconds: 0,
        serverTimestamp: 1706889600000,
      });

      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriod(game, mockContext);

      expect(result).toBeUndefined();
    });

    it('should return "2" when game is in second half', async () => {
      mockPeriodTimingInfoLoader.load.mockResolvedValueOnce({
        period1DurationSeconds: 1800,
        period2DurationSeconds: 600,
        currentPeriod: '2',
        currentPeriodSeconds: 600,
        serverTimestamp: 1706889600000,
      });

      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriod(game, mockContext);

      expect(result).toBe('2');
    });

    it('should use default duration when durationMinutes is undefined', async () => {
      const game = { id: 'game-123', durationMinutes: undefined } as Game;
      await resolver.currentPeriod(game, mockContext);

      // Should use default of 60 when undefined
      expect(mockPeriodTimingInfoLoader.load).toHaveBeenCalledWith(
        'game-123:60',
      );
    });
  });

  describe('currentPeriodSecond', () => {
    it('should return current period seconds from DataLoader', async () => {
      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriodSecond(game, mockContext);

      expect(result).toBe(300);
      expect(mockPeriodTimingInfoLoader.load).toHaveBeenCalledWith(
        'game-123:60',
      );
    });

    it('should return 0 when game is not started', async () => {
      mockPeriodTimingInfoLoader.load.mockResolvedValueOnce({
        period1DurationSeconds: 0,
        period2DurationSeconds: 0,
        currentPeriod: undefined,
        currentPeriodSeconds: 0,
        serverTimestamp: 1706889600000,
      });

      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriodSecond(game, mockContext);

      expect(result).toBe(0);
    });

    it('should return seconds in second half', async () => {
      mockPeriodTimingInfoLoader.load.mockResolvedValueOnce({
        period1DurationSeconds: 1800,
        period2DurationSeconds: 600,
        currentPeriod: '2',
        currentPeriodSeconds: 600,
        serverTimestamp: 1706889600000,
      });

      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.currentPeriodSecond(game, mockContext);

      expect(result).toBe(600);
    });
  });

  describe('serverTimestamp', () => {
    it('should return server timestamp from DataLoader', async () => {
      const game = { id: 'game-123', durationMinutes: 60 } as Game;
      const result = await resolver.serverTimestamp(game, mockContext);

      expect(result).toBe(1706889600000);
      expect(mockPeriodTimingInfoLoader.load).toHaveBeenCalledWith(
        'game-123:60',
      );
    });

    it('should return different timestamps for different calls', async () => {
      const timestamp1 = 1706889600000;
      const timestamp2 = 1706889601000;

      mockPeriodTimingInfoLoader.load
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
      const result1 = await resolver.serverTimestamp(game, mockContext);
      const result2 = await resolver.serverTimestamp(game, mockContext);

      expect(result1).toBe(timestamp1);
      expect(result2).toBe(timestamp2);
    });
  });
});

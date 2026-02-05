import { Test, TestingModule } from '@nestjs/testing';
import DataLoader from 'dataloader';

import { GraphQLContext, IDataLoaders } from '../dataloaders';

import { LineupPlayer } from './dto/game-lineup.output';
import { PlayerFullStats } from './dto/player-full-stats.output';
import { LineupPlayerResolver } from './lineup-player.resolver';

describe('LineupPlayerResolver', () => {
  let resolver: LineupPlayerResolver;
  let mockPlayerStatsByGameTeamLoader: jest.Mocked<
    DataLoader<string, PlayerFullStats[]>
  >;
  let mockContext: GraphQLContext;

  beforeEach(async () => {
    // Create mock DataLoader
    mockPlayerStatsByGameTeamLoader = {
      load: jest.fn().mockResolvedValue([]),
      loadMany: jest.fn(),
      clear: jest.fn(),
      clearAll: jest.fn(),
      prime: jest.fn(),
      name: 'playerStatsByGameTeamLoader',
    } as unknown as jest.Mocked<DataLoader<string, PlayerFullStats[]>>;

    // Create mock context with loaders
    mockContext = {
      loaders: {
        playerStatsByGameTeamLoader: mockPlayerStatsByGameTeamLoader,
      } as unknown as IDataLoaders,
    } as GraphQLContext;

    const module: TestingModule = await Test.createTestingModule({
      providers: [LineupPlayerResolver],
    }).compile();

    resolver = module.get<LineupPlayerResolver>(LineupPlayerResolver);
  });

  describe('stats', () => {
    const createLineupPlayer = (
      overrides: Partial<LineupPlayer> = {},
    ): LineupPlayer => ({
      gameTeamId: 'game-team-123',
      gameEventId: 'event-123',
      isOnField: true,
      ...overrides,
    });

    const createPlayerStats = (
      overrides: Partial<PlayerFullStats> = {},
    ): PlayerFullStats => ({
      playerId: undefined,
      externalPlayerName: undefined,
      totalMinutes: 10,
      totalSeconds: 30,
      positionTimes: [{ position: 'FW', minutes: 10, seconds: 30 }],
      goals: 2,
      assists: 1,
      gamesPlayed: 1,
      lastEntryGameSeconds: 300,
      ...overrides,
    });

    it('should return null when no stats found', async () => {
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([]);
      const player = createLineupPlayer({ playerId: 'player-123' });

      const result = await resolver.stats(player, mockContext);

      expect(result).toBeNull();
      expect(mockPlayerStatsByGameTeamLoader.load).toHaveBeenCalledWith(
        'game-team-123',
      );
    });

    it('should match player by playerId when both have playerId', async () => {
      const stats = createPlayerStats({
        playerId: 'player-123',
        totalMinutes: 15,
        totalSeconds: 45,
        goals: 3,
        assists: 2,
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({ playerId: 'player-123' });

      const result = await resolver.stats(player, mockContext);

      expect(result).not.toBeNull();
      expect(result!.totalSeconds).toBe(15 * 60 + 45); // 945 seconds
      expect(result!.goals).toBe(3);
      expect(result!.assists).toBe(2);
    });

    it('should match player by externalPlayerName when playerId is undefined', async () => {
      const stats = createPlayerStats({
        externalPlayerName: 'John Doe',
        totalMinutes: 20,
        totalSeconds: 15,
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({ externalPlayerName: 'John Doe' });

      const result = await resolver.stats(player, mockContext);

      expect(result).not.toBeNull();
      expect(result!.totalSeconds).toBe(20 * 60 + 15); // 1215 seconds
    });

    it('should NOT match when both playerId are null (prevents null === null bug)', async () => {
      // This is a critical test - null === null would incorrectly match different players
      const stats = createPlayerStats({
        playerId: undefined,
        externalPlayerName: 'Different Player',
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({
        playerId: undefined,
        externalPlayerName: 'Some Other Player',
      });

      const result = await resolver.stats(player, mockContext);

      expect(result).toBeNull();
    });

    it('should NOT match when both playerId are undefined and externalPlayerName differs', async () => {
      const stats = createPlayerStats({
        playerId: undefined,
        externalPlayerName: 'Player A',
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({
        playerId: undefined,
        externalPlayerName: 'Player B',
      });

      const result = await resolver.stats(player, mockContext);

      expect(result).toBeNull();
    });

    it('should NOT match when both externalPlayerName are undefined and playerId differs', async () => {
      const stats = createPlayerStats({
        playerId: 'player-A',
        externalPlayerName: undefined,
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({
        playerId: 'player-B',
        externalPlayerName: undefined,
      });

      const result = await resolver.stats(player, mockContext);

      expect(result).toBeNull();
    });

    it('should correctly transform totalMinutes and totalSeconds to totalSeconds', async () => {
      const stats = createPlayerStats({
        playerId: 'player-123',
        totalMinutes: 45,
        totalSeconds: 30,
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({ playerId: 'player-123' });

      const result = await resolver.stats(player, mockContext);

      expect(result!.totalSeconds).toBe(45 * 60 + 30); // 2730 seconds
    });

    it('should correctly map lastEntryGameSeconds to lastEntryPeriodSecond', async () => {
      const stats = createPlayerStats({
        playerId: 'player-123',
        lastEntryGameSeconds: 450,
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({ playerId: 'player-123' });

      const result = await resolver.stats(player, mockContext);

      expect(result!.lastEntryPeriodSecond).toBe(450);
    });

    it('should include positionTimes from stats', async () => {
      const positionTimes = [
        { position: 'GK', minutes: 30, seconds: 0 },
        { position: 'DF', minutes: 15, seconds: 45 },
      ];
      const stats = createPlayerStats({
        playerId: 'player-123',
        positionTimes,
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({ playerId: 'player-123' });

      const result = await resolver.stats(player, mockContext);

      expect(result!.positionTimes).toEqual(positionTimes);
    });

    it('should prefer playerId match over externalPlayerName when both present', async () => {
      // Player with playerId match should be preferred even if externalPlayerName differs
      const statsById = createPlayerStats({
        playerId: 'player-123',
        externalPlayerName: 'Different Name',
        goals: 5,
      });
      const statsByName = createPlayerStats({
        playerId: 'player-456',
        externalPlayerName: 'Matching Name',
        goals: 1,
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([
        statsById,
        statsByName,
      ]);
      const player = createLineupPlayer({
        playerId: 'player-123',
        externalPlayerName: 'Matching Name',
      });

      const result = await resolver.stats(player, mockContext);

      // Should match by playerId first (5 goals)
      expect(result!.goals).toBe(5);
    });

    it('should handle player with no identification (edge case)', async () => {
      const stats = createPlayerStats({
        playerId: 'some-player',
        externalPlayerName: 'Some Player',
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({
        playerId: undefined,
        externalPlayerName: undefined,
      });

      const result = await resolver.stats(player, mockContext);

      expect(result).toBeNull();
    });

    it('should handle undefined lastEntryGameSeconds', async () => {
      const stats = createPlayerStats({
        playerId: 'player-123',
        lastEntryGameSeconds: undefined,
      });
      mockPlayerStatsByGameTeamLoader.load.mockResolvedValue([stats]);
      const player = createLineupPlayer({ playerId: 'player-123' });

      const result = await resolver.stats(player, mockContext);

      expect(result!.lastEntryPeriodSecond).toBeUndefined();
    });
  });
});

import { Test } from '@nestjs/testing';

import {
  MemorySnapshot,
  ObservabilityService,
} from '../modules/observability/observability.service';

import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;
  const originalEnv = {
    APP_VERSION: process.env['APP_VERSION'],
    GIT_SHA: process.env['GIT_SHA'],
    BUILD_TIME: process.env['BUILD_TIME'],
    NODE_ENV: process.env['NODE_ENV'],
  };

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(service.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('getVersion', () => {
    afterEach(() => {
      for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    });

    it('returns build metadata from environment variables', () => {
      process.env['APP_VERSION'] = '1.2.3';
      process.env['GIT_SHA'] = 'abc1234';
      process.env['BUILD_TIME'] = '2026-07-15T02:22:42.000Z';
      process.env['NODE_ENV'] = 'production';

      expect(service.getVersion()).toEqual({
        name: 'soccer-stats-api',
        version: '1.2.3',
        gitSha: 'abc1234',
        buildTime: '2026-07-15T02:22:42.000Z',
        environment: 'production',
      });
    });

    it('uses safe fallback values when build metadata is unavailable', () => {
      delete process.env['APP_VERSION'];
      delete process.env['GIT_SHA'];
      delete process.env['BUILD_TIME'];
      delete process.env['NODE_ENV'];

      expect(service.getVersion()).toEqual({
        name: 'soccer-stats-api',
        version: '0.0.1',
        gitSha: 'unknown',
        buildTime: 'unknown',
        environment: 'unknown',
      });
    });
  });

  describe('getHealth', () => {
    const originalContainerMemoryLimit =
      process.env['CONTAINER_MEMORY_LIMIT_MB'];

    afterEach(() => {
      if (originalContainerMemoryLimit === undefined) {
        delete process.env['CONTAINER_MEMORY_LIMIT_MB'];
      } else {
        process.env['CONTAINER_MEMORY_LIMIT_MB'] = originalContainerMemoryLimit;
      }
    });

    function createServiceWithMemory(snapshot: MemorySnapshot): AppService {
      const observabilityService: Pick<
        ObservabilityService,
        'getMemorySnapshot'
      > = {
        getMemorySnapshot: () => snapshot,
      };

      return new AppService(observabilityService as ObservabilityService);
    }

    it('keeps status ok when V8 heap is mostly full but RSS is low', () => {
      process.env['CONTAINER_MEMORY_LIMIT_MB'] = '512';

      const result = createServiceWithMemory({
        heapUsedMB: 46,
        heapTotalMB: 50,
        rssMB: 124,
        externalMB: 5,
      }).getHealth();

      expect(result.status).toBe('ok');
      expect(result.memory).toMatchObject({
        heapUsagePercent: 92,
        containerLimitMB: 512,
        rssUsagePercent: 24.22,
      });
    });

    it('marks status degraded when RSS exceeds 75 percent of container memory', () => {
      process.env['CONTAINER_MEMORY_LIMIT_MB'] = '512';

      const result = createServiceWithMemory({
        heapUsedMB: 80,
        heapTotalMB: 120,
        rssMB: 400,
        externalMB: 10,
      }).getHealth();

      expect(result.status).toBe('degraded');
      expect(result.memory?.rssUsagePercent).toBe(78.13);
    });

    it('marks status degraded when RSS is exactly 75 percent of container memory', () => {
      process.env['CONTAINER_MEMORY_LIMIT_MB'] = '512';

      const result = createServiceWithMemory({
        heapUsedMB: 80,
        heapTotalMB: 120,
        rssMB: 384,
        externalMB: 10,
      }).getHealth();

      expect(result.status).toBe('degraded');
      expect(result.memory?.rssUsagePercent).toBe(75);
    });

    it('marks status unhealthy when RSS is exactly 90 percent of container memory', () => {
      process.env['CONTAINER_MEMORY_LIMIT_MB'] = '512';

      const result = createServiceWithMemory({
        heapUsedMB: 100,
        heapTotalMB: 120,
        rssMB: 460.8,
        externalMB: 10,
      }).getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.memory?.rssUsagePercent).toBe(90);
    });

    it('marks status unhealthy when RSS exceeds 90 percent of container memory', () => {
      process.env['CONTAINER_MEMORY_LIMIT_MB'] = '512';

      const result = createServiceWithMemory({
        heapUsedMB: 100,
        heapTotalMB: 120,
        rssMB: 470,
        externalMB: 10,
      }).getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.memory?.rssUsagePercent).toBe(91.8);
    });
  });
});

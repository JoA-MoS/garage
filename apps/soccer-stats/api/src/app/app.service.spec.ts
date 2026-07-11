import { Test } from '@nestjs/testing';

import { MemorySnapshot } from '../modules/observability/observability.service';

import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

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

  describe('getHealth', () => {
    const originalContainerMemoryLimit = process.env['CONTAINER_MEMORY_LIMIT_MB'];

    afterEach(() => {
      if (originalContainerMemoryLimit === undefined) {
        delete process.env['CONTAINER_MEMORY_LIMIT_MB'];
      } else {
        process.env['CONTAINER_MEMORY_LIMIT_MB'] = originalContainerMemoryLimit;
      }
    });

    function createServiceWithMemory(snapshot: MemorySnapshot): AppService {
      return new AppService({
        getMemorySnapshot: () => snapshot,
      } as never);
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

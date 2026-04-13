import { Test } from '@nestjs/testing';

import { ObservabilityService } from '../modules/observability/observability.service';

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
    it('should return ok status without observability service', () => {
      const result = service.getHealth();
      expect(result.status).toBe('ok');
      expect(result.memory).toBeUndefined();
      expect(typeof result.uptime).toBe('number');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return ok status when heap usage is low', async () => {
      const mockObservability = {
        getMemorySnapshot: jest.fn().mockReturnValue({
          heapUsedMB: 50,
          heapTotalMB: 80,
          heapSizeLimitMB: 400,
          rssMB: 100,
          externalMB: 5,
        }),
      } as unknown as ObservabilityService;

      const app = await Test.createTestingModule({
        providers: [
          AppService,
          { provide: ObservabilityService, useValue: mockObservability },
        ],
      }).compile();

      const svc = app.get<AppService>(AppService);
      const result = svc.getHealth();

      expect(result.status).toBe('ok');
      expect(result.memory).toBeDefined();
      // 50 / 400 = 12.5%
      expect(result.memory!.heapUsagePercent).toBe(12.5);
      expect(result.memory!.heapSizeLimitMB).toBe(400);
    });

    it('should return degraded status when heap usage is between 80% and 95%', async () => {
      const mockObservability = {
        getMemorySnapshot: jest.fn().mockReturnValue({
          heapUsedMB: 340,
          heapTotalMB: 360,
          heapSizeLimitMB: 400,
          rssMB: 380,
          externalMB: 5,
        }),
      } as unknown as ObservabilityService;

      const app = await Test.createTestingModule({
        providers: [
          AppService,
          { provide: ObservabilityService, useValue: mockObservability },
        ],
      }).compile();

      const svc = app.get<AppService>(AppService);
      const result = svc.getHealth();

      expect(result.status).toBe('degraded');
      // 340 / 400 = 85%
      expect(result.memory!.heapUsagePercent).toBe(85);
    });

    it('should return unhealthy status when heap usage exceeds 95%', async () => {
      const mockObservability = {
        getMemorySnapshot: jest.fn().mockReturnValue({
          heapUsedMB: 390,
          heapTotalMB: 395,
          heapSizeLimitMB: 400,
          rssMB: 420,
          externalMB: 5,
        }),
      } as unknown as ObservabilityService;

      const app = await Test.createTestingModule({
        providers: [
          AppService,
          { provide: ObservabilityService, useValue: mockObservability },
        ],
      }).compile();

      const svc = app.get<AppService>(AppService);
      const result = svc.getHealth();

      expect(result.status).toBe('unhealthy');
      // 390 / 400 = 97.5%
      expect(result.memory!.heapUsagePercent).toBe(97.5);
    });

    it('should report ok when heapUsed/heapTotal is high but heapUsed/heapSizeLimit is low', async () => {
      // Simulates the original issue: heapUsed=54MB, heapTotal=58MB (93%), heapSizeLimit=400MB (13.5%)
      // Old code would report 'degraded', new code should report 'ok'.
      const mockObservability = {
        getMemorySnapshot: jest.fn().mockReturnValue({
          heapUsedMB: 54,
          heapTotalMB: 58,
          heapSizeLimitMB: 400,
          rssMB: 90,
          externalMB: 5,
        }),
      } as unknown as ObservabilityService;

      const app = await Test.createTestingModule({
        providers: [
          AppService,
          { provide: ObservabilityService, useValue: mockObservability },
        ],
      }).compile();

      const svc = app.get<AppService>(AppService);
      const result = svc.getHealth();

      // heapUsed/heapSizeLimit = 54/400 = 13.5% → ok
      expect(result.status).toBe('ok');
      expect(result.memory!.heapUsagePercent).toBe(13.5);
    });
  });
});

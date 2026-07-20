import { ObservabilityService } from './observability.service';

describe('ObservabilityService', () => {
  let service: ObservabilityService;

  beforeEach(() => {
    service = new ObservabilityService();
  });

  describe('getMemorySnapshot', () => {
    it('reports the V8 heap size limit so operators can verify --max-old-space-size took effect', () => {
      const snapshot = service.getMemorySnapshot();

      expect(snapshot.heapSizeLimitMB).toBeGreaterThan(0);
      // The limit is the ceiling the heap can grow to, so it can never be
      // below what is currently allocated.
      expect(snapshot.heapSizeLimitMB).toBeGreaterThanOrEqual(
        snapshot.heapTotalMB,
      );
    });

    it('reports current usage in MB', () => {
      const snapshot = service.getMemorySnapshot();

      expect(snapshot.heapUsedMB).toBeGreaterThan(0);
      expect(snapshot.heapTotalMB).toBeGreaterThanOrEqual(snapshot.heapUsedMB);
      expect(snapshot.rssMB).toBeGreaterThan(0);
    });
  });
});

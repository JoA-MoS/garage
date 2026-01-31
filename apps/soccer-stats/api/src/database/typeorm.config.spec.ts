import { baseTypeOrmConfig } from './typeorm.config';

describe('TypeORM Configuration', () => {
  describe('connection pool settings', () => {
    it('should have extra property with pool configuration', () => {
      expect(baseTypeOrmConfig.extra).toBeDefined();
    });

    it('should have max pool size configured', () => {
      expect(baseTypeOrmConfig.extra.max).toBeGreaterThan(0);
    });

    it('should have min pool size configured', () => {
      expect(baseTypeOrmConfig.extra.min).toBeGreaterThanOrEqual(0);
    });

    it('should have idle timeout configured', () => {
      expect(baseTypeOrmConfig.extra.idleTimeoutMillis).toBeGreaterThan(0);
    });

    it('should have connection timeout configured', () => {
      expect(baseTypeOrmConfig.extra.connectionTimeoutMillis).toBeGreaterThan(
        0,
      );
    });

    it('should have min <= max', () => {
      expect(baseTypeOrmConfig.extra.min).toBeLessThanOrEqual(
        baseTypeOrmConfig.extra.max,
      );
    });
  });
});

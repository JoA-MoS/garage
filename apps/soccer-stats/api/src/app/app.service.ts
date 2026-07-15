import { Injectable, Logger, Optional } from '@nestjs/common';

import {
  ObservabilityService,
  MemorySnapshot,
} from '../modules/observability/observability.service';

/**
 * Memory metrics included in health response
 */
export interface MemoryMetrics {
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  heapUsagePercent: number;
  containerLimitMB: number;
  rssUsagePercent: number;
}

/**
 * Health status response
 */
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory?: MemoryMetrics;
}

/**
 * Build metadata for identifying the deployed API artifact.
 */
export interface BuildInfo {
  name: string;
  version: string;
  gitSha: string;
  buildTime: string;
  environment: string;
}

/**
 * Detailed process metrics response
 */
export interface ProcessMetrics {
  timestamp: string;
  uptime: number;
  memory: MemorySnapshot | null;
  memoryAvailable: boolean;
  process: {
    pid: number;
    version: string;
    platform: string;
    arch: string;
  };
  resourceUsage?: {
    userCPUTime: number;
    systemCPUTime: number;
    maxRSS: number;
  };
}

@Injectable()
export class AppService {
  private readonly startTime = Date.now();
  private readonly logger = new Logger(AppService.name);
  private readonly containerMemoryLimitMB = this.getContainerMemoryLimitMB();

  constructor(
    @Optional()
    private readonly observabilityService?: ObservabilityService,
  ) {}

  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  getVersion(): BuildInfo {
    return {
      name: 'soccer-stats-api',
      version: process.env['APP_VERSION'] || '0.0.1',
      gitSha: process.env['GIT_SHA'] || 'unknown',
      buildTime: process.env['BUILD_TIME'] || 'unknown',
      environment: process.env['NODE_ENV'] || 'unknown',
    };
  }

  /**
   * Get health status with optional memory metrics.
   *
   * Status is determined by resident memory usage against the configured
   * container memory limit. `heapUsed / heapTotal` is still reported for
   * debugging, but it is intentionally not the health gate: V8 can keep a
   * small heap nearly full on an otherwise healthy process.
   *
   * - ok: RSS < 75% of container limit
   * - degraded: RSS is 75-90% of container limit
   * - unhealthy: RSS > 90% of container limit
   */
  getHealth(): HealthStatus {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const timestamp = new Date().toISOString();

    // If no observability service, return basic health
    if (!this.observabilityService) {
      return {
        status: 'ok',
        timestamp,
        uptime,
      };
    }

    const snapshot = this.observabilityService.getMemorySnapshot();
    const heapUsagePercent = this.toPercent(
      snapshot.heapUsedMB,
      snapshot.heapTotalMB,
    );
    const rssUsagePercent = this.toPercent(
      snapshot.rssMB,
      this.containerMemoryLimitMB,
    );

    // Determine status based on RSS/container memory, not V8 heap fullness.
    let status: 'ok' | 'degraded' | 'unhealthy' = 'ok';
    if (rssUsagePercent >= 90) {
      status = 'unhealthy';
    } else if (rssUsagePercent >= 75) {
      status = 'degraded';
    }

    return {
      status,
      timestamp,
      uptime,
      memory: {
        heapUsedMB: snapshot.heapUsedMB,
        heapTotalMB: snapshot.heapTotalMB,
        rssMB: snapshot.rssMB,
        heapUsagePercent,
        containerLimitMB: this.containerMemoryLimitMB,
        rssUsagePercent,
      },
    };
  }

  private getContainerMemoryLimitMB(): number {
    const rawLimit = process.env['CONTAINER_MEMORY_LIMIT_MB'];
    const parsedLimit = rawLimit ? Number(rawLimit) : 512;

    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      this.logger.warn({
        message: 'Invalid CONTAINER_MEMORY_LIMIT_MB, defaulting to 512MB',
        value: rawLimit,
      });
      return 512;
    }

    return parsedLimit;
  }

  private toPercent(used: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    return Math.round((used / total) * 10000) / 100;
  }

  /**
   * Get detailed process metrics for monitoring/debugging.
   * Includes full memory snapshot and process information.
   *
   * Note: If observability service is unavailable, memory will be null
   * and memoryAvailable will be false.
   */
  getMetrics(): ProcessMetrics {
    const memorySnapshot =
      this.observabilityService?.getMemorySnapshot() ?? null;

    const metrics: ProcessMetrics = {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: memorySnapshot,
      memoryAvailable: memorySnapshot !== null,
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    // Add resource usage if available (not available on all platforms)
    try {
      const resourceUsage = process.resourceUsage();
      metrics.resourceUsage = {
        userCPUTime: resourceUsage.userCPUTime,
        systemCPUTime: resourceUsage.systemCPUTime,
        maxRSS: resourceUsage.maxRSS,
      };
    } catch (error) {
      // Log platform incompatibility for debugging, but don't fail the request
      this.logger.debug({
        message: 'Resource usage unavailable',
        reason: error instanceof Error ? error.message : String(error),
        platform: process.platform,
      });
    }

    return metrics;
  }
}

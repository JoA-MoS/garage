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

  constructor(
    @Optional()
    private readonly observabilityService?: ObservabilityService,
  ) {}

  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  /**
   * Get health status with optional memory metrics.
   *
   * Status is determined by heap usage:
   * - ok: < 80% heap usage
   * - degraded: 80-95% heap usage (high memory pressure)
   * - unhealthy: > 95% heap usage (critical, may OOM soon)
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
    const heapUsagePercent =
      Math.round((snapshot.heapUsedMB / snapshot.heapTotalMB) * 10000) / 100;

    // Determine status based on heap usage
    let status: 'ok' | 'degraded' | 'unhealthy' = 'ok';
    if (heapUsagePercent > 95) {
      status = 'unhealthy';
    } else if (heapUsagePercent > 80) {
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
      },
    };
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

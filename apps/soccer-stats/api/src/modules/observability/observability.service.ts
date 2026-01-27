import { Injectable, Logger } from '@nestjs/common';

/**
 * Memory snapshot from process.memoryUsage()
 */
export interface MemorySnapshot {
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  externalMB: number;
}

/**
 * DataLoader batch metrics for logging
 */
export interface DataLoaderBatchMetrics {
  loader: string;
  batchSize: number;
  resultCount: number;
  durationMs: number;
}

/**
 * GraphQL query metrics for logging
 */
export interface QueryMetrics {
  operationName: string | null;
  complexity: number;
  durationMs: number;
  hasErrors: boolean;
}

/**
 * Log levels for observability
 */
export type ObservabilityLogLevel = 'none' | 'basic' | 'verbose';

/**
 * Service providing observability utilities for memory monitoring,
 * DataLoader instrumentation, and GraphQL query tracking.
 *
 * All logging is in CloudWatch-compatible JSON format.
 */
@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger('Observability');

  constructor() {
    // Configuration is read dynamically from environment to allow runtime changes
  }

  /**
   * Get current memory usage snapshot in MB
   */
  getMemorySnapshot(): MemorySnapshot {
    const usage = process.memoryUsage();
    const bytesToMB = (bytes: number) =>
      Math.round((bytes / 1024 / 1024) * 100) / 100;

    return {
      heapUsedMB: bytesToMB(usage.heapUsed),
      heapTotalMB: bytesToMB(usage.heapTotal),
      rssMB: bytesToMB(usage.rss),
      externalMB: bytesToMB(usage.external),
    };
  }

  /**
   * Log memory snapshot with optional context
   */
  logMemory(context: string, additionalData?: Record<string, unknown>): void {
    const memory = this.getMemorySnapshot();
    this.logger.log({
      message: 'Memory snapshot',
      context,
      memory,
      ...additionalData,
    });
  }

  /**
   * Log DataLoader batch execution metrics
   */
  logDataLoaderBatch(metrics: DataLoaderBatchMetrics): void {
    const logData = {
      message: 'DataLoader batch',
      loader: metrics.loader,
      batchSize: metrics.batchSize,
      resultCount: metrics.resultCount,
      durationMs: metrics.durationMs,
    };

    this.logger.log(logData);
  }

  /**
   * Log large DataLoader batch warning
   */
  logLargeBatchWarning(
    metrics: DataLoaderBatchMetrics,
    threshold: number,
  ): void {
    this.logger.warn({
      message: 'Large batch detected',
      loader: metrics.loader,
      batchSize: metrics.batchSize,
      threshold,
      durationMs: metrics.durationMs,
    });
  }

  /**
   * Log GraphQL query metrics
   */
  logQueryMetrics(metrics: QueryMetrics): void {
    this.logger.log({
      message: 'Query metrics',
      operationName: metrics.operationName,
      complexity: metrics.complexity,
      durationMs: metrics.durationMs,
      hasErrors: metrics.hasErrors,
    });
  }

  /**
   * Log slow query warning
   */
  logSlowQueryWarning(
    operationName: string | null,
    durationMs: number,
    threshold: number,
  ): void {
    this.logger.warn({
      message: 'Slow query detected',
      operationName,
      durationMs,
      threshold,
    });
  }

  /**
   * Log high query complexity warning
   */
  logHighComplexityWarning(
    operationName: string | null,
    complexity: number,
    limit: number,
  ): void {
    this.logger.warn({
      message: 'High query complexity',
      operationName,
      complexity,
      limit,
    });
  }

  /**
   * Log request start
   */
  logRequestStart(requestId: string, operationName: string | null): void {
    const memory = this.getMemorySnapshot();
    this.logger.log({
      message: 'Request start',
      requestId,
      operationName,
      memory,
    });
  }

  /**
   * Log request complete with timing and memory delta
   */
  logRequestComplete(
    requestId: string,
    operationName: string | null,
    durationMs: number,
    startMemory: MemorySnapshot,
  ): void {
    const endMemory = this.getMemorySnapshot();
    const deltaMB =
      Math.round((endMemory.heapUsedMB - startMemory.heapUsedMB) * 100) / 100;

    const logData = {
      message: 'Request complete',
      requestId,
      operationName,
      durationMs,
      memory: {
        heapUsedMB: endMemory.heapUsedMB,
        deltaMB,
      },
    };

    this.logger.log(logData);

    // Warn if memory delta is significant (> 50MB)
    if (deltaMB > 50) {
      this.logger.warn({
        message: 'High memory delta',
        requestId,
        operationName,
        deltaMB,
        startHeapMB: startMemory.heapUsedMB,
        endHeapMB: endMemory.heapUsedMB,
      });
    }
  }

  /**
   * Log GraphQL error with context
   */
  logGraphQLError(
    operationName: string | null,
    error: { message: string; path?: readonly (string | number)[] },
  ): void {
    this.logger.error({
      message: 'GraphQL error',
      operationName,
      error: error.message,
      path: error.path?.join('.'),
    });
  }
}

import DataLoader from 'dataloader';

import {
  ObservabilityService,
  DataLoaderBatchMetrics,
} from '../observability/observability.service';
import {
  getDataLoaderLogging,
  getObservabilityLogLevel,
  getDataLoaderBatchSizeWarningThreshold,
} from '../../app/environment';

/**
 * Options for creating an instrumented DataLoader
 */
export interface InstrumentedDataLoaderOptions<K, V> {
  /** Name of the loader for logging */
  name: string;
  /** The batch function that loads data */
  batchFn: (keys: readonly K[]) => Promise<(V | Error)[]>;
  /** Standard DataLoader options */
  dataLoaderOptions?: DataLoader.Options<K, V>;
  /** ObservabilityService for logging (optional) */
  observabilityService?: ObservabilityService;
}

/**
 * Create a DataLoader with optional instrumentation.
 *
 * When instrumentation is enabled (via environment variables), this wraps
 * the batch function to:
 * - Measure batch execution time
 * - Log batch size and duration
 * - Warn on large batches exceeding threshold
 *
 * When disabled, returns a standard DataLoader with no overhead.
 *
 * Environment control:
 * - OBSERVABILITY_LOG_LEVEL=none disables all logging
 * - DATALOADER_LOGGING=false disables DataLoader-specific logging
 * - DATALOADER_BATCH_SIZE_WARNING=100 sets large batch threshold
 */
export function createInstrumentedDataLoader<K, V>(
  options: InstrumentedDataLoaderOptions<K, V>,
): DataLoader<K, V> {
  const { name, batchFn, dataLoaderOptions, observabilityService } = options;

  // Check if instrumentation should be enabled and service is available
  if (
    !observabilityService ||
    !shouldEnableInstrumentation(observabilityService)
  ) {
    // Return standard DataLoader with no overhead
    return new DataLoader<K, V>(batchFn, dataLoaderOptions);
  }

  // At this point, observabilityService is guaranteed to be defined
  const service = observabilityService;

  // Wrap batch function with instrumentation
  const instrumentedBatchFn = async (
    keys: readonly K[],
  ): Promise<(V | Error)[]> => {
    const startTime = Date.now();

    try {
      const results = await batchFn(keys);
      const durationMs = Date.now() - startTime;

      const metrics: DataLoaderBatchMetrics = {
        loader: name,
        batchSize: keys.length,
        resultCount: results.filter((r) => !(r instanceof Error)).length,
        durationMs,
      };

      // Log batch metrics
      logBatchMetrics(service, metrics);

      return results;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Log error with proper severity
      service.logDataLoaderError(name, keys.length, durationMs, error);

      throw error;
    }
  };

  return new DataLoader<K, V>(instrumentedBatchFn, dataLoaderOptions);
}

/**
 * Determine if instrumentation should be enabled based on configuration
 */
function shouldEnableInstrumentation(
  observabilityService?: ObservabilityService,
): boolean {
  // No service means no logging capability
  if (!observabilityService) {
    return false;
  }

  // Check global log level
  const logLevel = getObservabilityLogLevel();
  if (logLevel === 'none') {
    return false;
  }

  // Check DataLoader-specific override
  return getDataLoaderLogging();
}

/**
 * Log batch metrics conditionally:
 * - Always warn when batch size exceeds threshold
 * - Log normal batches only in 'verbose' mode
 */
function logBatchMetrics(
  service: ObservabilityService,
  metrics: DataLoaderBatchMetrics,
): void {
  const threshold = getDataLoaderBatchSizeWarningThreshold();

  // Always log in verbose mode, warn on large batches in any mode
  if (metrics.batchSize > threshold) {
    service.logLargeBatchWarning(metrics, threshold);
  } else if (getObservabilityLogLevel() === 'verbose') {
    service.logDataLoaderBatch(metrics);
  }
}

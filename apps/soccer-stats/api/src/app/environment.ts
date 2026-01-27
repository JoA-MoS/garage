/**
 * Environment configuration module
 * Consolidates all environment variable reading in one place.
 *
 * Local development: Nx loads `.env` files automatically (see project.json).
 * Production: Variables are injected via AWS Secrets Manager / ECS task definition.
 */

/**
 * Get environment variable value
 * This function is used instead of direct constants to allow for better testing.
 * Uses explicit undefined check to differentiate between unset and empty string values.
 */
function getEnv(key: string, defaultValue?: string): string | undefined {
  const value = process.env[key];
  return value !== undefined ? value : defaultValue;
}

/**
 * Get required environment variable - throws if missing in production.
 * In development, falls back to the default value from .env files loaded by Nx.
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined) {
    const nodeEnv = process.env['NODE_ENV'];
    if (nodeEnv === 'production') {
      throw new Error(
        `Missing required environment variable: ${key}. ` +
          `Ensure AWS Secrets Manager is properly configured.`,
      );
    }
    // In development, this will be caught at runtime when the value is used
    // Nx should have loaded defaults from .env files
    console.warn(
      `[Environment] Missing ${key} - ensure environment variables are loaded`,
    );
    return '';
  }
  return value;
}

/**
 * Parse port number from environment variable with fallback
 */
function parsePort(value: string, fallback: number): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Node environment (development, production, test)
 */
export const getNodeEnv = (): string => getEnv('NODE_ENV', 'development')!;

/**
 * Check if running in production
 */
export const isProduction = (): boolean => getNodeEnv() === 'production';

/**
 * Server configuration
 */
export const getPort = (): number => parsePort(getEnv('PORT') ?? '', 3333);

/**
 * API base path prefix (used by both REST controllers and GraphQL)
 * Can be overridden via API_PREFIX environment variable
 */
export const API_PREFIX = getEnv('API_PREFIX', 'api')!;

/**
 * Frontend URLs for CORS configuration (optional)
 * Comma-separated list of allowed origins
 * If not set, CORS allows all origins (safe when behind CloudFront/proxy)
 */
export const getFrontendUrl = (): string | undefined => getEnv('FRONTEND_URL');

/**
 * Database configuration
 * Required variables - must be set via .env (local) or Secrets Manager (prod)
 */
export const getDbHost = (): string => getRequiredEnv('DB_HOST');
export const getDbPort = (): number =>
  parsePort(getRequiredEnv('DB_PORT'), 5432);
export const getDbUsername = (): string => getRequiredEnv('DB_USERNAME');
export const getDbPassword = (): string => getRequiredEnv('DB_PASSWORD');
export const getDbName = (): string => getRequiredEnv('DB_NAME');
/**
 * Database synchronize setting.
 * IMPORTANT: Should be false when using TypeORM migrations.
 * Only set to true for rapid prototyping without migrations.
 */
export const getDbSynchronize = (): boolean =>
  getEnv('DB_SYNCHRONIZE') === 'true';
export const getDbLogging = (): boolean =>
  getEnv('DB_LOGGING') === 'true' || !isProduction();
/**
 * Database SSL setting.
 * Enables SSL for PostgreSQL connections (recommended for RDS).
 * Defaults to true in production, false in development (local Docker).
 * Set DB_SSL=true when connecting to RDS from local machine.
 *
 * Accepts common boolean formats: true/false, 1/0, yes/no (case-insensitive).
 * Note: Uses { rejectUnauthorized: false } in typeorm.config.ts to avoid
 * certificate verification issues with RDS.
 */
export const getDbSsl = (): boolean => {
  const sslEnv = getEnv('DB_SSL');
  if (sslEnv !== undefined) {
    const normalized = sslEnv.toLowerCase().trim();

    // Explicit true values
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }

    // Explicit false values
    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'no' ||
      normalized === ''
    ) {
      return false;
    }

    // Unexpected value - warn and use environment-based default
    console.warn(
      `[Environment] DB_SSL has unexpected value "${sslEnv}". ` +
        `Expected "true" or "false". Defaulting to ${isProduction() ? 'true' : 'false'} based on environment.`,
    );
    return isProduction();
  }
  return isProduction();
};

/**
 * GraphQL configuration
 */
export const getGraphqlIntrospection = (): boolean =>
  getEnv('GRAPHQL_INTROSPECTION') === 'true' || !isProduction();

/**
 * Clerk authentication configuration
 */
export const getClerkSecretKey = (): string | undefined =>
  getEnv('CLERK_SECRET_KEY');
export const getClerkPublishableKey = (): string | undefined =>
  getEnv('CLERK_PUBLISHABLE_KEY');

// ============================================================
// Observability Configuration
// ============================================================

/**
 * Observability log levels:
 * - 'none': No observability logging (safe for production rollout)
 * - 'basic': Log warnings only (slow queries, large batches, high memory)
 * - 'verbose': Log all metrics including normal request/query metrics
 */
export type ObservabilityLogLevel = 'none' | 'basic' | 'verbose';

/**
 * Get the observability log level.
 * Defaults to 'none' for safe production rollout.
 */
export const getObservabilityLogLevel = (): ObservabilityLogLevel => {
  const level = getEnv('OBSERVABILITY_LOG_LEVEL', 'none');
  if (level === 'basic' || level === 'verbose') {
    return level;
  }
  return 'none';
};

/**
 * Override for DataLoader-specific logging.
 * When OBSERVABILITY_LOG_LEVEL is 'basic' or 'verbose', this allows
 * disabling DataLoader logging independently.
 * Defaults to true when observability is enabled.
 */
export const getDataLoaderLogging = (): boolean => {
  const override = getEnv('DATALOADER_LOGGING');
  if (override !== undefined) {
    return override === 'true';
  }
  // Default to enabled when observability is on
  return getObservabilityLogLevel() !== 'none';
};

/**
 * Override for query complexity logging.
 * Defaults to true when observability is enabled.
 */
export const getQueryComplexityLogging = (): boolean => {
  const override = getEnv('QUERY_COMPLEXITY_LOGGING');
  if (override !== undefined) {
    return override === 'true';
  }
  return getObservabilityLogLevel() !== 'none';
};

/**
 * Override for memory logging.
 * Defaults to true when observability is enabled.
 */
export const getMemoryLogging = (): boolean => {
  const override = getEnv('MEMORY_LOGGING');
  if (override !== undefined) {
    return override === 'true';
  }
  return getObservabilityLogLevel() !== 'none';
};

/**
 * Threshold for slow query warnings (in milliseconds).
 * Queries exceeding this duration will be logged as warnings.
 * Default: 1000ms (1 second)
 */
export const getSlowQueryThresholdMs = (): number => {
  const value = getEnv('SLOW_QUERY_THRESHOLD_MS');
  if (value) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1000;
};

/**
 * Threshold for query complexity warnings.
 * Queries exceeding this complexity score will be logged as warnings.
 * Default: 100
 */
export const getQueryComplexityLimit = (): number => {
  const value = getEnv('QUERY_COMPLEXITY_LIMIT');
  if (value) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 100;
};

/**
 * Threshold for DataLoader batch size warnings.
 * Batches exceeding this size will be logged as warnings.
 * Default: 100
 */
export const getDataLoaderBatchSizeWarningThreshold = (): number => {
  const value = getEnv('DATALOADER_BATCH_SIZE_WARNING');
  if (value) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 100;
};

/**
 * Whether to use JSON format for logs.
 * JSON logs are easier to parse in CloudWatch and other log aggregation tools.
 * Defaults to true in production, false in development (for readability).
 * Set LOG_FORMAT=json to enable, LOG_FORMAT=text to disable.
 */
export const useJsonLogging = (): boolean => {
  const format = getEnv('LOG_FORMAT');
  if (format !== undefined) {
    return format.toLowerCase() === 'json';
  }
  return isProduction();
};

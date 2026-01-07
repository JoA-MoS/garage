/**
 * Environment configuration module
 * Consolidates all environment variable reading in one place
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
 * Parse port number from environment variable with fallback
 */
function parsePort(value: string): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 3333 : parsed;
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
export const getPort = (): number => parsePort(getEnv('PORT', '3333')!);

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
 */
export const getDbHost = (): string => getEnv('DB_HOST', 'localhost')!;
export const getDbPort = (): number => parsePort(getEnv('DB_PORT', '5432')!);
export const getDbUsername = (): string => getEnv('DB_USERNAME', 'postgres')!;
export const getDbPassword = (): string => getEnv('DB_PASSWORD', 'postgres')!;
export const getDbName = (): string => getEnv('DB_NAME', 'soccer_stats')!;
export const getDbSynchronize = (): boolean =>
  getEnv('DB_SYNCHRONIZE') === 'true' || !isProduction();
export const getDbLogging = (): boolean =>
  getEnv('DB_LOGGING') === 'true' || !isProduction();

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

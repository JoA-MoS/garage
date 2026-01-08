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
      `[Environment] Missing ${key} - ensure .env file is loaded by Nx`,
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

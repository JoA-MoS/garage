/**
 * Environment configuration module
 * Consolidates all environment variable reading in one place
 */

/**
 * Get environment variable value
 * This function is used instead of direct constants to allow for better testing
 */
function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
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
export const getPort = (): string => getEnv('PORT', '3333')!;

/**
 * Frontend URLs for CORS configuration
 * Comma-separated list of allowed origins
 */
export const getFrontendUrl = (): string => getEnv('FRONTEND_URL', 'http://localhost:4200,http://localhost:3333')!;

/**
 * Database configuration
 */
export const getDbHost = (): string => getEnv('DB_HOST', 'localhost')!;
export const getDbPort = (): number => parseInt(getEnv('DB_PORT', '5432')!);
export const getDbUsername = (): string => getEnv('DB_USERNAME', 'postgres')!;
export const getDbPassword = (): string => getEnv('DB_PASSWORD', 'postgres')!;
export const getDbName = (): string => getEnv('DB_NAME', 'soccer_stats')!;
export const getDbSynchronize = (): boolean => getEnv('DB_SYNCHRONIZE') === 'true' || !isProduction();
export const getDbLogging = (): boolean => getEnv('DB_LOGGING') === 'true' || !isProduction();

/**
 * GraphQL configuration
 */
export const getGraphqlIntrospection = (): boolean => getEnv('GRAPHQL_INTROSPECTION') === 'true' || !isProduction();

/**
 * Clerk authentication configuration
 */
export const getClerkSecretKey = (): string | undefined => getEnv('CLERK_SECRET_KEY');
export const getClerkJwtAudience = (): string | undefined => getEnv('CLERK_JWT_AUDIENCE');
export const getClerkPublishableKey = (): string | undefined => getEnv('CLERK_PUBLISHABLE_KEY');

// Legacy constants for backwards compatibility (evaluated at module load time)
export const NODE_ENV = getNodeEnv();
export const IS_PRODUCTION = isProduction();
export const PORT = getPort();
export const FRONTEND_URL = getFrontendUrl();
export const DB_HOST = getDbHost();
export const DB_PORT = getDbPort();
export const DB_USERNAME = getDbUsername();
export const DB_PASSWORD = getDbPassword();
export const DB_NAME = getDbName();
export const DB_SYNCHRONIZE = getDbSynchronize();
export const DB_LOGGING = getDbLogging();
export const GRAPHQL_INTROSPECTION = getGraphqlIntrospection();
export const CLERK_SECRET_KEY = getClerkSecretKey();
export const CLERK_JWT_AUDIENCE = getClerkJwtAudience();
export const CLERK_PUBLISHABLE_KEY = getClerkPublishableKey();

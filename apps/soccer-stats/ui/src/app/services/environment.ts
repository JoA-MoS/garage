/**
 * Frontend environment configuration
 * Centralizes environment variable reading and provides defaults
 */

/**
 * API base path prefix - must match backend API_PREFIX
 * Can be overridden via VITE_API_PREFIX environment variable
 */
export const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? 'api';

/**
 * Gets the API base URL.
 * - VITE_API_URL: Override for custom setups (e.g., direct backend connection)
 * - Default: Empty string for same-origin requests
 *   - Development: Vite proxy forwards /api/* to localhost:3333
 *   - Production: Vercel rewrites /api/* to Railway
 */
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== '') {
    return envUrl;
  }
  // Use same-origin (empty string) to go through proxy/rewrites
  return '';
}

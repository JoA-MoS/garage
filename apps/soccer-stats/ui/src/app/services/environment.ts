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
 *
 * Priority:
 * 1. VITE_API_URL env var - explicit override for any custom setup
 * 2. Same-origin (empty string) - for CloudFront, local dev, or any setup
 *    where API is accessible at /api/* on the same origin
 *
 * CloudFront Architecture:
 * - UI static files served from S3 via CloudFront
 * - API requests to /api/* routed to ALB via CloudFront
 * - Same origin = no CORS, cookies work seamlessly
 *
 * Development:
 * - Vite dev server proxies /api/* to the local API
 * - Same-origin requests work out of the box
 */
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== '') {
    return envUrl;
  }

  // Same-origin for CloudFront, development, or any proxy setup
  // The server (CloudFront/Vite) routes /api/* to the API
  return '';
}

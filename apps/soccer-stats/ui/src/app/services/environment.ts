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
 * Railway backend URL for direct connections from Vercel.
 * Vercel can't proxy requests to Railway, so we connect directly.
 * Exported for reuse in apollo-client.ts SSR fallback.
 */
export const RAILWAY_URL = 'https://soccer-stats.up.railway.app';

/**
 * Detect if running on Vercel deployment.
 * Used to route requests directly to Railway instead of through Vercel.
 */
export function isVercelDeployment(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.host.includes('.vercel.app')
  );
}

/**
 * Gets the API base URL.
 * - VITE_API_URL: Override for custom setups (e.g., direct backend connection)
 * - Vercel: Direct connection to Railway (no proxy/rewrite support)
 * - Development: Empty string for same-origin requests (Vite proxy handles /api/*)
 */
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== '') {
    return envUrl;
  }

  // On Vercel, connect directly to Railway
  if (isVercelDeployment()) {
    return RAILWAY_URL;
  }

  // Development: Use same-origin (Vite proxy handles /api/*)
  return '';
}

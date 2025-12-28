/**
 * Public configuration fetched from the API at runtime.
 * This allows the same build artifact to be deployed to different environments.
 */
export interface PublicConfig {
  clerkPublishableKey: string;
}

/**
 * Determines the API base URL.
 * - In production: Uses same-origin (empty string) since Vercel rewrites /api/* to Railway
 * - In development: Falls back to localhost:3333
 * - Can be overridden with VITE_API_URL for custom setups
 */
function getDefaultApiUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Production: use same-origin (Vercel rewrites handle routing to Railway)
    return '';
  }
  // Development: use local API server
  return 'http://localhost:3333';
}

/**
 * Fetches public configuration from the API.
 * This function is called once at application initialization.
 *
 * @returns Promise that resolves to the public configuration
 * @throws Error if the configuration cannot be fetched or is invalid
 */
export async function fetchPublicConfig(): Promise<PublicConfig> {
  const apiUrl = import.meta.env.VITE_API_URL || getDefaultApiUrl();
  const configUrl = `${apiUrl}/api/config/public`;

  try {
    const response = await fetch(configUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch configuration: ${response.status} ${response.statusText}`
      );
    }

    const config = await response.json();

    // Validate the configuration
    if (!config.clerkPublishableKey) {
      throw new Error(
        'Invalid configuration: missing clerkPublishableKey'
      );
    }

    return config;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      const apiLocation = apiUrl || 'same origin (via Vercel rewrites)';
      throw new Error(
        `Configuration fetch failed: ${error.message}. ` +
        `Make sure the API is running at ${apiLocation}`
      );
    }
    throw error;
  }
}

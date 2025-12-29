import { API_PREFIX, getApiUrl } from './environment';

/**
 * Public configuration fetched from the API at runtime.
 * This allows the same build artifact to be deployed to different environments.
 */
export interface PublicConfig {
  clerkPublishableKey: string;
}

/**
 * Fetches public configuration from the API.
 * This function is called once at application initialization.
 *
 * @returns Promise that resolves to the public configuration
 * @throws Error if the configuration cannot be fetched or is invalid
 */
export async function fetchPublicConfig(): Promise<PublicConfig> {
  const apiUrl = getApiUrl();
  const configUrl = `${apiUrl}/${API_PREFIX}/config/public`;

  try {
    const response = await fetch(configUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch configuration: ${response.status} ${response.statusText}`,
      );
    }

    const config = await response.json();

    // Validate the configuration
    if (!config.clerkPublishableKey) {
      throw new Error('Invalid configuration: missing clerkPublishableKey');
    }

    return config;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      const apiLocation = apiUrl || 'same origin (via Vercel rewrites)';
      throw new Error(
        `Configuration fetch failed: ${error.message}. ` +
          `Make sure the API is running at ${apiLocation}`,
      );
    }
    throw error;
  }
}

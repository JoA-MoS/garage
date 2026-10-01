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

  const persist = import.meta.env.VITE_LOCAL_FIRST_GOALS === 'true';
  const storageKey = `soccer-public-config-v1:${configUrl}`;
  let receivedResponse = false;
  try {
    const response = await fetch(configUrl);
    receivedResponse = true;

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

    const publicConfig = { clerkPublishableKey: config.clerkPublishableKey };
    if (persist) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(publicConfig));
      } catch {
        // Public bootstrap caching is best effort; goal durability uses IndexedDB.
      }
    }
    return publicConfig;
  } catch (error) {
    // Only a transport failure can use the last validated public bootstrap key.
    // Never hide a response that revokes or invalidates configuration.
    if (persist) {
      try {
        if (receivedResponse) localStorage.removeItem(storageKey);
        else {
          const cached = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
          if (
            typeof cached?.clerkPublishableKey === 'string' &&
            cached.clerkPublishableKey
          )
            return { clerkPublishableKey: cached.clerkPublishableKey };
        }
      } catch {
        // Blocked/corrupt storage must preserve the original network error.
      }
    }
    // Re-throw with more context
    if (error instanceof Error) {
      const apiLocation = apiUrl || 'same origin (via Vite proxy)';
      throw new Error(
        `Configuration fetch failed: ${error.message}. ` +
          `Make sure the API is running at ${apiLocation}`,
      );
    }
    throw error;
  }
}

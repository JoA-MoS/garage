import { StrictMode, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ApolloProvider } from '@apollo/client/react';

import { router } from './app/router/router';
import { apolloClient, setTokenGetter } from './app/services/apollo-client';
import {
  fetchPublicConfig,
  PublicConfig,
  readCachedPublicConfig,
  savePublicConfig,
} from './app/services/config.service';
import {
  restoreCache,
  type CacheSnapshot,
  type ObservableInMemoryCache,
} from './app/services/cache-persistence';
import { AuthErrorProvider } from './app/providers/auth-error-provider';
import { CachePersistence } from './app/providers/cache-persistence';
import { registerServiceWorker } from './app/pwa/register-service-worker';
import { registerWarmupOnWake, warmUpApi } from './app/services/warmup.service';

// Wake the Aurora database as early as possible (before React/Clerk) so the
// ~15s resume overlaps app startup.
warmUpApi();
registerWarmupOnWake();

// Component that sets up the auth token getter for Apollo
function AuthApolloProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}

// Loading component displayed while configuration is being fetched
function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="text-gray-600">Loading configuration...</p>
      </div>
    </div>
  );
}

// Error component displayed when configuration fetch fails
function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md rounded-lg bg-white p-4 shadow-lg sm:p-6 md:p-8">
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          Configuration Error
        </h1>
        <p className="mb-4 text-gray-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-[44px] min-w-[44px] rounded bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 active:bg-blue-800"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// Start loading the saved Apollo cache immediately, in parallel with
// everything else. Capped so a stuck IndexedDB can't block startup; a
// snapshot that arrives after the cap is discarded, never applied.
const RESTORE_DEADLINE_MS = 1500;
const cacheRestored: Promise<CacheSnapshot | undefined> = restoreCache(
  apolloClient.cache as ObservableInMemoryCache,
  { deadlineMs: RESTORE_DEADLINE_MS },
);

// Build-time key (useful for debugging); otherwise fetched from the API.
const buildTimeKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Main App component that handles configuration loading
function App() {
  // Start from the config saved last time, so opening the app doesn't wait
  // on the API; it's refreshed in the background below.
  const [config, setConfig] = useState<PublicConfig | null>(() =>
    buildTimeKey
      ? { clerkPublishableKey: buildTimeKey }
      : readCachedPublicConfig(),
  );
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState<{ userId?: string } | null>(null);

  useEffect(() => {
    void cacheRestored.then((snapshot) =>
      setRestored({ userId: snapshot?.userId }),
    );
  }, []);

  useEffect(() => {
    if (buildTimeKey) return;

    fetchPublicConfig()
      .then((fetchedConfig) => {
        savePublicConfig(fetchedConfig);
        setConfig((current) =>
          current?.clerkPublishableKey === fetchedConfig.clerkPublishableKey
            ? current
            : fetchedConfig,
        );
      })
      .catch((err) => {
        console.error('Failed to load configuration:', err);
        // Only fatal when there's no saved config to run with.
        setError(err.message || 'Failed to load configuration');
      });
  }, []); // Empty dependency array ensures this runs only once

  if (error && !config) {
    return <ErrorScreen error={error} />;
  }

  if (!config || !restored) {
    return <LoadingScreen />;
  }

  // Render the app with the fetched configuration
  return (
    <ClerkProvider
      publishableKey={config.clerkPublishableKey}
      afterSignOutUrl="/"
    >
      <AuthErrorProvider>
        <AuthApolloProvider>
          <CachePersistence restoredUserId={restored.userId} />
          <RouterProvider router={router} />
        </AuthApolloProvider>
      </AuthErrorProvider>
    </ClerkProvider>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();

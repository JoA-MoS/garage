import { StrictMode, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ApolloProvider } from '@apollo/client/react';

import { router } from './app/router/router';
import { apolloClient, setTokenGetter } from './app/services/apollo-client';
import { fetchPublicConfig, PublicConfig } from './app/services/config.service';

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
      <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Configuration Error</h1>
        <p className="mb-4 text-gray-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// Main App component that handles configuration loading
function App() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicConfig()
      .then((fetchedConfig) => {
        setConfig(fetchedConfig);
      })
      .catch((err) => {
        console.error('Failed to load configuration:', err);
        setError(err.message || 'Failed to load configuration');
      });
  }, []);

  // Show loading state while configuration is being fetched
  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!config) {
    return <LoadingScreen />;
  }

  // Render the app with the fetched configuration
  return (
    <ClerkProvider publishableKey={config.clerkPublishableKey} afterSignOutUrl="/">
      <AuthApolloProvider>
        <RouterProvider router={router} />
      </AuthApolloProvider>
    </ClerkProvider>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

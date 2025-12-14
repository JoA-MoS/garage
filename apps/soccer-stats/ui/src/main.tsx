import { StrictMode, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ApolloProvider } from '@apollo/client/react';

import { router } from './app/router/router';
import { apolloClient, setTokenGetter } from './app/services/apollo-client';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

// Component that sets up the auth token getter for Apollo
function AuthApolloProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AuthApolloProvider>
        <RouterProvider router={router} />
      </AuthApolloProvider>
    </ClerkProvider>
  </StrictMode>
);

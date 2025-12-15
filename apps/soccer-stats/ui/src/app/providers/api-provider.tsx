import { ApolloProvider } from '@apollo/client/react';
import { useAuth } from '@clerk/clerk-react';
import { ReactNode, useEffect } from 'react';

import { apolloClient, setTokenGetter } from '../services/apollo-client';

interface ApiProviderProps {
  children: ReactNode;
}

/**
 * Apollo Client provider component that wraps the app to provide GraphQL functionality
 * Integrates with Clerk authentication to add auth headers to requests
 */
export const ApiProvider = ({ children }: ApiProviderProps) => {
  const { getToken } = useAuth();

  // Set up the token getter for Apollo Client auth
  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};

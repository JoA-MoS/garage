import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ReactNode } from 'react';

// Create HTTP link to the GraphQL endpoint
const httpLink = createHttpLink({
  uri: 'http://localhost:3333/graphql',
});

// Create Apollo Client instance
const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

interface ApiProviderProps {
  children: ReactNode;
}

/**
 * Apollo Client provider component that wraps the app to provide GraphQL functionality
 */
export const ApiProvider = ({ children }: ApiProviderProps) => {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};

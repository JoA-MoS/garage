import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// Create HTTP link to the GraphQL endpoint
// Uses VITE_API_URL env var in production, falls back to localhost for development
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
const httpLink = createHttpLink({
  uri: `${apiUrl}/graphql`,
});

// Create WebSocket URL from API URL
// Convert http:// to ws:// and https:// to wss://
const wsUrl = apiUrl.replace(/^http/, 'ws') + '/graphql';

// Token getter function - will be set by the AuthApolloProvider
let getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  getToken = getter;
}

// Create WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: async () => {
      const token = getToken ? await getToken() : null;
      return {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      };
    },
    // Reconnect on connection loss
    shouldRetry: () => true,
    retryAttempts: Infinity,
  })
);

// Auth link that adds the token to HTTP requests
const authLink = setContext(async (_, { headers }) => {
  const token = getToken ? await getToken() : null;
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Split link - use WebSocket for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  ApolloLink.from([authLink, httpLink])
);

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: splitLink,
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

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

import { API_PREFIX, getApiUrl } from './environment';

const apiUrl = getApiUrl();

// GraphQL endpoint - uses API_PREFIX for consistent routing
const httpLink = createHttpLink({
  uri: `${apiUrl}/${API_PREFIX}/graphql`,
});

/**
 * WebSocket URL for subscriptions.
 * - Development: ws://localhost:3333/{API_PREFIX}/graphql
 * - Production: Direct connection to Railway (Vercel doesn't proxy WebSockets)
 */
const wsUrl = apiUrl
  ? apiUrl.replace(/^http/, 'ws') + `/${API_PREFIX}/graphql`
  : `wss://soccer-stats.up.railway.app/${API_PREFIX}/graphql`;

// Token getter function - will be set by the AuthApolloProvider
let getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  getToken = getter;
}

// Auth error handler - will be set by the AuthApolloProvider
let onAuthError: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
  onAuthError = handler;
}

// Error link to handle GraphQL errors globally
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check for authentication errors
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        console.error('Authentication error:', err.message);
        if (onAuthError) {
          onAuthError();
        }
      }
    }
  }
  if (networkError) {
    console.error('Network error:', networkError);
  }
});

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
  }),
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
  ApolloLink.from([errorLink, authLink, httpLink]),
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

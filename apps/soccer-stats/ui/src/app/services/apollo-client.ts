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

/**
 * Determines the API base URL for GraphQL.
 * - In production: Uses same-origin (empty string) since Vercel rewrites /api/* to Railway
 * - In development: Falls back to localhost:3333
 * - Can be overridden with VITE_API_URL for custom setups
 */
function getApiUrl(): string {
  // Check for explicit override first
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== '') {
    return envUrl;
  }

  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost'
  ) {
    // Production: use same-origin (Vercel rewrites handle routing to Railway)
    return '';
  }
  // Development: use local API server
  return 'http://localhost:3333';
}

// Create HTTP link to the GraphQL endpoint
// In production, uses /api/graphql which Vercel rewrites to Railway's /graphql
const apiUrl = getApiUrl();
const graphqlPath = apiUrl ? '/graphql' : '/api/graphql';
const httpLink = createHttpLink({
  uri: `${apiUrl}${graphqlPath}`,
});

// Create WebSocket URL from API URL
// In development: convert http://localhost:3333 to ws://localhost:3333/graphql
// In production: WebSockets don't go through Vercel rewrites, so connect directly to Railway
function getWsUrl(): string {
  if (apiUrl) {
    // Development or custom URL: convert http to ws
    return apiUrl.replace(/^http/, 'ws') + '/graphql';
  }
  // Production: connect directly to Railway for WebSockets
  return 'wss://soccer-stats.up.railway.app/graphql';
}
const wsUrl = getWsUrl();

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
  ApolloLink.from([authLink, httpLink]),
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

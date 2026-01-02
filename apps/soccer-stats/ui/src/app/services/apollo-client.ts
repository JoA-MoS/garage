import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
  split,
} from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

import { API_PREFIX, getApiUrl } from './environment';

const apiUrl = getApiUrl();

// Railway backend URL for direct connections from Vercel
// Both HTTP and WebSocket connect directly to Railway, bypassing Vercel rewrites
const RAILWAY_URL = 'https://soccer-stats.up.railway.app';

/**
 * Detect if running on Vercel deployment.
 * Used to route requests directly to Railway instead of through Vercel.
 */
function isVercelDeployment(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.host.includes('.vercel.app')
  );
}

/**
 * Get the HTTP URL for GraphQL queries/mutations.
 * - Development: Uses Vite proxy (same-origin requests)
 * - Production with VITE_API_URL: Direct connection to specified URL
 * - Production on Vercel: Direct connection to Railway
 */
function getHttpUrl(): string {
  // If apiUrl is explicitly set via VITE_API_URL, use it
  if (apiUrl) {
    return `${apiUrl}/${API_PREFIX}/graphql`;
  }

  // On Vercel, connect directly to Railway
  if (isVercelDeployment()) {
    return `${RAILWAY_URL}/${API_PREFIX}/graphql`;
  }

  // Development: Use same-origin (Vite proxy handles /api/*)
  return `/${API_PREFIX}/graphql`;
}

/**
 * Get the WebSocket URL for GraphQL subscriptions.
 * - Development: Uses Vite proxy (ws: true in proxy config)
 * - Production with VITE_API_URL: Direct connection to specified URL
 * - Production on Vercel: Direct connection to Railway
 */
function getWsUrl(): string {
  // If apiUrl is explicitly set via VITE_API_URL, use it
  if (apiUrl) {
    return apiUrl.replace(/^http/, 'ws') + `/${API_PREFIX}/graphql`;
  }

  // On Vercel, connect directly to Railway
  if (isVercelDeployment()) {
    return RAILWAY_URL.replace(/^http/, 'ws') + `/${API_PREFIX}/graphql`;
  }

  // Development: Use Vite proxy (ws: true enables WebSocket proxying)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/${API_PREFIX}/graphql`;
  }

  // Fallback for SSR or non-browser environments
  return RAILWAY_URL.replace(/^http/, 'ws') + `/${API_PREFIX}/graphql`;
}

const httpUrl = getHttpUrl();
const wsUrl = getWsUrl();

// GraphQL endpoint for queries and mutations
const httpLink = createHttpLink({
  uri: httpUrl,
});

// Token getter function - will be set by the AuthApolloProvider
let getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  getToken = getter;
}

// Auth error handler - will be set by the AuthApolloProvider
let onAuthError: (() => void) | null = null;

export function setAuthErrorHandler(handler: (() => void) | null) {
  onAuthError = handler;
}

// Error link to handle GraphQL errors globally
const errorLink = new ErrorLink(({ error, operation }) => {
  if (CombinedGraphQLErrors.is(error)) {
    // Handle GraphQL errors
    for (const err of error.errors) {
      const errorCode = err.extensions?.code;

      // Log all GraphQL errors for debugging/monitoring
      console.error(
        `[GraphQL Error] ${operation.operationName || 'Unknown'}:`,
        {
          message: err.message,
          code: errorCode,
          path: err.path,
        }
      );

      // Trigger auth error handler for authentication failures
      if (errorCode === 'UNAUTHENTICATED') {
        if (onAuthError) {
          onAuthError();
        }
      }
    }
  } else {
    // Handle network errors
    console.error('[Network Error]:', error);
  }
});

// Create WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: async () => {
      try {
        const token = getToken ? await getToken() : null;
        return {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        };
      } catch (error) {
        console.error(
          '[WebSocket] Failed to retrieve authentication token:',
          error
        );
        // Return empty params - connection will proceed without auth
        // The server should reject unauthenticated requests appropriately
        return {};
      }
    },
    // Reconnect on connection loss
    shouldRetry: () => true,
    retryAttempts: Infinity,
    // WebSocket connection event handlers for debugging/monitoring
    on: {
      connected: () => {
        console.log('[WebSocket] Connected to', wsUrl);
      },
      closed: (event) => {
        console.warn('[WebSocket] Connection closed:', event);
      },
      error: (error) => {
        console.error('[WebSocket] Connection error:', error);
      },
    },
  })
);

// Auth link that adds the token to HTTP requests
const authLink = setContext(async (_, { headers }) => {
  let token: string | null = null;
  try {
    token = getToken ? await getToken() : null;
  } catch (error) {
    console.error('[Apollo] Failed to retrieve authentication token:', error);
    // Proceed without token - let the server reject if auth is required
  }
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
  ApolloLink.from([errorLink, authLink, httpLink])
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

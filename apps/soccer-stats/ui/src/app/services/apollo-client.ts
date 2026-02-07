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

/**
 * Get the HTTP URL for GraphQL queries/mutations.
 * Returns relative URL for same-origin requests (CloudFront, dev proxy).
 */
function getHttpUrl(): string {
  const baseUrl = getApiUrl();
  return baseUrl
    ? `${baseUrl}/${API_PREFIX}/graphql`
    : `/${API_PREFIX}/graphql`;
}

/**
 * Get the WebSocket URL for GraphQL subscriptions.
 * - Same-origin: Uses current host with appropriate protocol (ws/wss)
 * - VITE_API_URL override: Converts HTTP URL to WebSocket URL
 */
function getWsUrl(): string {
  const baseUrl = getApiUrl();

  // If explicit base URL provided, convert to WebSocket URL
  if (baseUrl) {
    return baseUrl.replace(/^http/, 'ws') + `/${API_PREFIX}/graphql`;
  }

  // Same-origin: Use current window location
  // Works for CloudFront (wss://), local dev with Vite proxy (ws://)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/${API_PREFIX}/graphql`;
  }

  // SSR fallback - use relative path (won't actually work for WS but handles build)
  return `/${API_PREFIX}/graphql`;
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
        },
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
      // No token getter configured - allow anonymous connection
      if (!getToken) {
        return {};
      }

      try {
        const token = await getToken();
        return {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        };
      } catch (error) {
        console.error(
          '[WebSocket] Failed to retrieve authentication token:',
          error,
        );
        // Notify UI about auth failure so user can take action
        if (onAuthError) {
          onAuthError();
        }
        // Return empty params - server will reject if auth required
        // The onAuthError handler should prompt user to re-authenticate
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
  }),
);

// Auth link that adds the token to HTTP requests
const authLink = setContext(async (_, { headers }) => {
  // No token getter configured - proceed without auth
  if (!getToken) {
    return { headers };
  }

  let token: string | null = null;
  try {
    token = await getToken();
  } catch (error) {
    console.error('[Apollo] Failed to retrieve authentication token:', error);
    // Notify UI about auth failure so user can take action
    if (onAuthError) {
      onAuthError();
    }
    // Proceed without token - server will reject if auth required
    // The onAuthError handler should prompt user to re-authenticate
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
  ApolloLink.from([errorLink, authLink, httpLink]),
);

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      GameTeam: {
        fields: {
          events: {
            // Merge incoming events with existing, deduplicating by cache reference.
            // Prevents cache.modify additions from being lost when a refetch or
            // subscribeToMore response replaces the array.
            merge(
              existing: Array<{ __ref: string }> = [],
              incoming: Array<{ __ref: string }>,
            ) {
              const refs = new Map(existing.map((ref) => [ref.__ref, ref]));
              for (const ref of incoming) {
                refs.set(ref.__ref, ref);
              }
              return [...refs.values()];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

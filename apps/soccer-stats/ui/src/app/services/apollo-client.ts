import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create HTTP link to the GraphQL endpoint
// Uses VITE_API_URL env var in production, falls back to localhost for development
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';
const httpLink = createHttpLink({
  uri: `${apiUrl}/graphql`,
});

// Token getter function - will be set by the AuthApolloProvider
let getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  getToken = getter;
}

// Auth link that adds the token to requests
const authLink = setContext(async (_, { headers }) => {
  const token = getToken ? await getToken() : null;
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
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

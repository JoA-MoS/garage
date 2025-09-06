import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Create HTTP link to the GraphQL endpoint
const httpLink = createHttpLink({
  uri: 'http://localhost:3333/graphql', // Assuming the API runs on port 3333
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
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

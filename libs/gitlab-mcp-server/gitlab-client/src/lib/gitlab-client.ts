import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';
import { GitLabClientConfig } from '@garage/types';

export class GitLabClient {
  private readonly client: ApolloClient;

  constructor(config: GitLabClientConfig) {
    const baseUrl = config.gitlabUrl.replace(/\/$/, '');

    // Create Apollo Client with GitLab configuration
    this.client = new ApolloClient({
      link: new HttpLink({
        uri: `${baseUrl}/api/graphql`,
        headers: {
          Authorization: `Bearer ${config.gitlabToken}`,
        },
        fetch,
      }),
      cache: new InMemoryCache(),
      defaultOptions: {
        query: {
          fetchPolicy: 'network-only',
        },
      },
    });
  }

  /**
   * Execute an arbitrary GraphQL query
   * This is the core method that enables schema-driven queries
   */
  async executeQuery(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<{ data: unknown; errors?: unknown[] }> {
    try {
      const result = await this.client.query({
        query: gql(query),
        variables,
      });

      return {
        data: result.data,
        errors: result.error ? [result.error] : undefined,
      };
    } catch (error) {
      // Handle GraphQL errors
      if (error && typeof error === 'object' && 'graphQLErrors' in error) {
        const gqlError = error as { graphQLErrors: unknown[] };
        return {
          data: null,
          errors: gqlError.graphQLErrors,
        };
      }

      // Handle network or other errors
      throw new Error(
        `Query execution failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Execute an arbitrary GraphQL mutation
   */
  async executeMutation(
    mutation: string,
    variables?: Record<string, unknown>
  ): Promise<{ data: unknown; errors?: unknown[] }> {
    try {
      const result = await this.client.mutate({
        mutation: gql(mutation),
        variables,
      });

      return {
        data: result.data,
        errors: result.error ? [result.error] : undefined,
      };
    } catch (error) {
      // Handle GraphQL errors
      if (error && typeof error === 'object' && 'graphQLErrors' in error) {
        const gqlError = error as { graphQLErrors: unknown[] };
        return {
          data: null,
          errors: gqlError.graphQLErrors,
        };
      }

      // Handle network or other errors
      throw new Error(
        `Mutation execution failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

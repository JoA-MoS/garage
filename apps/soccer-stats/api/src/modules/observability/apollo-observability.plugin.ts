import { Injectable, Optional } from '@nestjs/common';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContext,
  BaseContext,
} from '@apollo/server';
import { DocumentNode, GraphQLError, GraphQLSchema } from 'graphql';
import {
  getComplexity,
  fieldExtensionsEstimator,
  simpleEstimator,
} from 'graphql-query-complexity';

import {
  getObservabilityLogLevel,
  getQueryComplexityLogging,
  getSlowQueryThresholdMs,
  getQueryComplexityLimit,
} from '../../app/environment';

import { ObservabilityService } from './observability.service';

/**
 * Apollo Server plugin for GraphQL observability.
 *
 * Features:
 * - Calculate query complexity using graphql-query-complexity library
 * - Support for @Complexity decorators on TypeGraphQL fields
 * - Detect and warn on slow queries
 * - Log GraphQL errors with context
 *
 * Complexity calculation uses two estimators:
 * 1. fieldExtensionsEstimator - reads complexity from TypeGraphQL @Complexity decorators
 * 2. simpleEstimator - fallback with default cost of 1 per field
 *
 * Controlled by environment variables:
 * - OBSERVABILITY_LOG_LEVEL: none | basic | verbose
 * - QUERY_COMPLEXITY_LOGGING: enables/disables complexity logging
 * - SLOW_QUERY_THRESHOLD_MS: warn threshold (default 1000)
 * - QUERY_COMPLEXITY_LIMIT: warn threshold (default 250)
 */
@Injectable()
export class ApolloObservabilityPlugin
  implements ApolloServerPlugin<BaseContext>
{
  constructor(
    @Optional() private readonly observabilityService?: ObservabilityService,
  ) {}

  async requestDidStart(
    requestContext: GraphQLRequestContext<BaseContext>,
  ): Promise<GraphQLRequestListener<BaseContext> | void> {
    // Check if logging is enabled
    if (!this.shouldLog()) {
      return;
    }

    const startTime = Date.now();
    const operationName = requestContext.request.operationName || null;

    // Skip introspection
    if (operationName === 'IntrospectionQuery') {
      return;
    }

    // Capture service reference for use in nested callbacks
    const observabilityService = this.observabilityService;

    // Store complexity for use in willSendResponse
    let queryComplexity = 0;

    return {
      async didResolveOperation(
        context: GraphQLRequestContext<BaseContext>,
      ): Promise<void> {
        if (!context.document || !context.schema) {
          return;
        }

        // Calculate complexity using the library
        queryComplexity = calculateComplexity(
          context.schema,
          context.document,
          context.request.variables || {},
        );

        const complexityLimit = getQueryComplexityLimit();

        if (queryComplexity > complexityLimit && observabilityService) {
          observabilityService.logHighComplexityWarning(
            operationName,
            queryComplexity,
            complexityLimit,
          );
        }
      },

      async willSendResponse(
        context: GraphQLRequestContext<BaseContext>,
      ): Promise<void> {
        const durationMs = Date.now() - startTime;
        const slowQueryThreshold = getSlowQueryThresholdMs();

        // Log slow queries
        if (durationMs > slowQueryThreshold && observabilityService) {
          observabilityService.logSlowQueryWarning(
            operationName,
            durationMs,
            slowQueryThreshold,
          );
        }

        // Log query metrics in verbose mode
        if (getObservabilityLogLevel() === 'verbose' && observabilityService) {
          const hasErrors = (context.response?.body as { errors?: unknown[] })
            ?.errors
            ? true
            : false;

          observabilityService.logQueryMetrics({
            operationName,
            complexity: queryComplexity,
            durationMs,
            hasErrors,
          });
        }
      },

      async didEncounterErrors(
        context: GraphQLRequestContext<BaseContext>,
      ): Promise<void> {
        if (!observabilityService) {
          return;
        }

        const errors = context.errors || [];
        for (const error of errors) {
          // Skip validation errors in development (noise from playground)
          if (
            error instanceof GraphQLError &&
            error.extensions?.code === 'GRAPHQL_VALIDATION_FAILED'
          ) {
            continue;
          }

          observabilityService.logGraphQLError(operationName, {
            message: error.message,
            path: error.path,
          });
        }
      },
    };
  }

  private shouldLog(): boolean {
    if (!this.observabilityService) {
      return false;
    }

    const logLevel = getObservabilityLogLevel();
    if (logLevel === 'none') {
      return false;
    }

    return getQueryComplexityLogging();
  }
}

/**
 * Calculate query complexity using graphql-query-complexity library.
 *
 * Uses two estimators in order:
 * 1. fieldExtensionsEstimator - reads complexity from TypeGraphQL @Complexity decorators
 * 2. simpleEstimator - fallback with default cost of 1 per field
 *
 * @param schema - The GraphQL schema
 * @param document - The parsed query document
 * @param variables - Query variables (used for dynamic complexity calculation)
 * @returns Complexity score
 */
function calculateComplexity(
  schema: GraphQLSchema,
  document: DocumentNode,
  variables: Record<string, unknown>,
): number {
  try {
    return getComplexity({
      schema,
      query: document,
      variables,
      estimators: [
        // First, try to get complexity from TypeGraphQL @Complexity decorators
        fieldExtensionsEstimator(),
        // Fallback: each field has complexity of 1
        simpleEstimator({ defaultComplexity: 1 }),
      ],
    });
  } catch (error) {
    // If complexity calculation fails, log and return 0
    // This shouldn't happen with valid queries, but we don't want to crash
    console.warn(
      '[ApolloObservabilityPlugin] Failed to calculate complexity:',
      error instanceof Error ? error.message : error,
    );
    return 0;
  }
}

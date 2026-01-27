import { Injectable, Optional } from '@nestjs/common';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContext,
  BaseContext,
} from '@apollo/server';
import { GraphQLError, DocumentNode, OperationDefinitionNode } from 'graphql';

import {
  getObservabilityLogLevel,
  getQueryComplexityLogging,
  getSlowQueryThresholdMs,
  getQueryComplexityLimit,
} from '../../app/environment';

import { ObservabilityService } from './observability.service';

/**
 * Calculate a simple depth-based complexity score for a GraphQL document.
 * This is a heuristic - not a full query complexity analysis.
 *
 * @param document - The parsed GraphQL document
 * @returns Complexity score based on field depth and count
 */
function calculateQueryComplexity(document: DocumentNode): number {
  let complexity = 0;

  function visitNode(
    node: unknown,
    depth: number,
    visited: WeakSet<object>,
  ): void {
    if (!node || typeof node !== 'object') {
      return;
    }

    // Prevent cycles
    if (visited.has(node)) {
      return;
    }
    visited.add(node);

    const typedNode = node as { kind?: string; selectionSet?: unknown };

    // Count each field selection, weighted by depth
    if (typedNode.kind === 'Field') {
      complexity += depth;
    }

    // Recurse into selection sets
    if (typedNode.selectionSet) {
      const selectionSet = typedNode.selectionSet as {
        selections?: unknown[];
      };
      if (Array.isArray(selectionSet.selections)) {
        for (const selection of selectionSet.selections) {
          visitNode(selection, depth + 1, visited);
        }
      }
    }

    // Handle operation definitions
    if (typedNode.kind === 'OperationDefinition') {
      const opNode = node as OperationDefinitionNode;
      if (opNode.selectionSet?.selections) {
        for (const selection of opNode.selectionSet.selections) {
          visitNode(selection, 1, visited);
        }
      }
    }
  }

  const visited = new WeakSet<object>();
  for (const definition of document.definitions) {
    visitNode(definition, 0, visited);
  }

  return complexity;
}

/**
 * Apollo Server plugin for GraphQL observability.
 *
 * Features:
 * - Calculate and log query complexity
 * - Detect and warn on slow queries
 * - Log GraphQL errors with context
 *
 * Controlled by environment variables:
 * - OBSERVABILITY_LOG_LEVEL: none | basic | verbose
 * - QUERY_COMPLEXITY_LOGGING: override for query logging
 * - SLOW_QUERY_THRESHOLD_MS: warn threshold (default 1000)
 * - QUERY_COMPLEXITY_LIMIT: warn threshold (default 100)
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

    return {
      async didResolveOperation(
        context: GraphQLRequestContext<BaseContext>,
      ): Promise<void> {
        if (!context.document) {
          return;
        }

        const complexity = calculateQueryComplexity(context.document);
        const complexityLimit = getQueryComplexityLimit();

        if (complexity > complexityLimit && observabilityService) {
          observabilityService.logHighComplexityWarning(
            operationName,
            complexity,
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
          const complexity = context.document
            ? calculateQueryComplexity(context.document)
            : 0;
          const hasErrors = (context.response?.body as { errors?: unknown[] })
            ?.errors
            ? true
            : false;

          observabilityService.logQueryMetrics({
            operationName,
            complexity,
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

import { randomUUID } from 'crypto';

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Optional,
} from '@nestjs/common';
import { GqlExecutionContext, GqlContextType } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import {
  getObservabilityLogLevel,
  getMemoryLogging,
} from '../../app/environment';

import { ObservabilityService, MemorySnapshot } from './observability.service';

/**
 * NestJS Interceptor that logs request lifecycle for GraphQL operations.
 *
 * Features:
 * - Logs request start with memory snapshot
 * - Logs request end with duration and memory delta
 * - Warns if memory delta exceeds threshold (50MB)
 * - Generates unique request ID for correlation
 *
 * Controlled by OBSERVABILITY_LOG_LEVEL and MEMORY_LOGGING env vars.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Optional() private readonly observabilityService?: ObservabilityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Check if logging is enabled
    if (!this.shouldLog()) {
      return next.handle();
    }

    // Only intercept GraphQL requests
    const contextType = context.getType<GqlContextType>();
    if (contextType !== 'graphql') {
      return next.handle();
    }

    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const operationName = info.operation?.name?.value || null;

    // Skip introspection queries
    if (
      operationName === 'IntrospectionQuery' ||
      info.fieldName === '__schema'
    ) {
      return next.handle();
    }

    const requestId = randomUUID().slice(0, 8);
    const startTime = Date.now();
    const startMemory = this.observabilityService?.getMemorySnapshot() || null;

    // Log request start
    if (this.observabilityService) {
      this.observabilityService.logRequestStart(requestId, operationName);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          this.logComplete(requestId, operationName, startTime, startMemory);
        },
        error: () => {
          this.logComplete(requestId, operationName, startTime, startMemory);
        },
      }),
    );
  }

  private shouldLog(): boolean {
    if (!this.observabilityService) {
      return false;
    }

    const logLevel = getObservabilityLogLevel();
    if (logLevel === 'none') {
      return false;
    }

    // Memory logging can be disabled independently
    return getMemoryLogging();
  }

  private logComplete(
    requestId: string,
    operationName: string | null,
    startTime: number,
    startMemory: MemorySnapshot | null,
  ): void {
    if (!this.observabilityService || !startMemory) {
      return;
    }

    const durationMs = Date.now() - startTime;
    this.observabilityService.logRequestComplete(
      requestId,
      operationName,
      durationMs,
      startMemory,
    );
  }
}

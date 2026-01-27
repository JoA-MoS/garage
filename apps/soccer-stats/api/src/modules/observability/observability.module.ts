import { Module, Global } from '@nestjs/common';

import { ObservabilityService } from './observability.service';
import { LoggingInterceptor } from './logging.interceptor';
import { ApolloObservabilityPlugin } from './apollo-observability.plugin';

/**
 * Global module providing observability infrastructure.
 *
 * Exports:
 * - ObservabilityService: Memory monitoring, logging utilities
 * - LoggingInterceptor: Request lifecycle logging
 * - ApolloObservabilityPlugin: GraphQL query metrics
 *
 * Being global means services can inject ObservabilityService without
 * explicitly importing ObservabilityModule.
 *
 * All features are controlled by environment variables and default to off,
 * making this safe to deploy without behavior change.
 */
@Global()
@Module({
  providers: [
    ObservabilityService,
    LoggingInterceptor,
    ApolloObservabilityPlugin,
  ],
  exports: [
    ObservabilityService,
    LoggingInterceptor,
    ApolloObservabilityPlugin,
  ],
})
export class ObservabilityModule {}

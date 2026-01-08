/**
 * Soccer Stats API - NestJS GraphQL Backend
 * This server provides a GraphQL API for the soccer statistics tracker application.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import {
  API_PREFIX,
  getPort,
  isProduction,
  getFrontendUrl,
} from './app/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global configuration - uses API_PREFIX from environment.ts for consistency with GraphQL path
  app.setGlobalPrefix(API_PREFIX);

  // Note: ValidationPipe is not used for this GraphQL API.
  // GraphQL provides its own schema-based validation.
  // The NestJS ValidationPipe with forbidNonWhitelisted causes
  // conflicts with GraphQL input types.

  // CORS configuration
  // - Same-origin requests are always allowed (origin header is undefined)
  // - Cross-origin requests are allowed only if origin is in FRONTEND_URL
  app.enableCors({
    origin: (origin, callback) => {
      // Same-origin requests don't send Origin header - always allow
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in the allowed list from FRONTEND_URL
      const frontendUrl = getFrontendUrl();
      if (frontendUrl) {
        const allowedOrigins = frontendUrl.split(',').map((url) => url.trim());
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }

      // Reject cross-origin requests not in allowed list
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  });

  const port = getPort();
  await app.listen(port);

  const logger = new Logger('Bootstrap');

  logger.log(`Soccer Stats API running on port ${port}`);
  logger.log(`GraphQL endpoint: /${API_PREFIX}/graphql`);

  if (!isProduction()) {
    logger.log(`Local URL: http://localhost:${port}/${API_PREFIX}`);
    logger.log(
      `GraphQL Playground: http://localhost:${port}/${API_PREFIX}/graphql`,
    );
  }
}

bootstrap();

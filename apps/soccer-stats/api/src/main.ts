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
  // If FRONTEND_URL is set, restrict to those origins; otherwise allow all.
  // Same-origin requests (via Vite proxy or CloudFront) bypass CORS entirely.
  const frontendUrl = getFrontendUrl();
  const corsOrigin = frontendUrl
    ? frontendUrl.split(',').map((url) => url.trim())
    : true;
  app.enableCors({ origin: corsOrigin, credentials: true });

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

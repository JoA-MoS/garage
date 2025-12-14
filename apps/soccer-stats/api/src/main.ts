/**
 * Soccer Stats API - NestJS GraphQL Backend
 * This server provides a GraphQL API for the soccer statistics tracker application.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global configuration
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Note: ValidationPipe is not used for this GraphQL API.
  // GraphQL provides its own schema-based validation.
  // The NestJS ValidationPipe with forbidNonWhitelisted causes
  // conflicts with GraphQL input types.

  // Enable CORS for frontend integration
  // Supports comma-separated origins for multiple frontends (e.g., local + production)
  const allowedOrigins = (
    process.env['FRONTEND_URL'] || 'http://localhost:4200'
  )
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env['PORT'] || 3333;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  const isProduction = process.env['NODE_ENV'] === 'production';

  logger.log(`Soccer Stats API running on port ${port}`);
  logger.log(`GraphQL endpoint: /graphql`);

  if (!isProduction) {
    logger.log(`Local URL: http://localhost:${port}/${globalPrefix}`);
    logger.log(`GraphQL Playground: http://localhost:${port}/graphql`);
  }
}

bootstrap();

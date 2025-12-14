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
  app.enableCors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:4200',
    credentials: true,
  });

  const port = process.env['PORT'] || 3333;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(
    `🚀 Soccer Stats API is running on: http://localhost:${port}/${globalPrefix}`
  );
  logger.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  logger.log(`🗄️  Database Admin (Adminer): http://localhost:8080`);
  logger.log(`🏟️  Ready for soccer statistics tracking!`);
}

bootstrap();

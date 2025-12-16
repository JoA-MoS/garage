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
  // Supports:
  // - Comma-separated explicit origins (e.g., "http://localhost:4200,https://example.com")
  // - Wildcard patterns using regex (e.g., "*.joamos-projects.vercel.app")
  const frontendUrls = (
    process.env['FRONTEND_URL'] || 'http://localhost:4200,http://localhost:3333'
  )
    .split(',')
    .map((origin) => origin.trim());

  // Convert wildcard patterns to regex, keep explicit origins as strings
  const allowedOrigins: (string | RegExp)[] = frontendUrls.map((origin) => {
    if (origin.includes('*')) {
      // Convert wildcard pattern to regex
      // "*.example.com" → matches "sub.example.com" (subdomain wildcard)
      // "*-team.vercel.app" → matches "app-hash-team.vercel.app" (Vercel pattern)
      // Uses restrictive pattern to prevent leading/trailing hyphens
      // Includes uppercase letters for case-insensitive matching (domains are case-insensitive)
      const escaped = origin
        .replace(/\./g, '\\.')
        .replace(/\*/g, '[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?');
      return new RegExp(`^https?://${escaped}$`, 'i');
    }
    return origin;
  });

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return allowed === requestOrigin;
        }
        return allowed.test(requestOrigin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
      }
    },
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

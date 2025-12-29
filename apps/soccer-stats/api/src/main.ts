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
  getFrontendUrl,
  isProduction,
} from './app/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global configuration - uses API_PREFIX from environment.ts for consistency with GraphQL path
  app.setGlobalPrefix(API_PREFIX);

  // Note: ValidationPipe is not used for this GraphQL API.
  // GraphQL provides its own schema-based validation.
  // The NestJS ValidationPipe with forbidNonWhitelisted causes
  // conflicts with GraphQL input types.

  // Enable CORS for frontend integration
  // Supports:
  // - Comma-separated explicit origins (e.g., "http://localhost:4200,https://example.com")
  // - Wildcard patterns using regex (e.g., "*.joamos-projects.vercel.app")
  const frontendUrls = getFrontendUrl()
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
      callback: (err: Error | null, allow?: boolean) => void,
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

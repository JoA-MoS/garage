import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app/app.module';

async function bootstrap() {
  console.log(process.env);
  if (
    !process.env['JWT_SECRET'] ||
    process.env['JWT_SECRET'] === 'change-me-in-production'
  ) {
    throw new Error(
      'JWT_SECRET must be set to a strong secret before starting the server',
    );
  }
  if (!process.env['ENCRYPTION_KEY']) {
    throw new Error('ENCRYPTION_KEY must be set before starting the server');
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const allowedOrigins =
    process.env['NODE_ENV'] === 'production'
      ? [process.env['FRONTEND_URL'] ?? '']
      : /^http:\/\/localhost:\d+$/;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3334;
  await app.listen(port);
  console.log(`Sift API running at http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err.message);
  process.exit(1);
});

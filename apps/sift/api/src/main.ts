import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors();

  const port = process.env['PORT'] ?? 3334;
  await app.listen(port);
  console.log(`🚀 Sift API running at http://localhost:${port}/api`);
}

bootstrap();

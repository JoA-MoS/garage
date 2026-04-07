import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountsModule } from '../modules/accounts/accounts.module';
import { EmailsModule } from '../modules/emails/emails.module';
import { ActionsModule } from '../modules/actions/actions.module';
import { AuthModule } from '../modules/auth/auth.module';
import { Email } from '../modules/emails/email.entity';
import { EmailAccount } from '../modules/accounts/email-account.entity';

import { SeedService } from './seed.service';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5433),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASS', 'postgres'),
        database: config.get('DB_NAME', 'sift'),
        synchronize:
          config.get('NODE_ENV') !== 'production' &&
          config.get('DB_SYNCHRONIZE', 'false') === 'true',
        autoLoadEntities: true,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    AccountsModule,
    EmailsModule,
    ActionsModule,
    TypeOrmModule.forFeature([Email, EmailAccount]),
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}

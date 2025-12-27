import { join } from 'path';

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from 'express';

import { GamesModule } from '../modules/games/games.module';
import { TeamsModule } from '../modules/teams/teams.module';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';
import { GameFormatsModule } from '../modules/game-formats/game-formats.module';
import { EventTypesModule } from '../modules/event-types/event-types.module';
import { GameEventsModule } from '../modules/game-events/game-events.module';
import { TeamMembersModule } from '../modules/team-members/team-members.module';
import {
  ClerkActor,
  ClerkPayload,
  ClerkUser,
} from '../modules/auth/clerk.service';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StartupService } from './startup.service';
import { ConfigController } from './config.controller';

interface AuthenticatedRequest extends Request {
  user?: ClerkUser;
  clerkPayload?: ClerkPayload;
  actor?: ClerkActor | null;
  isImpersonating?: boolean;
}

const isProduction = process.env['NODE_ENV'] === 'production';

const typeOrmConfig = {
  type: 'postgres' as const,
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  username: process.env['DB_USERNAME'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'postgres',
  database: process.env['DB_NAME'] || 'soccer_stats',
  autoLoadEntities: true,
  synchronize: process.env['DB_SYNCHRONIZE'] === 'true' || !isProduction,
  logging: process.env['DB_LOGGING'] === 'true' || !isProduction,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(__dirname, 'schema.gql'),
      sortSchema: true,
      playground: false,
      plugins: isProduction
        ? []
        : [ApolloServerPluginLandingPageLocalDefault()],
      introspection:
        process.env['GRAPHQL_INTROSPECTION'] === 'true' || !isProduction,
      subscriptions: {
        'graphql-ws': true,
      },
      context: ({
        req,
        extra,
      }: {
        req?: AuthenticatedRequest;
        extra?: unknown;
      }) => {
        // For WebSocket subscriptions, req is undefined
        // Return minimal context for subscriptions, full context for HTTP requests
        if (!req) {
          return {
            req: null,
            user: null,
            clerkPayload: null,
            actor: null,
            isImpersonating: false,
            extra,
          };
        }
        return {
          req,
          user: req.user,
          clerkPayload: req.clerkPayload,
          actor: req.actor,
          isImpersonating: req.isImpersonating,
        };
      },
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    GamesModule,
    TeamsModule,
    UsersModule,
    AuthModule,
    GameFormatsModule,
    EventTypesModule,
    GameEventsModule,
    TeamMembersModule,
  ],
  controllers: [AppController, ConfigController],
  providers: [AppService, StartupService],
})
export class AppModule {}

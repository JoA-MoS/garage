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
import { MyModule } from '../modules/my/my.module';
import { PubSubModule } from '../modules/pubsub/pubsub.module';
import {
  ClerkActor,
  ClerkPayload,
  ClerkUser,
} from '../modules/auth/clerk.service';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StartupService } from './startup.service';
import { ConfigController } from './config.controller';
import {
  API_PREFIX,
  isProduction,
  getDbHost,
  getDbPort,
  getDbUsername,
  getDbPassword,
  getDbName,
  getDbSynchronize,
  getDbLogging,
  getGraphqlIntrospection,
} from './environment';

interface AuthenticatedRequest extends Request {
  user?: ClerkUser;
  clerkPayload?: ClerkPayload;
  actor?: ClerkActor | null;
  isImpersonating?: boolean;
}

const typeOrmConfig = {
  type: 'postgres' as const,
  host: getDbHost(),
  port: getDbPort(),
  username: getDbUsername(),
  password: getDbPassword(),
  database: getDbName(),
  autoLoadEntities: true,
  synchronize: getDbSynchronize(),
  logging: getDbLogging(),
  ssl: isProduction() ? { rejectUnauthorized: false } : false,
};

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Use /api/graphql to match REST controller prefix for consistent routing
      path: `/${API_PREFIX}/graphql`,
      autoSchemaFile: join(__dirname, 'schema.gql'),
      sortSchema: true,
      playground: false,
      plugins: isProduction()
        ? []
        : [ApolloServerPluginLandingPageLocalDefault()],
      introspection: getGraphqlIntrospection(),
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
    PubSubModule,
    GamesModule,
    TeamsModule,
    UsersModule,
    AuthModule,
    GameFormatsModule,
    EventTypesModule,
    GameEventsModule,
    TeamMembersModule,
    MyModule,
  ],
  controllers: [AppController, ConfigController],
  providers: [AppService, StartupService],
})
export class AppModule {}

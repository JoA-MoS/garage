import { join } from 'path';

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule, SubscriptionConfig } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from 'express';
// @nestjs/apollo's ApolloDriver loads this integration dynamically at
// runtime, so webpack's static analysis (and Nx's generatePackageJson,
// which relies on it) never sees it as used and omits it from the
// production package.json. A direct import forces it to be detected and
// included as a runtime dependency in the built container image.
import '@as-integrations/express5';

import { GamesModule } from '../modules/games/games.module';
import { TeamsModule } from '../modules/teams/teams.module';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';
import { GameFormatsModule } from '../modules/game-formats/game-formats.module';
import { EventTypesModule } from '../modules/event-types/event-types.module';
import { GameEventsModule } from '../modules/game-events/game-events.module';
import { TeamMembersModule } from '../modules/team-members/team-members.module';
import { TeamStatsModule } from '../modules/team-stats/team-stats.module';
import { CalendarSyncModule } from '../modules/calendar-sync/calendar-sync.module';
import { MyModule } from '../modules/my/my.module';
import { PubSubModule } from '../modules/pubsub/pubsub.module';
import { DataLoadersModule, DataLoadersService } from '../modules/dataloaders';
import {
  ObservabilityModule,
  ApolloObservabilityPlugin,
  LoggingInterceptor,
} from '../modules/observability';
import {
  ClerkActor,
  ClerkPayload,
  ClerkUser,
} from '../modules/auth/clerk.service';
import { nestTypeOrmConfig } from '../database/typeorm.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigController } from './config.controller';
import {
  API_PREFIX,
  isProduction,
  getGraphqlIntrospection,
} from './environment';

interface AuthenticatedRequest extends Request {
  user?: ClerkUser;
  clerkPayload?: ClerkPayload;
  actor?: ClerkActor | null;
  isImpersonating?: boolean;
}

@Module({
  imports: [
    // TypeORM must be imported first so entities are available for DataLoaders
    TypeOrmModule.forRoot(nestTypeOrmConfig),
    // DataLoaders module provides batched query infrastructure
    DataLoadersModule,
    // Observability module provides logging, metrics, and monitoring
    ObservabilityModule,
    // GraphQL configured async to inject DataLoadersService and observability plugin
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [DataLoadersModule, ObservabilityModule],
      inject: [DataLoadersService, ApolloObservabilityPlugin],
      useFactory: (
        dataLoadersService: DataLoadersService,
        apolloObservabilityPlugin: ApolloObservabilityPlugin,
      ) => ({
        // Use /api/graphql to match REST controller prefix for consistent routing
        path: `/${API_PREFIX}/graphql`,
        autoSchemaFile: join(__dirname, 'schema.gql'),
        sortSchema: true,
        playground: false,
        plugins: [
          // Add observability plugin for query metrics and slow query detection
          apolloObservabilityPlugin,
          // Add landing page in non-production only
          ...(isProduction()
            ? []
            : [ApolloServerPluginLandingPageLocalDefault()]),
        ],
        introspection: getGraphqlIntrospection(),
        subscriptions: {
          // Periodic ping keeps idle subscriptions (e.g. no goals scored for
          // several minutes) from sitting silent long enough for the ALB or
          // CloudFront to treat the connection as dead and drop it.
          // NestJS's GraphQLWsSubscriptionsConfig type omits `keepAlive`
          // even though it spreads straight through to graphql-ws's
          // useServer(), which does support it — cast around the gap.
          'graphql-ws': {
            keepAlive: 12_000,
          } as SubscriptionConfig['graphql-ws'],
        },
        context: ({
          req,
          extra,
        }: {
          req?: AuthenticatedRequest;
          extra?: unknown;
        }) => {
          // Create fresh DataLoaders for each request (request-scoped caching)
          const loaders = dataLoadersService.createLoaders();

          // For WebSocket subscriptions, req is undefined
          // Return minimal context for subscriptions, full context for HTTP requests
          if (!req) {
            return {
              req: null,
              user: null,
              clerkPayload: null,
              actor: null,
              isImpersonating: false,
              loaders,
              extra,
            };
          }
          return {
            req,
            user: req.user,
            clerkPayload: req.clerkPayload,
            actor: req.actor,
            isImpersonating: req.isImpersonating,
            loaders,
          };
        },
      }),
    }),
    PubSubModule,
    GamesModule,
    TeamsModule,
    UsersModule,
    AuthModule,
    GameFormatsModule,
    EventTypesModule,
    GameEventsModule,
    TeamMembersModule,
    TeamStatsModule,
    CalendarSyncModule,
    MyModule,
  ],
  controllers: [AppController, ConfigController],
  providers: [
    AppService,
    // Register LoggingInterceptor globally for request lifecycle logging
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

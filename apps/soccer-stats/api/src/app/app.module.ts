import { join } from 'path';

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from 'express';

import { GamesModule } from '../modules/games/games.module';
import { TeamsModule } from '../modules/teams/teams.module';
import { PlayersModule } from '../modules/players/players.module';
import { AuthModule } from '../modules/auth/auth.module';
import { GameFormatsModule } from '../modules/game-formats/game-formats.module';
import { ClerkUser } from '../modules/auth/clerk.service';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StartupService } from './startup.service';

interface AuthenticatedRequest extends Request {
  user?: ClerkUser;
  clerkPayload?: { sub: string; [key: string]: unknown };
}

const con = {
  type: 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  username: process.env['DB_USERNAME'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'postgres',
  database: process.env['DB_NAME'] || 'soccer_stats',
  autoLoadEntities: true,
  synchronize: true, // Only for development
  logging: true,
};

console.log(con);

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(__dirname, 'schema.gql'),
      sortSchema: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      introspection: true,
      subscriptions: {
        'graphql-ws': true,
      },
      context: ({ req }: { req: AuthenticatedRequest }) => {
        return { req, user: req.user, clerkPayload: req.clerkPayload };
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      username: process.env['DB_USERNAME'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'postgres',
      database: process.env['DB_NAME'] || 'soccer_stats',
      autoLoadEntities: true,
      synchronize: true, // Only for development
      logging: true,
    }),
    GamesModule,
    TeamsModule,
    PlayersModule,
    AuthModule,
    GameFormatsModule,
  ],
  controllers: [AppController],
  providers: [AppService, StartupService],
})
export class AppModule {}

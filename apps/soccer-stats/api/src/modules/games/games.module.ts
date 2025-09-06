import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';

import { Game } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { EventType } from '../../entities/event-type.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { AuthModule } from '../auth/auth.module';

import { GamesResolver } from './games.resolver';
import { GamesService } from './games.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Game,
      Team,
      User,
      GameTeam,
      TeamPlayer,
      EventType,
      GameEvent,
      GameFormat,
    ]),
    AuthModule,
  ],
  providers: [
    GamesResolver,
    GamesService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [GamesService],
})
export class GamesModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';

import { Player } from '../../entities/player.entity';
import { Team } from '../../entities/team.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { GameParticipation } from '../../entities/game-participation.entity';
import { TeamsModule } from '../teams/teams.module';

import { PlayersResolver } from './players.resolver';
import { PlayersService } from './players.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player, Team, TeamPlayer, GameParticipation]),
    forwardRef(() => TeamsModule),
  ],
  providers: [
    PlayersResolver,
    PlayersService,
    {
      provide: 'PUB_SUB',
      useFactory: () => new PubSub(),
    },
  ],
  exports: [PlayersService],
})
export class PlayersModule {}

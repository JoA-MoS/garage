import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';

import { Team } from '../../entities/team.entity';
import { Player } from '../../entities/player.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { PlayersModule } from '../players/players.module';

import { TeamsResolver } from './teams.resolver';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Player, TeamPlayer, GameTeam]),
    forwardRef(() => PlayersModule),
  ],
  providers: [
    TeamsResolver,
    TeamsService,
    {
      provide: 'PUB_SUB',
      useFactory: () => new PubSub(),
    },
  ],
  exports: [TeamsService],
})
export class TeamsModule {}

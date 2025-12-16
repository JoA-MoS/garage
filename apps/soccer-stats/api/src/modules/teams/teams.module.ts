import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';

import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { TeamCoach } from '../../entities/team-coach.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { PlayersModule } from '../players/players.module';
import { TeamMembersModule } from '../team-members/team-members.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

import { TeamsResolver } from './teams.resolver';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team,
      User,
      TeamPlayer,
      TeamCoach,
      TeamConfiguration,
      GameTeam,
    ]),
    forwardRef(() => PlayersModule),
    TeamMembersModule,
    forwardRef(() => UsersModule),
    AuthModule,
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

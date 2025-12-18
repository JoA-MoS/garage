import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';

import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { TeamCoach } from '../../entities/team-coach.entity';
import { TeamsModule } from '../teams/teams.module';

import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TeamPlayer, TeamCoach]),
    forwardRef(() => TeamsModule), // Import to access TeamsService
  ],
  providers: [
    UsersResolver,
    UsersService,
    {
      provide: 'PUB_SUB',
      useFactory: () => new PubSub(),
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}

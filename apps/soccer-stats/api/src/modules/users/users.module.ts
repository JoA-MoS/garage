import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { TeamCoach } from '../../entities/team-coach.entity';
import { TeamsModule } from '../teams/teams.module';
import { AuthModule } from '../auth/auth.module';

import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TeamPlayer, TeamCoach]),
    forwardRef(() => TeamsModule), // Import to access TeamsService
    forwardRef(() => AuthModule), // Import to access ClerkAuthGuard
  ],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}

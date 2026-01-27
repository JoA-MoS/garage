import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { TeamMembersModule } from '../team-members/team-members.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

import { TeamsResolver } from './teams.resolver';
import { TeamFieldsResolver } from './team-fields.resolver';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, User, TeamConfiguration, GameTeam]),
    forwardRef(() => TeamMembersModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],
  providers: [TeamsResolver, TeamFieldsResolver, TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}

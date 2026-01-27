import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../entities/user.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { TeamMemberRole } from '../../entities/team-member-role.entity';
import { TeamsModule } from '../teams/teams.module';
import { TeamMembersModule } from '../team-members/team-members.module';
import { AuthModule } from '../auth/auth.module';

import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UserFieldsResolver } from './user-fields.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TeamMember, TeamMemberRole]),
    forwardRef(() => TeamsModule),
    forwardRef(() => TeamMembersModule),
    forwardRef(() => AuthModule),
  ],
  providers: [UsersResolver, UserFieldsResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}

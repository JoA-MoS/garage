import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserTeamRole } from '../../entities';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserTeamRole])],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
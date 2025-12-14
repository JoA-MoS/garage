import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GameFormat } from '../../entities/game-format.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { AuthModule } from '../auth/auth.module';

import { GameFormatsService } from './game-formats.service';
import { GameFormatsResolver } from './game-formats.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameFormat, TeamConfiguration]),
    AuthModule,
  ],
  providers: [GameFormatsService, GameFormatsResolver],
  exports: [GameFormatsService],
})
export class GameFormatsModule {}

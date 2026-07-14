import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CalendarSource } from '../../entities/calendar-source.entity';
import { ExternalGameMapping } from '../../entities/external-game-mapping.entity';
import { Game } from '../../entities/game.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { Team } from '../../entities/team.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { AuthModule } from '../auth/auth.module';

import { CalendarSyncResolver } from './calendar-sync.resolver';
import { CalendarSyncSchedulerService } from './calendar-sync-scheduler.service';
import { CalendarSyncService } from './calendar-sync.service';
import { PlayMetricsIcsParserService } from './playmetrics-ics-parser.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CalendarSource,
      ExternalGameMapping,
      Game,
      GameTeam,
      GameFormat,
      Team,
      TeamConfiguration,
    ]),
    AuthModule,
  ],
  providers: [
    CalendarSyncResolver,
    CalendarSyncSchedulerService,
    CalendarSyncService,
    PlayMetricsIcsParserService,
  ],
  exports: [CalendarSyncService],
})
export class CalendarSyncModule {}

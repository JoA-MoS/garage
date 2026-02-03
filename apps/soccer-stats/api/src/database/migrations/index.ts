/**
 * Migration barrel file for webpack bundling.
 *
 * TypeORM's glob-based migration loading doesn't work well with webpack
 * since webpack bundles all code into a single file. By explicitly importing
 * and exporting migrations here, they get included in the webpack bundle
 * and can be passed directly to TypeORM config.
 *
 * IMPORTANT: Add new migrations to this file in chronological order.
 */

import { InitialSchema1768502441068 } from './1768502441068-InitialSchema';
import { MigrateTimingEvents1768674674895 } from './1768674674895-MigrateTimingEvents';
import { AddTacticalEventTypes1768720556985 } from './1768720556985-AddTacticalEventTypes';
import { SeedReferenceData1768848719848 } from './1768848719848-SeedReferenceData';
import { UpdateGameFormatDurations1768867746931 } from './1768867746931-UpdateGameFormatDurations';
import { AddGameDurationMinutes1768868248064 } from './1768868248064-AddGameDurationMinutes';
import { ConvertToTimestamptz1769110989864 } from './1769110989864-ConvertToTimestamptz';
import { AddPeriodConfigToGameFormat1769200000000 } from './1769200000000-AddPeriodConfigToGameFormat';
import { Add4v4GameFormat1769210000000 } from './1769210000000-Add4v4GameFormat';
import { Update4v4Description1769210100000 } from './1769210100000-Update4v4Description';
import { ConsolidateTeamMembership1769300000000 } from './1769300000000-ConsolidateTeamMembership';
import { AddGameSecondsAndPeriodColumns1769400000000 } from './1769400000000-AddGameSecondsAndPeriodColumns';
import { AddGameRosterEventType1769500000000 } from './1769500000000-AddGameRosterEventType';
import { ConvertBenchToGameRoster1769600000000 } from './1769600000000-ConvertBenchToGameRoster';
import { RemoveUnusedEventTypes1769700000000 } from './1769700000000-RemoveUnusedEventTypes';
import { RemoveGameStartEndEvents1769800000000 } from './1769800000000-RemoveGameStartEndEvents';
import { AddGameEventIndexes1769900000000 } from './1769900000000-AddGameEventIndexes';

/**
 * All migrations in chronological order.
 * TypeORM executes these based on the timestamp in the class name.
 */
export const migrations = [
  InitialSchema1768502441068,
  MigrateTimingEvents1768674674895,
  AddTacticalEventTypes1768720556985,
  SeedReferenceData1768848719848,
  UpdateGameFormatDurations1768867746931,
  AddGameDurationMinutes1768868248064,
  ConvertToTimestamptz1769110989864,
  AddPeriodConfigToGameFormat1769200000000,
  Add4v4GameFormat1769210000000,
  Update4v4Description1769210100000,
  ConsolidateTeamMembership1769300000000,
  AddGameSecondsAndPeriodColumns1769400000000,
  AddGameRosterEventType1769500000000,
  ConvertBenchToGameRoster1769600000000,
  RemoveUnusedEventTypes1769700000000,
  RemoveGameStartEndEvents1769800000000,
  AddGameEventIndexes1769900000000,
];

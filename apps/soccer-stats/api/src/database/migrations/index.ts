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
];

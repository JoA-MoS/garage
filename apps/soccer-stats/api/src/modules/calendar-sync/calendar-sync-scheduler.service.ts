import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

import { CalendarSyncService } from './calendar-sync.service';

const DEFAULT_SYNC_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class CalendarSyncSchedulerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(CalendarSyncSchedulerService.name);
  private timer?: NodeJS.Timeout;
  private syncInProgress = false;

  constructor(private readonly calendarSyncService: CalendarSyncService) {}

  onApplicationBootstrap(): void {
    const intervalMs = this.getIntervalMs();
    if (intervalMs <= 0) {
      this.logger.log('Team calendar sync scheduler disabled');
      return;
    }

    this.timer = setInterval(() => {
      void this.syncEnabledSources();
    }, intervalMs);
    this.timer.unref?.();
    this.logger.log(
      `Team calendar sync scheduler enabled every ${intervalMs}ms`,
    );
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async syncEnabledSources(): Promise<void> {
    if (this.syncInProgress) {
      this.logger.warn(
        'Skipping team calendar sync: previous sync still running',
      );
      return;
    }

    this.syncInProgress = true;

    try {
      const results = await this.calendarSyncService.syncEnabledSources();
      const created = results.reduce((sum, result) => sum + result.created, 0);
      const updated = results.reduce((sum, result) => sum + result.updated, 0);
      const errors = results.reduce(
        (sum, result) => sum + result.errors.length,
        0,
      );
      this.logger.log(
        `Team calendar sync complete: sources=${results.length} created=${created} updated=${updated} errors=${errors}`,
      );
    } catch (error) {
      this.logger.error(
        `Team calendar sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.syncInProgress = false;
    }
  }

  private getIntervalMs(): number {
    const raw = process.env['TEAM_CALENDAR_SYNC_INTERVAL_MS'];
    if (!raw) {
      return DEFAULT_SYNC_INTERVAL_MS;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : DEFAULT_SYNC_INTERVAL_MS;
  }
}

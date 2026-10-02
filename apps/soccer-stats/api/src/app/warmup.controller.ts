import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface WarmupResult {
  status: 'ok';
  durationMs: number;
}

/**
 * Wakes the database. Aurora Serverless v2 auto-pauses when idle and takes
 * ~15s to resume, so the UI calls this as early as possible on app open to
 * overlap the resume with sign-in and page load.
 *
 * Deliberately separate from `/health`: the ALB polls that every few
 * seconds, and if it touched the database Aurora could never pause.
 */
@Controller('warmup')
export class WarmupController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async warmup(): Promise<WarmupResult> {
    const start = Date.now();
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', durationMs: Date.now() - start };
  }
}

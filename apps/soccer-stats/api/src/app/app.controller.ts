import { Controller, Get } from '@nestjs/common';

import { AppService, HealthStatus, ProcessMetrics } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  /**
   * Health check endpoint for load balancers and monitoring.
   * Returns status based on memory usage thresholds.
   */
  @Get('health')
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }

  /**
   * Detailed metrics endpoint for debugging and analysis.
   * Returns full process statistics including memory and CPU usage.
   */
  @Get('metrics')
  getMetrics(): ProcessMetrics {
    return this.appService.getMetrics();
  }
}

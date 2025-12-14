import { Injectable, OnModuleInit } from '@nestjs/common';

import { GameFormatsService } from '../modules/game-formats/game-formats.service';
import { EventTypesService } from '../modules/event-types/event-types.service';

@Injectable()
export class StartupService implements OnModuleInit {
  constructor(
    private readonly gameFormatsService: GameFormatsService,
    private readonly eventTypesService: EventTypesService
  ) {}

  async onModuleInit() {
    console.log('🚀 Starting application initialization...');

    try {
      // Seed game formats if they don't exist
      await this.gameFormatsService.seedDefaultFormats();

      // Seed event types if they don't exist
      await this.eventTypesService.seedDefaultEventTypes();

      // Ensure new event types added after initial seed exist
      await this.eventTypesService.ensureNewEventTypesExist();

      console.log('✅ Application initialization completed successfully');
    } catch (error) {
      console.error('❌ Error during application initialization:', error);
      // Don't throw to prevent app from crashing on startup
    }
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';

import { GameFormatsService } from '../modules/game-formats/game-formats.service';

@Injectable()
export class StartupService implements OnModuleInit {
  constructor(private readonly gameFormatsService: GameFormatsService) {}

  async onModuleInit() {
    console.log('🚀 Starting application initialization...');

    try {
      // Seed game formats if they don't exist
      await this.gameFormatsService.seedDefaultFormats();
      console.log('✅ Application initialization completed successfully');
    } catch (error) {
      console.error('❌ Error during application initialization:', error);
      // Don't throw to prevent app from crashing on startup
    }
  }
}

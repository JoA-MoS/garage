import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('getVersion', () => {
    it('returns API build metadata from the service', () => {
      const appController = app.get<AppController>(AppController);
      const appService = app.get<AppService>(AppService);
      jest.spyOn(appService, 'getVersion').mockReturnValue({
        name: 'soccer-stats-api',
        version: '1.2.3',
        gitSha: 'abc1234',
        buildTime: '2026-07-15T02:22:42.000Z',
        environment: 'production',
      });

      expect(appController.getVersion()).toEqual({
        name: 'soccer-stats-api',
        version: '1.2.3',
        gitSha: 'abc1234',
        buildTime: '2026-07-15T02:22:42.000Z',
        environment: 'production',
      });
    });
  });
});

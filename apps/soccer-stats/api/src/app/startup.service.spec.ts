import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { GameFormatsService } from '../modules/game-formats/game-formats.service';
import { EventTypesService } from '../modules/event-types/event-types.service';

import { StartupService } from './startup.service';

describe('StartupService', () => {
  let service: StartupService;
  let dataSource: jest.Mocked<DataSource>;
  let gameFormatsService: jest.Mocked<GameFormatsService>;
  let eventTypesService: jest.Mocked<EventTypesService>;

  const mockDataSource = {
    query: jest.fn(),
  };

  const mockGameFormatsService = {
    seedDefaultFormats: jest.fn(),
  };

  const mockEventTypesService = {
    seedDefaultEventTypes: jest.fn(),
    ensureNewEventTypesExist: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartupService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: GameFormatsService, useValue: mockGameFormatsService },
        { provide: EventTypesService, useValue: mockEventTypesService },
      ],
    }).compile();

    service = module.get<StartupService>(StartupService);
    dataSource = module.get(DataSource);
    gameFormatsService = module.get(GameFormatsService);
    eventTypesService = module.get(EventTypesService);

    jest.clearAllMocks();

    // Default: all operations succeed
    dataSource.query.mockResolvedValue([]);
    gameFormatsService.seedDefaultFormats.mockResolvedValue(undefined);
    eventTypesService.seedDefaultEventTypes.mockResolvedValue(undefined);
    eventTypesService.ensureNewEventTypesExist.mockResolvedValue(undefined);
  });

  describe('error classification logic', () => {
    describe('schema errors should fail fast', () => {
      const schemaErrorMessages = [
        'column "foo" does not exist',
        'relation "game_events" does not exist',
        'column "bar" already exists',
        'ERROR: relation "event_types" does not exist',
        'column metadata does not exist in table',
      ];

      it.each(schemaErrorMessages)(
        'should throw error when message contains schema indicator: "%s"',
        async (errorMessage) => {
          eventTypesService.seedDefaultEventTypes.mockRejectedValue(
            new Error(errorMessage),
          );

          await expect(service.onModuleInit()).rejects.toThrow(errorMessage);
        },
      );

      it('should log CRITICAL message for schema errors', async () => {
        const loggerSpy = jest.spyOn(service['logger'], 'error');
        const schemaError = new Error('column "foo" does not exist');

        eventTypesService.seedDefaultEventTypes.mockRejectedValue(schemaError);

        await expect(service.onModuleInit()).rejects.toThrow();

        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('CRITICAL'),
          expect.any(String),
        );
      });
    });

    describe('transient errors should warn and continue', () => {
      const transientErrorMessages = [
        'Connection timeout',
        'ECONNREFUSED',
        'Network error',
        'Could not connect to database',
        'Request timeout',
      ];

      it.each(transientErrorMessages)(
        'should not throw for transient error: "%s"',
        async (errorMessage) => {
          eventTypesService.seedDefaultEventTypes.mockRejectedValue(
            new Error(errorMessage),
          );

          // Should NOT throw - just warn and continue
          await expect(service.onModuleInit()).resolves.not.toThrow();
        },
      );

      it('should log warning for transient errors', async () => {
        const loggerSpy = jest.spyOn(service['logger'], 'warn');
        const transientError = new Error('Connection timeout');

        eventTypesService.seedDefaultEventTypes.mockRejectedValue(
          transientError,
        );

        await service.onModuleInit();

        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to seed reference data'),
          expect.any(String),
        );
      });
    });

    describe('error message extraction', () => {
      it('should handle Error objects correctly', async () => {
        const error = new Error('column "test" does not exist');
        eventTypesService.seedDefaultEventTypes.mockRejectedValue(error);

        await expect(service.onModuleInit()).rejects.toThrow(
          'column "test" does not exist',
        );
      });

      it('should handle non-Error objects (string)', async () => {
        // String error that looks like a transient error
        eventTypesService.seedDefaultEventTypes.mockRejectedValue(
          'Connection failed',
        );

        // Should not throw for non-schema-like string errors
        await expect(service.onModuleInit()).resolves.not.toThrow();
      });

      it('should handle non-Error objects with schema-like message', async () => {
        // String error that indicates schema problem
        eventTypesService.seedDefaultEventTypes.mockRejectedValue(
          'column "foo" does not exist',
        );

        // Should throw because message indicates schema error
        await expect(service.onModuleInit()).rejects.toBe(
          'column "foo" does not exist',
        );
      });
    });
  });

  describe('successful initialization', () => {
    it('should complete without throwing when all operations succeed', async () => {
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });

    it('should call all initialization methods in order', async () => {
      await service.onModuleInit();

      expect(gameFormatsService.seedDefaultFormats).toHaveBeenCalled();
      expect(eventTypesService.seedDefaultEventTypes).toHaveBeenCalled();
      expect(eventTypesService.ensureNewEventTypesExist).toHaveBeenCalled();
    });

    it('should log success message on completion', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.onModuleInit();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Application initialization completed successfully',
      );
    });
  });

  describe('baseline migration registration', () => {
    it('should throw on migration table creation failure', async () => {
      dataSource.query.mockRejectedValue(new Error('Permission denied'));

      await expect(service.onModuleInit()).rejects.toThrow('Permission denied');
    });

    it('should throw on migration insert failure', async () => {
      // First call (CREATE TABLE) succeeds
      dataSource.query.mockResolvedValueOnce([]);
      // Second call (SELECT) returns empty (migration not registered)
      dataSource.query.mockResolvedValueOnce([]);
      // Third call (INSERT) fails
      dataSource.query.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Insert failed');
    });
  });
});

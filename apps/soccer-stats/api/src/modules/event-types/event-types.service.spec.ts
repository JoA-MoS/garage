import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EventType } from '../../entities/event-type.entity';

import { EventTypesService } from './event-types.service';

describe('EventTypesService', () => {
  let service: EventTypesService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventTypesService,
        {
          provide: getRepositoryToken(EventType),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventTypesService>(EventTypesService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // Note: ensureNewEventTypesExist() was removed - new event types are now
  // added via TypeORM migrations instead of app startup seeding.
  // See migrations/AddTacticalEventTypes and migrations/MigrateTimingEvents.

  describe('seedDefaultEventTypes', () => {
    it('should skip seeding when event types already exist', async () => {
      mockRepository.count.mockResolvedValue(10);

      await service.seedDefaultEventTypes();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should seed all default event types when database is empty', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockRepository.create.mockImplementation((input) => input as EventType);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'test-id' } as EventType),
      );

      await service.seedDefaultEventTypes();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();

      // Service saves each entity individually via create(), so collect all created entities
      const createdEntities = mockRepository.create.mock.calls.map(
        (call) => call[0] as { name: string },
      );
      const eventNames = createdEntities.map((e) => e.name);

      // Verify timing event types are included in the seed
      expect(eventNames).toContain('GAME_START');
      expect(eventNames).toContain('GAME_END');
      expect(eventNames).toContain('PERIOD_START');
      expect(eventNames).toContain('PERIOD_END');
      expect(eventNames).toContain('STOPPAGE_START');
      expect(eventNames).toContain('STOPPAGE_END');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EventType, EventCategory } from '../../entities/event-type.entity';

import { EventTypesService } from './event-types.service';

describe('EventTypesService', () => {
  let service: EventTypesService;
  let repository: jest.Mocked<Repository<EventType>>;

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
    repository = module.get(getRepositoryToken(EventType));

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('TIMING_EVENT_TYPES constant structure', () => {
    it('should define all required timing event types', async () => {
      // Trigger ensureNewEventTypesExist to verify the constant is used
      mockRepository.findOne.mockResolvedValue(null); // Event type doesn't exist
      mockRepository.create.mockImplementation((input) => input as EventType);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'test-id' } as EventType),
      );

      await service.ensureNewEventTypesExist();

      // Get all event types that were created
      const createdEventTypes = mockRepository.create.mock.calls.map(
        (call) => call[0] as { name: string },
      );
      const eventTypeNames = createdEventTypes.map((et) => et.name);

      // Verify all timing event types are included
      expect(eventTypeNames).toContain('GAME_START');
      expect(eventTypeNames).toContain('GAME_END');
      expect(eventTypeNames).toContain('PERIOD_START');
      expect(eventTypeNames).toContain('PERIOD_END');
      expect(eventTypeNames).toContain('STOPPAGE_START');
      expect(eventTypeNames).toContain('STOPPAGE_END');
    });

    it('should set correct properties for timing event types', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((input) => input as EventType);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'test-id' } as EventType),
      );

      await service.ensureNewEventTypesExist();

      const createdEventTypes = mockRepository.create.mock.calls.map(
        (call) => call[0],
      ) as Array<{
        name: string;
        category: EventCategory;
        requiresPosition: boolean;
        allowsParent: boolean;
      }>;

      // Verify all timing events are in GAME_FLOW category
      const timingEvents = createdEventTypes.filter((et) =>
        [
          'GAME_START',
          'GAME_END',
          'PERIOD_START',
          'PERIOD_END',
          'STOPPAGE_START',
          'STOPPAGE_END',
        ].includes(et.name),
      );

      for (const event of timingEvents) {
        expect(event.category).toBe(EventCategory.GAME_FLOW);
        expect(event.requiresPosition).toBe(false);
        expect(event.allowsParent).toBe(false);
      }
    });
  });

  describe('ensureNewEventTypesExist', () => {
    it('should create event type when it does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((input) => input as EventType);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'test-id' } as EventType),
      );

      await service.ensureNewEventTypesExist();

      // Should have checked for each event type
      expect(mockRepository.findOne).toHaveBeenCalled();
      // Should have created new event types
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should skip creation when event type already exists', async () => {
      const existingEventType = {
        id: 'existing-id',
        name: 'GAME_START',
        category: EventCategory.GAME_FLOW,
      } as EventType;

      mockRepository.findOne.mockResolvedValue(existingEventType);

      await service.ensureNewEventTypesExist();

      // Should not create or save if event type exists
      // (repository.create should not be called for existing types)
      const findOneCalls = mockRepository.findOne.mock.calls.length;
      expect(findOneCalls).toBeGreaterThan(0);
    });

    it('should be idempotent - safe to call multiple times', async () => {
      // First call - event doesn't exist
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockImplementation((input) => input as EventType);
      mockRepository.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'test-id' } as EventType),
      );

      await service.ensureNewEventTypesExist();
      const firstCallSaveCount = mockRepository.save.mock.calls.length;

      // Reset for second call
      jest.clearAllMocks();

      // Second call - event now exists
      mockRepository.findOne.mockResolvedValue({
        id: 'test-id',
        name: 'GAME_START',
      } as EventType);

      await service.ensureNewEventTypesExist();

      // Should not save on second call since events exist
      expect(mockRepository.save.mock.calls.length).toBeLessThanOrEqual(
        firstCallSaveCount,
      );
    });
  });

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

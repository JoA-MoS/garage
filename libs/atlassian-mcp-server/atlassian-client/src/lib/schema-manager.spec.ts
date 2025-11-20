import { SchemaManager } from './schema-manager';
import { AtlassianClient } from './atlassian-client';

// Mock AtlassianClient
jest.mock('./atlassian-client');

describe('SchemaManager', () => {
  let schemaManager: SchemaManager;
  let mockAtlassianClient: jest.Mocked<AtlassianClient>;

  beforeEach(() => {
    mockAtlassianClient = new AtlassianClient({
      atlassianUrl: 'https://api.atlassian.com',
      atlassianApiToken: 'test-token',
    }) as jest.Mocked<AtlassianClient>;

    schemaManager = new SchemaManager(mockAtlassianClient);
  });

  describe('getSchema', () => {
    it('should return null when schema is not initialized', () => {
      expect(schemaManager.getSchema()).toBeNull();
    });
  });

  describe('hasSchema', () => {
    it('should return false when schema is not initialized', () => {
      expect(schemaManager.hasSchema()).toBe(false);
    });
  });

  describe('getOperationsSummary', () => {
    it('should return empty arrays when schema is not loaded', () => {
      const summary = schemaManager.getOperationsSummary();
      expect(summary.queries).toEqual([]);
      expect(summary.mutations).toEqual([]);
      expect(summary.hasSchema).toBe(false);
    });
  });
});

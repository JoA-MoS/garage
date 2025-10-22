import { promises as fs } from 'fs';

import { SchemaManager } from './schema-manager';

// Mock fs and fetch
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as never;

describe('SchemaManager', () => {
  let schemaManager: SchemaManager;
  const mockSchema = `type Query {
  currentUser: User
  project(fullPath: ID!): Project
}

type Mutation {
  createIssue(input: CreateIssueInput!): CreateIssuePayload
  updateMergeRequest(input: UpdateMergeRequestInput!): UpdateMergeRequestPayload
}

type User {
  id: ID!
  name: String
}`;

  beforeEach(() => {
    jest.clearAllMocks();
    schemaManager = new SchemaManager('https://gitlab.com');
  });

  describe('initialization', () => {
    it('should load schema from cache if available', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(mockSchema);

      await schemaManager.initialize();

      expect(schemaManager.hasSchema()).toBe(true);
      expect(schemaManager.getSchema()).toBe(mockSchema);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should download schema if cache is not available', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockSchema,
      });

      await schemaManager.initialize();

      expect(schemaManager.hasSchema()).toBe(true);
      expect(schemaManager.getSchema()).toBe(mockSchema);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/graphql/reference/gitlab_schema.graphql'
      );
    });

    it('should cache downloaded schema', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => mockSchema,
      });

      await schemaManager.initialize();

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('gitlab-schema.graphql'),
        mockSchema,
        'utf-8'
      );
    });

    it('should handle download failure gracefully', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await schemaManager.initialize();

      expect(schemaManager.hasSchema()).toBe(false);
      expect(schemaManager.getSchema()).toBeNull();
    });

    it('should handle custom cache directory', () => {
      const customCacheDir = '/custom/cache/dir';
      const manager = new SchemaManager('https://gitlab.com', customCacheDir);

      expect(manager).toBeDefined();
    });
  });

  describe('schema parsing', () => {
    beforeEach(async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(mockSchema);
      await schemaManager.initialize();
    });

    it('should extract available queries', () => {
      const queries = schemaManager.getAvailableQueries();

      expect(queries).toContain('currentUser');
      expect(queries).toContain('project');
      expect(queries).toHaveLength(2);
    });

    it('should extract available mutations', () => {
      const mutations = schemaManager.getAvailableMutations();

      expect(mutations).toContain('createIssue');
      expect(mutations).toContain('updateMergeRequest');
      expect(mutations).toHaveLength(2);
    });

    it('should provide operations summary', () => {
      const summary = schemaManager.getOperationsSummary();

      expect(summary.hasSchema).toBe(true);
      expect(summary.queries).toContain('currentUser');
      expect(summary.mutations).toContain('createIssue');
    });

    it('should return empty arrays when schema is not available', () => {
      const emptyManager = new SchemaManager('https://gitlab.com');

      expect(emptyManager.getAvailableQueries()).toEqual([]);
      expect(emptyManager.getAvailableMutations()).toEqual([]);
      expect(emptyManager.getOperationsSummary().hasSchema).toBe(false);
    });
  });

  describe('URL handling', () => {
    it('should strip trailing slash from GitLab URL', async () => {
      const manager = new SchemaManager('https://gitlab.com/');
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSchema,
      });

      await manager.initialize();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.com/api/graphql'
      );
    });
  });
});

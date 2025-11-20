import { promises as fs } from 'fs';

import { GitLabClient } from './gitlab-client';
import { SchemaManager } from './schema-manager';

// Mock fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
}));

// Mock GitLabClient
jest.mock('./gitlab-client');

describe('SchemaManager', () => {
  let schemaManager: SchemaManager;
  let mockGitLabClient: jest.Mocked<GitLabClient>;
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

    // Create a mock GitLabClient instance
    mockGitLabClient = {
      executeQuery: jest.fn(),
      executeMutation: jest.fn(),
    } as never;

    schemaManager = new SchemaManager(mockGitLabClient);
  });

  describe('initialization', () => {
    it('should load schema from cache if available', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(mockSchema);

      await schemaManager.initialize();

      expect(schemaManager.hasSchema()).toBe(true);
      expect(schemaManager.getSchema()).toBe(mockSchema);
      expect(mockGitLabClient.executeQuery).not.toHaveBeenCalled();
    });

    it('should download schema if cache is not available', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      mockGitLabClient.executeQuery.mockResolvedValue({
        data: {
          __schema: {
            queryType: { name: 'Query' },
            mutationType: { name: 'Mutation' },
            types: [
              {
                kind: 'OBJECT',
                name: 'Query',
                fields: [
                  {
                    name: 'currentUser',
                    type: { kind: 'OBJECT', name: 'User' },
                    args: [],
                  },
                  {
                    name: 'project',
                    type: { kind: 'OBJECT', name: 'Project' },
                    args: [
                      {
                        name: 'fullPath',
                        type: {
                          kind: 'NON_NULL',
                          ofType: { kind: 'SCALAR', name: 'ID' },
                        },
                      },
                    ],
                  },
                ],
              },
              {
                kind: 'OBJECT',
                name: 'Mutation',
                fields: [
                  {
                    name: 'createIssue',
                    type: { kind: 'OBJECT', name: 'CreateIssuePayload' },
                    args: [
                      {
                        name: 'input',
                        type: {
                          kind: 'NON_NULL',
                          ofType: {
                            kind: 'INPUT_OBJECT',
                            name: 'CreateIssueInput',
                          },
                        },
                      },
                    ],
                  },
                  {
                    name: 'updateMergeRequest',
                    type: { kind: 'OBJECT', name: 'UpdateMergeRequestPayload' },
                    args: [
                      {
                        name: 'input',
                        type: {
                          kind: 'NON_NULL',
                          ofType: {
                            kind: 'INPUT_OBJECT',
                            name: 'UpdateMergeRequestInput',
                          },
                        },
                      },
                    ],
                  },
                ],
              },
              {
                kind: 'OBJECT',
                name: 'User',
                fields: [
                  {
                    name: 'id',
                    type: {
                      kind: 'NON_NULL',
                      ofType: { kind: 'SCALAR', name: 'ID' },
                    },
                    args: [],
                  },
                  {
                    name: 'name',
                    type: { kind: 'SCALAR', name: 'String' },
                    args: [],
                  },
                ],
              },
            ],
          },
        },
      });

      await schemaManager.initialize();

      expect(schemaManager.hasSchema()).toBe(true);
      expect(mockGitLabClient.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('IntrospectionQuery')
      );
    });

    it('should cache downloaded schema', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      mockGitLabClient.executeQuery.mockResolvedValue({
        data: {
          __schema: {
            queryType: { name: 'Query' },
            types: [
              {
                kind: 'OBJECT',
                name: 'Query',
                fields: [
                  {
                    name: 'currentUser',
                    type: { kind: 'OBJECT', name: 'User' },
                    args: [],
                  },
                ],
              },
            ],
          },
        },
      });

      await schemaManager.initialize();

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('gitlab-schema.graphql'),
        expect.stringContaining('type Query'),
        'utf-8'
      );
    });

    it('should handle download failure gracefully', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      mockGitLabClient.executeQuery.mockResolvedValue({
        data: null,
        errors: [{ message: 'GraphQL error' }],
      });

      await schemaManager.initialize();

      expect(schemaManager.hasSchema()).toBe(false);
      expect(schemaManager.getSchema()).toBeNull();
    });

    it('should handle custom cache directory', () => {
      const customCacheDir = '/custom/cache/dir';
      const manager = new SchemaManager(mockGitLabClient, customCacheDir);

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
      const emptyClient = {
        executeQuery: jest.fn(),
        executeMutation: jest.fn(),
      } as never;
      const emptyManager = new SchemaManager(emptyClient);

      expect(emptyManager.getAvailableQueries()).toEqual([]);
      expect(emptyManager.getAvailableMutations()).toEqual([]);
      expect(emptyManager.getOperationsSummary().hasSchema).toBe(false);
    });
  });

  describe('URL handling', () => {
    it('should work with GitLabClient regardless of URL format', async () => {
      // The URL handling is now done by GitLabClient, not SchemaManager
      const manager = new SchemaManager(mockGitLabClient);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      mockGitLabClient.executeQuery.mockResolvedValue({
        data: {
          __schema: {
            queryType: { name: 'Query' },
            types: [],
          },
        },
      });

      await manager.initialize();

      expect(mockGitLabClient.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('IntrospectionQuery')
      );
    });
  });
});

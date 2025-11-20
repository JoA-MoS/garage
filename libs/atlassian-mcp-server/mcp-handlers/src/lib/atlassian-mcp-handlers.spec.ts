import { registerMcpHandlers } from './atlassian-mcp-handlers';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { AtlassianClient, SchemaManager } from '@garage/atlassian-client';

// Mock dependencies
jest.mock('@garage/atlassian-client');

describe('registerMcpHandlers', () => {
  let mockServer: jest.Mocked<Server>;
  let mockAtlassianClient: jest.Mocked<AtlassianClient>;
  let mockSchemaManager: jest.Mocked<SchemaManager>;

  beforeEach(() => {
    mockServer = {
      setRequestHandler: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    mockAtlassianClient = new AtlassianClient({
      atlassianUrl: 'https://api.atlassian.com',
      atlassianApiToken: 'test-token',
    }) as jest.Mocked<AtlassianClient>;

    mockSchemaManager = new SchemaManager(
      mockAtlassianClient
    ) as jest.Mocked<SchemaManager>;
  });

  it('should register MCP request handlers', () => {
    registerMcpHandlers(mockServer, mockAtlassianClient, mockSchemaManager);

    // Verify that setRequestHandler was called for each handler
    expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(4);
  });

  it('should register ListResourcesRequestSchema handler', () => {
    registerMcpHandlers(mockServer, mockAtlassianClient, mockSchemaManager);

    const calls = (mockServer.setRequestHandler as jest.Mock).mock.calls;
    const hasListResourcesHandler = calls.some(
      (call) => call[0].method === 'resources/list'
    );
    expect(hasListResourcesHandler).toBe(true);
  });

  it('should register ReadResourceRequestSchema handler', () => {
    registerMcpHandlers(mockServer, mockAtlassianClient, mockSchemaManager);

    const calls = (mockServer.setRequestHandler as jest.Mock).mock.calls;
    const hasReadResourceHandler = calls.some(
      (call) => call[0].method === 'resources/read'
    );
    expect(hasReadResourceHandler).toBe(true);
  });

  it('should register ListToolsRequestSchema handler', () => {
    registerMcpHandlers(mockServer, mockAtlassianClient, mockSchemaManager);

    const calls = (mockServer.setRequestHandler as jest.Mock).mock.calls;
    const hasListToolsHandler = calls.some(
      (call) => call[0].method === 'tools/list'
    );
    expect(hasListToolsHandler).toBe(true);
  });

  it('should register CallToolRequestSchema handler', () => {
    registerMcpHandlers(mockServer, mockAtlassianClient, mockSchemaManager);

    const calls = (mockServer.setRequestHandler as jest.Mock).mock.calls;
    const hasCallToolHandler = calls.some(
      (call) => call[0].method === 'tools/call'
    );
    expect(hasCallToolHandler).toBe(true);
  });
});

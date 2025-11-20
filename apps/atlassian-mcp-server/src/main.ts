#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AtlassianClient, SchemaManager } from '@garage/atlassian-client';
import { registerMcpHandlers } from '@garage/atlassian-mcp-handlers';

async function main() {
  // Get configuration from environment variables
  const atlassianUrl = process.env.ATLASSIAN_URL || 'https://api.atlassian.com';
  const atlassianApiToken = process.env.ATLASSIAN_API_TOKEN;

  if (!atlassianApiToken) {
    console.error('Error: ATLASSIAN_API_TOKEN environment variable is required');
    process.exit(1);
  }

  // Create Atlassian client
  const atlassianClient = new AtlassianClient({
    atlassianUrl,
    atlassianApiToken,
  });

  // Initialize schema manager
  console.error('Initializing Atlassian schema...');
  const schemaManager = new SchemaManager(atlassianClient);
  await schemaManager.initialize();

  // Create MCP server
  const server = new Server(
    {
      name: 'atlassian-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Register MCP handlers with both client and schema manager
  registerMcpHandlers(server, atlassianClient, schemaManager);

  // Set up error handlers
  server.onerror = (error) => {
    console.error('[MCP Error]', error);
  };

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  // Connect using stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Atlassian MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

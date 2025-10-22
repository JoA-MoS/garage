import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { GitLabClient, SchemaManager } from '@garage/gitlab-client';
import { registerMcpHandlers } from '@garage/mcp-handlers';

async function main() {
  // Get configuration from environment variables
  const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
  const gitlabToken = process.env.GITLAB_TOKEN;

  if (!gitlabToken) {
    console.error('Error: GITLAB_TOKEN environment variable is required');
    process.exit(1);
  }

  // Initialize schema manager first
  console.error('Initializing GitLab schema...');
  const schemaManager = new SchemaManager(gitlabUrl, gitlabToken);
  await schemaManager.initialize();

  // Create GitLab client
  const gitlabClient = new GitLabClient({
    gitlabUrl,
    gitlabToken,
  });

  // Create MCP server
  const server = new Server(
    {
      name: 'gitlab-mcp-server',
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
  registerMcpHandlers(server, gitlabClient, schemaManager);

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

  console.error('GitLab MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

# GitLab MCP Server - Usage Example

## Quick Start

### 1. Set up environment variables

```bash
export GITLAB_TOKEN=your_personal_access_token_here
export GITLAB_URL=https://gitlab.com  # Optional, defaults to gitlab.com
```

### 2. Build the server

```bash
pnpm nx build gitlab-mcp-server
```

### 3. Run the server

The server communicates via stdio (standard input/output), which is the standard for MCP servers.

```bash
# Using the built version
node dist/apps/gitlab-mcp-server/main.js

# Or using nx serve (for development)
pnpm nx serve gitlab-mcp-server
```

## Example Tool Calls

Once the server is running, it can receive MCP protocol messages via stdin. Here are example tool calls:

### List Projects

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_projects",
    "arguments": {
      "first": 10
    }
  }
}
```

### Get Specific Project

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_project",
    "arguments": {
      "fullPath": "gitlab-org/gitlab"
    }
  }
}
```

### List Issues

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "list_issues",
    "arguments": {
      "projectPath": "gitlab-org/gitlab",
      "first": 20
    }
  }
}
```

### List Merge Requests

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "list_merge_requests",
    "arguments": {
      "projectPath": "gitlab-org/gitlab",
      "first": 20
    }
  }
}
```

### List Pipelines

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "list_pipelines",
    "arguments": {
      "projectPath": "gitlab-org/gitlab",
      "first": 20
    }
  }
}
```

## Integration with MCP Clients

This server is designed to be used with MCP-compatible clients such as:

- Claude Desktop
- Other AI assistants that support the Model Context Protocol
- Custom MCP client applications

To configure with Claude Desktop, add the following to your Claude configuration:

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": ["/path/to/garage/dist/apps/gitlab-mcp-server/main.js"],
      "env": {
        "GITLAB_TOKEN": "your_token_here",
        "GITLAB_URL": "https://gitlab.com"
      }
    }
  }
}
```

## Testing the Server Locally

You can test the server locally using a simple Node.js script:

```javascript
const { spawn } = require('child_process');

const server = spawn('node', ['dist/apps/gitlab-mcp-server/main.js'], {
  env: {
    ...process.env,
    GITLAB_TOKEN: 'your_token',
    GITLAB_URL: 'https://gitlab.com'
  }
});

server.stdout.on('data', (data) => {
  console.log('Server output:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('Server stderr:', data.toString());
});

// Send a tool call
const toolCall = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'list_projects',
    arguments: { first: 5 }
  }
};

server.stdin.write(JSON.stringify(toolCall) + '\n');
```

## Troubleshooting

### Authentication Errors
- Verify your GitLab token is valid
- Ensure the token has `api` or `read_api` scope
- Check that GITLAB_URL is correct for your instance

### Connection Errors
- Verify you can reach your GitLab instance
- Check network connectivity
- Ensure firewall rules allow HTTPS connections

### Server Not Starting
- Check that all dependencies are installed: `pnpm install`
- Verify the build was successful: `pnpm nx build gitlab-mcp-server`
- Check Node.js version (should be v20 or higher)

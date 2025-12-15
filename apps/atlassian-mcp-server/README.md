# Atlassian MCP Server

A Model Context Protocol (MCP) server that provides schema-driven integration with Atlassian's GraphQL API using Apollo Client.

## Overview

This MCP server enables AI assistants and other MCP clients to interact with Atlassian products (Jira, Confluence, etc.) through a flexible, schema-driven approach. Instead of multiple static tools, it provides direct access to the Atlassian GraphQL API, allowing the LLM to construct queries dynamically based on the schema.

## Key Features

- **Schema Caching**: Automatically downloads and caches Atlassian GraphQL schema at startup
- **Dynamic Query Construction**: AI can construct exact queries for needed data based on the schema
- **Flexible Data Retrieval**: Fetch related data in single requests via nested GraphQL queries
- **Mutation Support**: Create, update, and delete Atlassian resources using GraphQL mutations
- **Apollo Client Integration**: Leverages Apollo Client for robust GraphQL operations
- **Resource-Based Schema Access**: Schema exposed as a resource for AI to reference when needed

## Installation

### Global Installation (Recommended)

Install globally using npm or pnpm:

```bash
npm install -g atlassian-mcp-server
# or
pnpm add -g atlassian-mcp-server
```

### Using npx (No Installation Required)

Run directly without installation:

```bash
npx atlassian-mcp-server
```

## Prerequisites

- Node.js v20 or higher
- Atlassian account with API access
- Atlassian API token

## Setup

### 1. Create an Atlassian API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "MCP Server")
4. Copy the token for use in configuration

### 2. Configure Environment Variables

Create a `.env` file or set environment variables:

```bash
ATLASSIAN_API_TOKEN=your_atlassian_api_token
ATLASSIAN_URL=https://api.atlassian.com  # Optional, defaults to api.atlassian.com
```

### 3. Run the Server

#### Using npx (No Installation)

```bash
ATLASSIAN_API_TOKEN=your_token npx atlassian-mcp-server
```

#### Using Global Installation

```bash
ATLASSIAN_API_TOKEN=your_token atlassian-mcp-server
```

#### Development (From Workspace)

```bash
# From the workspace root
pnpm nx build atlassian-mcp-server

# Run the built version
ATLASSIAN_API_TOKEN=your_token node dist/apps/atlassian-mcp-server/main.js
```

## Publishing to npm

To publish this package to npm:

### 1. Build the Package

```bash
# From workspace root
pnpm nx build atlassian-mcp-server
```

### 2. Navigate to Build Output

```bash
cd dist/apps/atlassian-mcp-server
```

### 3. Publish

```bash
# For first-time publish
npm publish --access public

# For scoped packages (@your-org/atlassian-mcp-server)
npm publish
```

### 4. Update Version

Before publishing updates:

```bash
# In apps/atlassian-mcp-server/package.json, update version
# Then rebuild and publish
```

## Schema Management

The server automatically downloads and caches the Atlassian GraphQL schema at startup:

1. **First Run**: Downloads schema from Atlassian's GraphQL endpoint using introspection
2. **Subsequent Runs**: Loads schema from cache (`.atlassian-cache/atlassian-schema.graphql`)
3. **Schema Updates**: Delete the cache directory to force a re-download with updated schema

The schema is exposed as a resource (`atlassian://schema`) that AI assistants can access when needed.

## Available Resources

### atlassian://schema

The complete Atlassian GraphQL schema in SDL format. Available as a resource for AI to reference.

**Access:** Read the resource `atlassian://schema` to get the full schema definition.

## Available Tools

### graphql_query

Execute a GraphQL query against the Atlassian API. Construct queries based on the schema to fetch exactly the data you need.

**Parameters:**

- `query` (required): The GraphQL query string
- `variables` (optional): Variables for parameterized queries

**Example - Get Jira Projects:**

```json
{
  "name": "graphql_query",
  "arguments": {
    "query": "query { jira { projects { edges { node { id name key } } } } }"
  }
}
```

**Example - Get Specific Issue:**

```json
{
  "name": "graphql_query",
  "arguments": {
    "query": "query($issueId: ID!) { jira { issue(id: $issueId) { id key summary status { name } assignee { displayName } } } }",
    "variables": {
      "issueId": "10001"
    }
  }
}
```

### graphql_mutate

Execute a GraphQL mutation to modify data in Atlassian (create issues, update projects, etc.).

**Parameters:**

- `mutation` (required): The GraphQL mutation string
- `variables` (optional): Variables for the mutation input

**Example - Create an Issue:**

```json
{
  "name": "graphql_mutate",
  "arguments": {
    "mutation": "mutation($input: CreateJiraIssueInput!) { jira { createIssue(input: $input) { issue { id key } errors { message } } } }",
    "variables": {
      "input": {
        "projectId": "10000",
        "summary": "New issue from MCP",
        "description": "Created via GraphQL MCP server"
      }
    }
  }
}
```

## Architecture

The application is structured using NX workspace best practices with the following libraries:

- **@garage/atlassian-types**: Shared TypeScript types for Atlassian API and MCP server configuration
- **@garage/atlassian-client**: Apollo Client-based Atlassian GraphQL client with schema introspection
- **@garage/atlassian-mcp-handlers**: MCP protocol handlers for schema-driven tool operations

## Schema-Driven Approach

This implementation follows a schema-driven architecture as described in [The Future of MCP is GraphQL](https://www.apollographql.com/blog/the-future-of-mcp-is-graphql):

1. **Schema Loading**: The server downloads and caches the Atlassian schema at startup
2. **Dynamic Query Construction**: Instead of dozens of static tools, the AI constructs exact queries based on needs
3. **Flexible Data Retrieval**: Fetch related data in single requests, reducing tool invocation round-trips
4. **Simplified Server**: The MCP server becomes a thin wrapper around the GraphQL endpoint

This approach provides:

- Fewer tools to maintain (2 tools instead of many static tools)
- Self-documenting API surface through the schema (exposed as a resource)
- No over/under-fetching of data
- GraphQL layer handles validation, execution, and error handling

## Development

### Running Tests

```bash
# Test all libraries
pnpm nx test atlassian-types
pnpm nx test atlassian-client
pnpm nx test atlassian-mcp-handlers

# Test the application
pnpm nx test atlassian-mcp-server
```

### Linting

```bash
pnpm nx lint atlassian-mcp-server
```

### Building

```bash
pnpm nx build atlassian-mcp-server
```

## Troubleshooting

### Authentication Errors

If you receive authentication errors:

- Verify your Atlassian API token is valid and has not expired
- Ensure you're using the correct Atlassian URL for your instance
- Check that you have proper permissions to access the resources

### GraphQL Errors

If you receive GraphQL errors:

- Verify the query syntax is correct
- Check that you have access to the requested resources
- Ensure the Atlassian instance supports the GraphQL fields being queried
- Review the schema resource to understand available fields and types

## References

- [Model Context Protocol Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Atlassian GraphQL API Documentation](https://developer.atlassian.com/platform/atlassian-graphql-api/graphql/)
- [Atlassian GraphQL Explorer](https://team.atlassian.com/gateway/api/graphql)
- [NX Documentation](https://nx.dev)

## License

MIT

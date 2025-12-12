# GitLab MCP Server

A Model Context Protocol (MCP) server that provides schema-driven integration with GitLab's GraphQL API using Apollo Client.

## Overview

This MCP server enables AI assistants and other MCP clients to interact with GitLab through a flexible, schema-driven approach. Instead of multiple static tools, it provides direct access to the GitLab GraphQL API, allowing the LLM to construct queries dynamically based on the schema.

## Key Features

- **Schema Caching**: Automatically downloads and caches GitLab GraphQL schema at startup
- **Dynamic Query Construction**: AI can construct exact queries for needed data based on the schema
- **Flexible Data Retrieval**: Fetch related data in single requests via nested GraphQL queries
- **Mutation Support**: Create, update, and delete GitLab resources using GraphQL mutations
- **Apollo Client Integration**: Leverages Apollo Client for robust GraphQL operations
- **Resource-Based Schema Access**: Schema exposed as a resource for AI to reference when needed

## Installation

### Global Installation (Recommended)

Install globally using npm or pnpm:

```bash
npm install -g gitlab-mcp-server
# or
pnpm add -g gitlab-mcp-server
```

### Using npx (No Installation Required)

Run directly without installation:

```bash
npx gitlab-mcp-server
```

## Prerequisites

- Node.js v20 or higher
- GitLab account with API access
- GitLab personal access token with appropriate scopes

## Setup

### 1. Create a GitLab Personal Access Token

1. Go to GitLab (https://gitlab.com or your GitLab instance)
2. Navigate to User Settings > Access Tokens
3. Create a new token with the following scopes:
   - `api` - Full API access
   - `read_api` - Read-only API access (minimum required)
4. Copy the token for use in configuration

### 2. Configure Environment Variables

Create a `.env` file or set environment variables:

```bash
GITLAB_TOKEN=your_gitlab_personal_access_token
GITLAB_URL=https://gitlab.com  # Optional, defaults to gitlab.com
```

### 3. Run the Server

#### Using npx (No Installation)

```bash
GITLAB_TOKEN=your_token npx gitlab-mcp-server
```

#### Using Global Installation

```bash
GITLAB_TOKEN=your_token gitlab-mcp-server
```

#### Development (From Workspace)

```bash
# From the workspace root
pnpm nx build gitlab-mcp-server

# Run the built version
GITLAB_TOKEN=your_token node dist/apps/gitlab-mcp-server/main.js
```

## Publishing to npm

To publish this package to npm:

### 1. Build the Package

```bash
# From workspace root
pnpm nx build gitlab-mcp-server
```

### 2. Navigate to Build Output

```bash
cd dist/apps/gitlab-mcp-server
```

### 3. Publish

```bash
# For first-time publish
npm publish --access public

# For scoped packages (@your-org/gitlab-mcp-server)
npm publish
```

### 4. Update Version

Before publishing updates:

```bash
# In apps/gitlab-mcp-server/package.json, update version
# Then rebuild and publish
```

## Schema Management

The server automatically downloads and caches the GitLab GraphQL schema at startup:

1. **First Run**: Downloads schema from GitLab's published schema endpoint (`/api/graphql/reference/gitlab_schema.graphql`)
2. **Subsequent Runs**: Loads schema from cache (`.gitlab-cache/gitlab-schema.graphql`)
3. **Schema Updates**: Delete the cache directory to force a re-download with updated schema

The schema is exposed as a resource (`gitlab://schema`) that AI assistants can access when needed, eliminating the need for schema introspection queries that can exceed GitLab's complexity limits.

## Available Resources

### gitlab://schema

The complete GitLab GraphQL schema in SDL format. Available as a resource for AI to reference.

**Access:** Read the resource `gitlab://schema` to get the full schema definition.

## Available Tools

### graphql_query

Execute a GraphQL query against the GitLab API. Construct queries based on the schema to fetch exactly the data you need.

**Parameters:**

- `query` (required): The GraphQL query string
- `variables` (optional): Variables for parameterized queries

**Example - Get Current User:**

```json
{
  "name": "graphql_query",
  "arguments": {
    "query": "query { currentUser { id name username email } }"
  }
}
```

**Example - Get Project with Issues:**

```json
{
  "name": "graphql_query",
  "arguments": {
    "query": "query($fullPath: ID!, $first: Int!) { project(fullPath: $fullPath) { id name description issues(first: $first) { nodes { id title state } } } }",
    "variables": {
      "fullPath": "gitlab-org/gitlab",
      "first": 10
    }
  }
}
```

**Example - Get Projects with Nested Data:**

```json
{
  "name": "graphql_query",
  "arguments": {
    "query": "query { projects(first: 5) { nodes { id name namespace { fullPath } repository { rootRef } } } }"
  }
}
```

### graphql_mutate

Execute a GraphQL mutation to modify data in GitLab (create issues, update merge requests, etc.).

**Parameters:**

- `mutation` (required): The GraphQL mutation string
- `variables` (optional): Variables for the mutation input

**Example - Create an Issue:**

```json
{
  "name": "graphql_mutate",
  "arguments": {
    "mutation": "mutation($input: CreateIssueInput!) { createIssue(input: $input) { issue { id title webUrl } errors } }",
    "variables": {
      "input": {
        "projectPath": "my-group/my-project",
        "title": "New issue from MCP",
        "description": "Created via GraphQL MCP server"
      }
    }
  }
}
```

## Architecture

The application is structured using NX workspace best practices with the following libraries:

- **@garage/types**: Shared TypeScript types for GitLab API and MCP server configuration
- **@garage/gitlab-client**: Apollo Client-based GitLab GraphQL client with schema introspection
- **@garage/mcp-handlers**: MCP protocol handlers for schema-driven tool operations

## Schema-Driven Approach

This implementation follows a schema-driven architecture as described in [The Future of MCP is GraphQL](https://www.apollographql.com/blog/the-future-of-mcp-is-graphql):

1. **Schema Loading**: The server downloads and caches the GitLab schema at startup, avoiding complexity limit issues
2. **Dynamic Query Construction**: Instead of dozens of static tools, the AI constructs exact queries based on needs
3. **Flexible Data Retrieval**: Fetch related data in single requests, reducing tool invocation round-trips
4. **Simplified Server**: The MCP server becomes a thin wrapper around the GraphQL endpoint

This approach provides:

- Fewer tools to maintain (2 tools instead of many static tools)
- Self-documenting API surface through the schema (exposed as a resource)
- No over/under-fetching of data
- GraphQL layer handles validation, execution, and error handling
- Avoids GitLab's query complexity limits by downloading schema from published endpoint

## Development

### Running Tests

```bash
# Test all libraries
pnpm nx test types
pnpm nx test gitlab-client
pnpm nx test mcp-handlers

# Test the application
pnpm nx test gitlab-mcp-server
```

### Linting

```bash
pnpm nx lint gitlab-mcp-server
```

### Building

```bash
pnpm nx build gitlab-mcp-server
```

## Troubleshooting

### Authentication Errors

If you receive authentication errors:

- Verify your GitLab token is valid and has not expired
- Ensure the token has the required scopes (`api` or `read_api`)
- Check that the `GITLAB_URL` is correct for your GitLab instance

### GraphQL Errors

If you receive GraphQL errors:

- Verify the project path format is correct (e.g., "username/project-name")
- Check that you have access to the requested resources
- Ensure the GitLab instance supports the GraphQL fields being queried

## References

- [Model Context Protocol Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [GitLab GraphQL API Documentation](https://docs.gitlab.com/api/graphql/)
- [NX Documentation](https://nx.dev)

## License

MIT

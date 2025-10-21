# GitLab MCP Server

A Model Context Protocol (MCP) server that provides schema-driven integration with GitLab's GraphQL API using Apollo Client.

## Overview

This MCP server enables AI assistants and other MCP clients to interact with GitLab through a flexible, schema-driven approach. Instead of multiple static tools, it provides direct access to the GitLab GraphQL API, allowing the LLM to construct queries dynamically based on the schema.

## Key Features

- **Schema Introspection**: Fetch the complete GitLab GraphQL schema to understand all available operations
- **Dynamic Query Construction**: LLM can construct exact queries for needed data based on the schema
- **Flexible Data Retrieval**: Fetch related data in single requests via nested GraphQL queries
- **Mutation Support**: Create, update, and delete GitLab resources using GraphQL mutations
- **Apollo Client Integration**: Leverages Apollo Client for robust GraphQL operations

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

### 3. Build the Application

```bash
# From the workspace root
pnpm nx build gitlab-mcp-server
```

### 4. Run the Server

```bash
# From the workspace root
GITLAB_TOKEN=your_token pnpm nx serve gitlab-mcp-server

# Or using the built version
GITLAB_TOKEN=your_token node dist/apps/gitlab-mcp-server/main.js
```

## Available Tools

### get_gitlab_schema

Get the complete GitLab GraphQL schema in SDL (Schema Definition Language) format. This is the starting point - use this to discover all available queries, mutations, types, and fields.

**Parameters:** None

**Example:**
```json
{
  "name": "get_gitlab_schema",
  "arguments": {}
}
```

**Response:** The complete GitLab GraphQL schema as a string, showing all types, queries, and mutations available.

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

1. **Schema Discovery**: The LLM introspects the GraphQL schema to understand available operations
2. **Dynamic Query Construction**: Instead of dozens of static tools, the LLM constructs exact queries based on needs
3. **Flexible Data Retrieval**: Fetch related data in single requests, reducing tool invocation round-trips
4. **Simplified Server**: The MCP server becomes a thin wrapper around the GraphQL endpoint

This approach provides:
- Fewer tools to maintain (3 instead of many static tools)
- Self-documenting API surface through the schema
- No over/under-fetching of data
- GraphQL layer handles validation, execution, and error handling

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

# Testing Guide for Atlassian MCP Server

This guide explains how to test the Atlassian MCP Server implementation.

## Running Tests

### All Tests

Run all tests for the Atlassian MCP Server and its libraries:

```bash
# From workspace root
pnpm nx run-many --target=test --projects=atlassian-types,atlassian-client,atlassian-mcp-handlers,atlassian-mcp-server
```

### Individual Library Tests

Test each library independently:

```bash
# Test types library
pnpm nx test atlassian-types

# Test client library
pnpm nx test atlassian-client

# Test MCP handlers library
pnpm nx test atlassian-mcp-handlers

# Test main application
pnpm nx test atlassian-mcp-server
```

## Test Structure

### Types Library (`@garage/atlassian-types`)

Tests verify:
- Interface definitions are correctly typed
- All type exports are accessible
- Type constraints are properly defined

Location: `libs/atlassian-mcp-server/types/src/lib/atlassian-types.spec.ts`

### Client Library (`@garage/atlassian-client`)

Tests verify:
- `AtlassianClient` class instantiation
- GraphQL query execution methods exist
- GraphQL mutation execution methods exist
- `SchemaManager` class instantiation
- Schema loading and caching functionality

Location: 
- `libs/atlassian-mcp-server/atlassian-client/src/lib/atlassian-client.spec.ts`
- `libs/atlassian-mcp-server/atlassian-client/src/lib/schema-manager.spec.ts`

### MCP Handlers Library (`@garage/atlassian-mcp-handlers`)

Tests verify:
- Handler registration with MCP server
- All required request handlers are registered
- Correct schema request types are used

Location: `libs/atlassian-mcp-server/mcp-handlers/src/lib/atlassian-mcp-handlers.spec.ts`

### Main Application

Tests verify:
- Application bootstraps correctly (when tests are added)
- Environment variables are properly validated
- Server initialization succeeds

Location: `apps/atlassian-mcp-server/src/main.spec.ts` (to be added as needed)

## Manual Testing

### Prerequisites

1. Obtain an Atlassian API token from [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Have access to an Atlassian organization (Jira, Confluence, etc.)

### Build the Server

```bash
# From workspace root
pnpm nx build atlassian-mcp-server
```

### Test Schema Loading

```bash
# Set your API token
export ATLASSIAN_API_TOKEN=your_token_here

# Run the server (will initialize schema)
node dist/apps/atlassian-mcp-server/main.js
```

Expected output:
```
Initializing Atlassian schema...
Downloaded and cached Atlassian schema
Atlassian MCP server running on stdio
```

Or if schema is cached:
```
Initializing Atlassian schema...
Loaded Atlassian schema from cache
Atlassian MCP server running on stdio
```

### Test with MCP Inspector

Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test the server:

1. Install the inspector:
```bash
npm install -g @modelcontextprotocol/inspector
```

2. Run the inspector with the server:
```bash
mcp-inspector node dist/apps/atlassian-mcp-server/main.js
```

3. Open the inspector UI in your browser

4. Test available tools:
   - `graphql_query`: Execute GraphQL queries
   - `graphql_mutate`: Execute GraphQL mutations

5. Test resources:
   - Read `atlassian://schema` to view the full schema

### Example Test Queries

#### Test 1: Get Current User Info

```json
{
  "tool": "graphql_query",
  "arguments": {
    "query": "query { me { id accountId displayName emailAddress } }"
  }
}
```

Expected: User information from Atlassian

#### Test 2: List Jira Projects

```json
{
  "tool": "graphql_query",
  "arguments": {
    "query": "query { jira { projects { edges { node { id name key } } } } }"
  }
}
```

Expected: List of accessible Jira projects

#### Test 3: Get Confluence Spaces

```json
{
  "tool": "graphql_query",
  "arguments": {
    "query": "query { confluence { spaces { edges { node { id name key } } } } }"
  }
}
```

Expected: List of accessible Confluence spaces

#### Test 4: Query with Variables

```json
{
  "tool": "graphql_query",
  "arguments": {
    "query": "query GetProject($projectId: ID!) { jira { project(id: $projectId) { id name key } } }",
    "variables": {
      "projectId": "10000"
    }
  }
}
```

Expected: Specific project details

### Test Error Handling

#### Test Invalid Query

```json
{
  "tool": "graphql_query",
  "arguments": {
    "query": "query { invalidField }"
  }
}
```

Expected: GraphQL error with details about invalid field

#### Test Missing Authentication

```bash
# Remove API token
unset ATLASSIAN_API_TOKEN

# Try to run server
node dist/apps/atlassian-mcp-server/main.js
```

Expected: Error message about missing ATLASSIAN_API_TOKEN

#### Test Invalid Query Syntax

```json
{
  "tool": "graphql_query",
  "arguments": {
    "query": "not a valid query"
  }
}
```

Expected: GraphQL syntax error

## Integration Testing

### Test with Claude Desktop

1. Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "node",
      "args": ["/path/to/garage/dist/apps/atlassian-mcp-server/main.js"],
      "env": {
        "ATLASSIAN_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

2. Restart Claude Desktop

3. Test queries through Claude:
   - "Show me my Jira projects"
   - "List issues in project X"
   - "Create a new Jira issue"

## Performance Testing

### Schema Download Performance

Test how long schema download and caching takes:

```bash
# Remove cached schema
rm -rf ~/.atlassian-mcp-server/schema

# Time the initialization
time node dist/apps/atlassian-mcp-server/main.js
```

### Query Performance

Test query execution speed with various query complexities:

1. Simple queries (few fields, no nesting)
2. Complex queries (many fields, deep nesting)
3. Queries with pagination

## Continuous Integration

The following commands run in CI:

```bash
# Linting
pnpm nx run-many --target=lint --projects=atlassian-types,atlassian-client,atlassian-mcp-handlers,atlassian-mcp-server

# Testing
pnpm nx run-many --target=test --projects=atlassian-types,atlassian-client,atlassian-mcp-handlers,atlassian-mcp-server

# Building
pnpm nx run-many --target=build --projects=atlassian-types,atlassian-client,atlassian-mcp-handlers,atlassian-mcp-server
```

## Test Coverage

View test coverage reports:

```bash
# Generate coverage for all libraries
pnpm nx run-many --target=test --projects=atlassian-types,atlassian-client,atlassian-mcp-handlers,atlassian-mcp-server --coverage

# Coverage reports are in:
# - coverage/libs/atlassian-mcp-server/types
# - coverage/libs/atlassian-mcp-server/atlassian-client
# - coverage/libs/atlassian-mcp-server/mcp-handlers
# - coverage/apps/atlassian-mcp-server
```

## Debugging Tests

### Enable Verbose Output

```bash
# Run tests with verbose output
pnpm nx test atlassian-client --verbose
```

### Run Single Test File

```bash
# Run specific test file
pnpm nx test atlassian-client --testFile=atlassian-client.spec.ts
```

### Watch Mode

```bash
# Run tests in watch mode
pnpm nx test atlassian-types --watch
```

## Known Test Limitations

1. **Schema Introspection**: Tests don't verify actual schema structure as it requires a live Atlassian connection
2. **Authentication**: Tests mock authentication rather than testing with real credentials
3. **Rate Limiting**: Tests don't verify rate limiting behavior with the Atlassian API

## Future Test Improvements

- [ ] Add integration tests with mock Atlassian GraphQL server
- [ ] Add end-to-end tests using MCP test framework
- [ ] Add performance benchmarks
- [ ] Add mutation validation tests
- [ ] Add schema parsing validation tests
- [ ] Test error recovery scenarios
- [ ] Test schema cache invalidation

## Troubleshooting Test Failures

### Dependencies Not Found

```bash
# Reinstall dependencies
pnpm install
```

### Build Artifacts Missing

```bash
# Rebuild all libraries
pnpm nx run-many --target=build --projects=atlassian-types,atlassian-client,atlassian-mcp-handlers
```

### Cache Issues

```bash
# Clear NX cache
pnpm nx reset
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [NX Testing Documentation](https://nx.dev/recipes/jest)
- [MCP Testing Guide](https://github.com/modelcontextprotocol/typescript-sdk)

# GitLab MCP Server: Schema Loading Refactoring Summary

## Overview

Refactored the GitLab MCP server to load the GitLab GraphQL schema at startup rather than exposing it as a tool. This improves performance, avoids GitLab's query complexity limits, and provides a better experience for AI assistants.

## Problem Statement

The original implementation had a `get_gitlab_schema` tool that used GraphQL introspection to fetch the schema on demand. This approach had several issues:

1. **Complexity Limit**: GitLab's introspection query has a complexity of 291, exceeding the default maximum of 250
2. **Performance**: Schema was fetched every time it was needed
3. **Unnecessary Tool**: AI had to explicitly call the tool to get schema information
4. **Round-trip Overhead**: Required an additional tool invocation before constructing queries

## Solution

### Architecture Changes

#### 1. Created `SchemaManager` Class

**Location**: `libs/gitlab-mcp-server/gitlab-client/src/lib/schema-manager.ts`

**Responsibilities**:

- Download schema from GitLab's published endpoint (`/api/graphql/reference/gitlab_schema.graphql`)
- Cache schema to disk (`.gitlab-cache/gitlab-schema.graphql`)
- Load cached schema on subsequent runs
- Parse schema to extract available queries and mutations
- Provide schema information for tool descriptions

**Key Features**:

- Automatic fallback: tries cache first, downloads if needed
- Graceful degradation: continues without schema if download fails
- Schema parsing: extracts query/mutation names to enhance tool descriptions
- File caching: avoids repeated downloads

#### 2. Updated Startup Process

**Location**: `apps/gitlab-mcp-server/src/main.ts`

**Changes**:

- Initialize `SchemaManager` before creating MCP server
- Load/download schema during startup
- Pass both `GitLabClient` and `SchemaManager` to MCP handlers

```typescript
// Initialize schema manager first
const schemaManager = new SchemaManager(gitlabUrl);
await schemaManager.initialize();

// Register handlers with schema manager
registerMcpHandlers(server, gitlabClient, schemaManager);
```

#### 3. Removed `get_gitlab_schema` Tool

**Location**: `libs/gitlab-mcp-server/mcp-handlers/src/lib/mcp-handlers.ts`

**Changes**:

- Removed `get_gitlab_schema` tool (no longer needed)
- Enhanced `graphql_query` and `graphql_mutate` tool descriptions with available operations
- Tool descriptions now include examples of available queries/mutations from the schema

#### 4. Added Schema as Resource

**Location**: `libs/gitlab-mcp-server/mcp-handlers/src/lib/mcp-handlers.ts`

**Changes**:

- Exposed schema as MCP resource (`gitlab://schema`)
- AI can read the resource when detailed schema information is needed
- Resources are more appropriate than tools for static data

#### 5. Removed Schema Logic from GitLabClient

**Location**: `libs/gitlab-mcp-server/gitlab-client/src/lib/gitlab-client.ts`

**Changes**:

- Removed `getSchema()` method
- Removed schema caching logic
- Removed introspection query imports
- Client now focused solely on executing queries/mutations

## Benefits

### Performance

- **One-time download**: Schema fetched once at startup, not on every request
- **Cached locally**: Subsequent runs use cached schema instantly
- **No introspection overhead**: Avoids complex GraphQL introspection queries

### Reliability

- **Avoids complexity limits**: Downloads from published endpoint instead of introspection
- **Graceful degradation**: Server continues to work even if schema unavailable
- **Offline capable**: Can work with cached schema when offline

### User Experience

- **Automatic**: Schema information embedded in tool descriptions
- **No extra calls**: AI doesn't need to explicitly fetch schema
- **Better context**: Tool descriptions include available operations

### Maintainability

- **Separation of concerns**: Schema management separated from API client
- **Testable**: SchemaManager can be tested independently
- **Configurable**: Cache directory can be customized

## Files Changed

### New Files

- `libs/gitlab-mcp-server/gitlab-client/src/lib/schema-manager.ts` - Schema management class
- `libs/gitlab-mcp-server/gitlab-client/src/lib/schema-manager.spec.ts` - Schema manager tests

### Modified Files

- `libs/gitlab-mcp-server/gitlab-client/src/lib/gitlab-client.ts` - Removed schema logic
- `libs/gitlab-mcp-server/gitlab-client/src/lib/gitlab-client.spec.ts` - Updated tests
- `libs/gitlab-mcp-server/gitlab-client/src/index.ts` - Export SchemaManager
- `apps/gitlab-mcp-server/src/main.ts` - Initialize schema at startup
- `libs/gitlab-mcp-server/mcp-handlers/src/lib/mcp-handlers.ts` - Removed tool, added resource, enhanced descriptions
- `apps/gitlab-mcp-server/README.md` - Updated documentation
- `.gitignore` - Added `.gitlab-cache/` directory

## Usage

### First Run

```bash
pnpm nx build gitlab-mcp-server
node dist/apps/gitlab-mcp-server/main.js
```

Output:

```
Initializing GitLab schema...
Downloaded and cached GitLab schema
GitLab MCP server running on stdio
```

### Subsequent Runs

```bash
node dist/apps/gitlab-mcp-server/main.js
```

Output:

```
Initializing GitLab schema...
Loaded GitLab schema from cache
GitLab MCP server running on stdio
```

### Force Schema Update

Delete the cache directory to download a fresh schema:

```bash
rm -rf .gitlab-cache
node dist/apps/gitlab-mcp-server/main.js
```

## Testing

All tests pass with comprehensive coverage:

```bash
pnpm nx test gitlab-client
# 14 tests, all passing
# - GitLabClient: 4 tests
# - SchemaManager: 10 tests
```

### Test Coverage

- Schema loading from cache
- Schema downloading from GitLab
- Schema caching to disk
- Download failure handling
- Query/mutation extraction
- URL formatting
- Custom cache directory

## API Changes

### Removed

- ❌ `get_gitlab_schema` tool - No longer needed

### Added

- ✅ `gitlab://schema` resource - Access schema as MCP resource
- ✅ Enhanced tool descriptions - Include available operations

### Unchanged

- ✅ `graphql_query` tool - Works exactly as before
- ✅ `graphql_mutate` tool - Works exactly as before

## Migration Notes

### For AI Assistants

- No changes needed - tools work the same way
- Schema information now in tool descriptions automatically
- Can still access full schema via `gitlab://schema` resource if needed

### For Developers

- No code changes required for existing integrations
- Schema cache directory (`.gitlab-cache/`) should be in `.gitignore`
- Can customize cache location via `SchemaManager` constructor

## Future Enhancements

Potential improvements for future iterations:

1. **Schema versioning**: Track schema version and auto-update when GitLab version changes
2. **TTL-based refresh**: Automatically refresh schema after a certain time period
3. **Diff detection**: Detect schema changes and log differences
4. **Schema validation**: Validate queries against cached schema before sending to GitLab
5. **Compression**: Compress cached schema to reduce disk space
6. **Multiple instances**: Support multiple GitLab instances with separate caches

## References

- [The Future of MCP is GraphQL](https://www.apollographql.com/blog/the-future-of-mcp-is-graphql)
- [GitLab GraphQL API Documentation](https://docs.gitlab.com/api/graphql/)
- [Model Context Protocol Documentation](https://github.com/modelcontextprotocol/typescript-sdk)

---

**Date**: January 21, 2025  
**Status**: ✅ Implemented and tested  
**Branch**: `copilot/create-gitlab-mcp-server`  
**PR**: #160

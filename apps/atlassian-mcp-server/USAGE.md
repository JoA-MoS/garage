# Atlassian MCP Server Usage Guide

This guide provides examples of how to use the Atlassian MCP Server to interact with Atlassian products via GraphQL.

## Getting Started

### Setting Up Authentication

Before using the server, you need an Atlassian API token:

1. Visit [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create a new API token
3. Set it as an environment variable:

```bash
export ATLASSIAN_API_TOKEN=your_token_here
```

### Running the Server

```bash
# Using npx (no installation required)
ATLASSIAN_API_TOKEN=your_token npx atlassian-mcp-server

# Or if installed globally
ATLASSIAN_API_TOKEN=your_token atlassian-mcp-server
```

## Common Query Examples

### Jira Queries

#### Get All Projects

```graphql
query {
  jira {
    projects {
      edges {
        node {
          id
          name
          key
          description
        }
      }
    }
  }
}
```

#### Get Specific Issue

```graphql
query GetIssue($issueId: ID!) {
  jira {
    issue(id: $issueId) {
      id
      key
      summary
      description
      status {
        name
      }
      assignee {
        accountId
        displayName
        emailAddress
      }
      reporter {
        accountId
        displayName
      }
    }
  }
}
```

Variables:
```json
{
  "issueId": "10001"
}
```

#### Get Issues for a Project

```graphql
query GetProjectIssues($projectId: ID!, $first: Int!) {
  jira {
    project(id: $projectId) {
      id
      name
      issues(first: $first) {
        edges {
          node {
            id
            key
            summary
            status {
              name
            }
          }
        }
      }
    }
  }
}
```

Variables:
```json
{
  "projectId": "10000",
  "first": 20
}
```

### Confluence Queries

#### Get Spaces

```graphql
query {
  confluence {
    spaces {
      edges {
        node {
          id
          name
          key
          description
        }
      }
    }
  }
}
```

#### Get Pages in a Space

```graphql
query GetSpacePages($spaceId: ID!, $first: Int!) {
  confluence {
    space(id: $spaceId) {
      id
      name
      pages(first: $first) {
        edges {
          node {
            id
            title
            body {
              storage {
                value
              }
            }
          }
        }
      }
    }
  }
}
```

Variables:
```json
{
  "spaceId": "123456",
  "first": 10
}
```

## Common Mutation Examples

### Jira Mutations

#### Create an Issue

```graphql
mutation CreateIssue($input: CreateJiraIssueInput!) {
  jira {
    createIssue(input: $input) {
      issue {
        id
        key
        summary
      }
      errors {
        message
      }
    }
  }
}
```

Variables:
```json
{
  "input": {
    "projectId": "10000",
    "summary": "New bug report",
    "description": "Description of the bug",
    "issueTypeId": "10001"
  }
}
```

#### Update an Issue

```graphql
mutation UpdateIssue($input: UpdateJiraIssueInput!) {
  jira {
    updateIssue(input: $input) {
      issue {
        id
        key
        summary
        status {
          name
        }
      }
      errors {
        message
      }
    }
  }
}
```

Variables:
```json
{
  "input": {
    "issueId": "10001",
    "summary": "Updated summary",
    "description": "Updated description"
  }
}
```

#### Add Comment to Issue

```graphql
mutation AddComment($input: AddJiraCommentInput!) {
  jira {
    addComment(input: $input) {
      comment {
        id
        body
        author {
          displayName
        }
      }
      errors {
        message
      }
    }
  }
}
```

Variables:
```json
{
  "input": {
    "issueId": "10001",
    "body": "This is a comment on the issue"
  }
}
```

### Confluence Mutations

#### Create a Page

```graphql
mutation CreatePage($input: CreateConfluencePageInput!) {
  confluence {
    createPage(input: $input) {
      page {
        id
        title
        webUrl
      }
      errors {
        message
      }
    }
  }
}
```

Variables:
```json
{
  "input": {
    "spaceId": "123456",
    "title": "New Documentation Page",
    "body": {
      "storage": {
        "value": "<p>This is the page content in Confluence storage format</p>",
        "representation": "STORAGE"
      }
    }
  }
}
```

## Using with MCP Clients

### Claude Desktop Configuration

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["atlassian-mcp-server"],
      "env": {
        "ATLASSIAN_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Using with Other MCP Clients

Any MCP-compatible client can use this server. Configure it according to your client's documentation, ensuring:

1. The server is accessible via stdio transport
2. The `ATLASSIAN_API_TOKEN` environment variable is set
3. (Optional) Set `ATLASSIAN_URL` if using a different Atlassian instance

## Advanced Usage

### Working with the Schema Resource

You can access the full GraphQL schema to understand available types and operations:

```
Resource URI: atlassian://schema
```

This returns the complete schema in SDL (Schema Definition Language) format, which can be used to:

- Discover available queries and mutations
- Understand type definitions
- Build complex queries with proper field selection
- Validate query structure before execution

### Error Handling

The server returns errors in the standard GraphQL format:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Error description",
      "path": ["jira", "issue"],
      "extensions": {
        "code": "ERROR_CODE"
      }
    }
  ]
}
```

Common error scenarios:

- **Authentication errors**: Check your API token is valid
- **Not found errors**: Verify IDs exist and you have access
- **Validation errors**: Review query syntax and required fields
- **Permission errors**: Ensure your token has necessary permissions

## Best Practices

1. **Use Variables**: Always use GraphQL variables for dynamic values instead of string interpolation
2. **Request Only Needed Fields**: Only select fields you actually need to reduce response size
3. **Handle Errors**: Always check for errors in the response before using data
4. **Cache Schema Locally**: The schema is cached automatically, but you can reference it to build queries
5. **Test Queries**: Use the Atlassian GraphQL Explorer to test queries before using in MCP

## Troubleshooting

### Schema Not Loading

If the schema fails to load:

1. Check your API token is valid
2. Verify network connectivity to Atlassian
3. Ensure you have permissions to access GraphQL API
4. Try deleting the schema cache and restarting

### Query Complexity Errors

If you encounter query complexity errors:

1. Reduce the depth of nested queries
2. Limit the number of items requested with pagination
3. Remove unnecessary fields from the selection set
4. Break complex queries into multiple simpler queries

### Performance Issues

For better performance:

1. Use pagination for large result sets
2. Implement proper field selection (avoid over-fetching)
3. Cache frequently accessed data in your application
4. Use the schema resource to understand data relationships

## Additional Resources

- [Atlassian GraphQL API Documentation](https://developer.atlassian.com/platform/atlassian-graphql-api/graphql/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Model Context Protocol Specification](https://github.com/modelcontextprotocol)

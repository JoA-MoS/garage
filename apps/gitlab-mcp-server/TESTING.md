# Testing GitLab MCP Server with VS Code

## Quick Start

The GitLab MCP server is now configured in your workspace at `.vscode/mcp.json` and ready to test!

## Configuration

Your workspace MCP configuration includes:

- **Server name**: `gitlab-local`
- **Command**: Runs the built server from `dist/apps/gitlab-mcp-server/main.js`
- **Environment**: Uses your GitLab token from `.env.local`
- **Type**: stdio (standard input/output communication)

## Testing Steps

### 1. Reload VS Code Window

After configuration changes, reload VS Code:

- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Type "Reload Window" and select it
- Or close and reopen VS Code

### 2. Verify MCP Server Connection

In a new chat session with GitHub Copilot, try:

```
@gitlab-local Can you see the GitLab MCP server?
```

### 3. Test Schema Introspection

Get the complete GitLab GraphQL schema:

```
@gitlab-local Get the GitLab GraphQL schema
```

This should return the complete schema showing all available types, queries, and mutations.

### 4. Test Basic Queries

Try these example queries:

**Get Current User:**

```
@gitlab-local Query GitLab for the current user's information (id, name, username, email)
```

**List Projects:**

```
@gitlab-local Query GitLab for my first 5 projects with their names and IDs
```

**Get Project Details:**

```
@gitlab-local Query GitLab for details about the project "JoA-MoS/garage" including its description and issues
```

### 5. Test Advanced Queries

**Nested Data Fetching:**

```
@gitlab-local Get my projects with their namespace information and repository details
```

**Issues with Filters:**

```
@gitlab-local Get all open issues in the "JoA-MoS/garage" project
```

### 6. Test Mutations

**Create an Issue:**

```
@gitlab-local Create a new issue in my test project with title "Test from MCP" and description "Testing the GitLab MCP server"
```

## Available Tools

Your GitLab MCP server provides these tools:

### `get_gitlab_schema`

- **Purpose**: Fetch the complete GitLab GraphQL schema
- **Parameters**: None
- **Use**: Start here to discover all available queries and mutations

### `graphql_query`

- **Purpose**: Execute any GraphQL query
- **Parameters**:
  - `query`: GraphQL query string (required)
  - `variables`: Query variables (optional)
- **Use**: Fetch data from GitLab

### `graphql_mutate`

- **Purpose**: Execute GraphQL mutations
- **Parameters**:
  - `mutation`: GraphQL mutation string (required)
  - `variables`: Mutation input variables (optional)
- **Use**: Create, update, or delete GitLab resources

## Example GraphQL Queries

### Get Current User

```graphql
query {
  currentUser {
    id
    name
    username
    email
    avatarUrl
  }
}
```

### Get Projects with Issues

```graphql
query ($fullPath: ID!, $first: Int!) {
  project(fullPath: $fullPath) {
    id
    name
    description
    issues(first: $first) {
      nodes {
        id
        iid
        title
        state
        author {
          name
          username
        }
      }
    }
  }
}
```

Variables:

```json
{
  "fullPath": "JoA-MoS/garage",
  "first": 10
}
```

### Get Merge Requests

```graphql
query ($fullPath: ID!) {
  project(fullPath: $fullPath) {
    id
    name
    mergeRequests(first: 5, state: opened) {
      nodes {
        id
        iid
        title
        description
        state
        webUrl
        author {
          name
          username
        }
      }
    }
  }
}
```

## Example Mutations

### Create Issue

```graphql
mutation ($input: CreateIssueInput!) {
  createIssue(input: $input) {
    issue {
      id
      iid
      title
      webUrl
    }
    errors
  }
}
```

Variables:

```json
{
  "input": {
    "projectPath": "JoA-MoS/garage",
    "title": "New issue from MCP",
    "description": "Created via the GitLab MCP server"
  }
}
```

## Troubleshooting

### Server Not Showing Up

If `@gitlab-local` doesn't appear in Copilot chat:

1. Verify the build completed: `pnpm nx build gitlab-mcp-server`
2. Check the configuration in `.vscode/mcp.json`
3. Reload VS Code window
4. Check VS Code output panel for MCP errors

### Authentication Errors

If you get authentication errors:

1. Verify your GitLab token in `.env.local` is valid
2. Check the token has appropriate scopes (api or read_api)
3. Ensure GITLAB_URL is correct (defaults to https://gitlab.com)

### GraphQL Errors

If queries fail:

1. Use `get_gitlab_schema` first to see available fields
2. Verify project paths use format "username/project-name"
3. Check you have access to the requested resources
4. Ensure field names match exactly (GraphQL is case-sensitive)

### Rebuild After Changes

If you make changes to the server code:

```bash
pnpm nx build gitlab-mcp-server
```

Then reload VS Code window to pick up the new build.

## Development Workflow

### Watch Mode (Optional)

For active development, you can run the build in watch mode:

```bash
pnpm nx build gitlab-mcp-server --watch
```

This will rebuild automatically when you make changes. You'll still need to reload VS Code to pick up changes.

### Direct Testing (Without VS Code)

You can also test the server directly using stdio:

```bash
cd /home/joamos/code/github/garage
GITLAB_TOKEN=your_token node dist/apps/gitlab-mcp-server/main.js
```

Then send MCP protocol messages via stdin.

## Next Steps

1. **Explore the Schema**: Use `get_gitlab_schema` to understand all available operations
2. **Build Queries**: Construct GraphQL queries for your specific needs
3. **Test Mutations**: Try creating/updating GitLab resources
4. **Iterate**: The schema-driven approach means you can query for exactly the data you need

## Resources

- [GitLab GraphQL API Docs](https://docs.gitlab.com/api/graphql/)
- [GitLab GraphQL Explorer](https://gitlab.com/-/graphql-explorer) - Interactive schema explorer
- [MCP Documentation](https://github.com/modelcontextprotocol/specification)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)

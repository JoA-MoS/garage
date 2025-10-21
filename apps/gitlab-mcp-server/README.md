# GitLab MCP Server

A Model Context Protocol (MCP) server that provides integration with GitLab's GraphQL API.

## Overview

This MCP server allows AI assistants and other MCP clients to interact with GitLab repositories, issues, merge requests, and pipelines through a standardized protocol.

## Features

- **List Projects**: Get a list of GitLab projects
- **Get Project**: Retrieve details for a specific project
- **List Issues**: Get issues for a project
- **List Merge Requests**: Get merge requests for a project
- **List Pipelines**: Get CI/CD pipelines for a project

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

### list_projects

List GitLab projects.

**Parameters:**
- `first` (optional): Number of projects to return (default: 20)

**Example:**
```json
{
  "name": "list_projects",
  "arguments": {
    "first": 10
  }
}
```

### get_project

Get a specific GitLab project by full path.

**Parameters:**
- `fullPath` (required): Full path of the project (e.g., "username/project-name")

**Example:**
```json
{
  "name": "get_project",
  "arguments": {
    "fullPath": "gitlab-org/gitlab"
  }
}
```

### list_issues

List issues for a GitLab project.

**Parameters:**
- `projectPath` (required): Full path of the project
- `first` (optional): Number of issues to return (default: 20)

**Example:**
```json
{
  "name": "list_issues",
  "arguments": {
    "projectPath": "gitlab-org/gitlab",
    "first": 10
  }
}
```

### list_merge_requests

List merge requests for a GitLab project.

**Parameters:**
- `projectPath` (required): Full path of the project
- `first` (optional): Number of merge requests to return (default: 20)

**Example:**
```json
{
  "name": "list_merge_requests",
  "arguments": {
    "projectPath": "gitlab-org/gitlab",
    "first": 10
  }
}
```

### list_pipelines

List pipelines for a GitLab project.

**Parameters:**
- `projectPath` (required): Full path of the project
- `first` (optional): Number of pipelines to return (default: 20)

**Example:**
```json
{
  "name": "list_pipelines",
  "arguments": {
    "projectPath": "gitlab-org/gitlab",
    "first": 10
  }
}
```

## Architecture

The application is structured using NX workspace best practices with the following libraries:

- **@garage/types**: Shared TypeScript types for GitLab API and MCP server
- **@garage/gitlab-client**: GitLab GraphQL API client
- **@garage/mcp-handlers**: MCP protocol handlers and tool implementations

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

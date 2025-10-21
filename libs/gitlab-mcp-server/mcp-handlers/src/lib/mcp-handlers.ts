import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GitLabClient } from '@garage/gitlab-client';

export function registerMcpHandlers(server: Server, gitlabClient: GitLabClient) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: 'list_projects',
        description: 'List GitLab projects',
        inputSchema: {
          type: 'object',
          properties: {
            first: {
              type: 'number',
              description: 'Number of projects to return (default: 20)',
              default: 20,
            },
          },
        },
      },
      {
        name: 'get_project',
        description: 'Get a specific GitLab project by full path',
        inputSchema: {
          type: 'object',
          properties: {
            fullPath: {
              type: 'string',
              description: 'Full path of the project (e.g., "username/project-name")',
            },
          },
          required: ['fullPath'],
        },
      },
      {
        name: 'list_issues',
        description: 'List issues for a GitLab project',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Full path of the project',
            },
            first: {
              type: 'number',
              description: 'Number of issues to return (default: 20)',
              default: 20,
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'list_merge_requests',
        description: 'List merge requests for a GitLab project',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Full path of the project',
            },
            first: {
              type: 'number',
              description: 'Number of merge requests to return (default: 20)',
              default: 20,
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'list_pipelines',
        description: 'List pipelines for a GitLab project',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Full path of the project',
            },
            first: {
              type: 'number',
              description: 'Number of pipelines to return (default: 20)',
              default: 20,
            },
          },
          required: ['projectPath'],
        },
      },
    ];

    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list_projects': {
          const first = (args?.first as number) || 20;
          const projects = await gitlabClient.getProjects(first);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(projects, null, 2),
              },
            ],
          };
        }

        case 'get_project': {
          const fullPath = args?.fullPath as string;
          if (!fullPath) {
            throw new Error('fullPath is required');
          }
          const project = await gitlabClient.getProject(fullPath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(project, null, 2),
              },
            ],
          };
        }

        case 'list_issues': {
          const projectPath = args?.projectPath as string;
          if (!projectPath) {
            throw new Error('projectPath is required');
          }
          const first = (args?.first as number) || 20;
          const issues = await gitlabClient.getIssues(projectPath, first);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(issues, null, 2),
              },
            ],
          };
        }

        case 'list_merge_requests': {
          const projectPath = args?.projectPath as string;
          if (!projectPath) {
            throw new Error('projectPath is required');
          }
          const first = (args?.first as number) || 20;
          const mergeRequests = await gitlabClient.getMergeRequests(projectPath, first);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(mergeRequests, null, 2),
              },
            ],
          };
        }

        case 'list_pipelines': {
          const projectPath = args?.projectPath as string;
          if (!projectPath) {
            throw new Error('projectPath is required');
          }
          const first = (args?.first as number) || 20;
          const pipelines = await gitlabClient.getPipelines(projectPath, first);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(pipelines, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
}


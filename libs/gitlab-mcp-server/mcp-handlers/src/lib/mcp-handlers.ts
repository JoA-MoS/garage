import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GitLabClient } from '@garage/gitlab-client';

export function registerMcpHandlers(server: Server, gitlabClient: GitLabClient) {
  // List available tools - now schema-driven with fewer, more powerful tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: 'get_gitlab_schema',
        description:
          'Get the complete GitLab GraphQL schema in SDL format. Use this to understand what queries and mutations are available, what fields exist on types, and how to construct queries. The schema is self-documenting and shows all available operations.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'graphql_query',
        description:
          'Execute a GraphQL query against the GitLab API. Construct queries based on the schema obtained from get_gitlab_schema. This allows flexible data retrieval - you can fetch exactly the data needed, include nested relationships, and use GraphQL features like fragments and aliases. Supports variables for parameterized queries.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'The GraphQL query to execute. Must be valid GraphQL syntax. Example: "query { currentUser { id name } }"',
            },
            variables: {
              type: 'object',
              description:
                'Optional variables for the query. Pass as a JSON object. Example: {"fullPath": "gitlab-org/gitlab", "first": 10}',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'graphql_mutate',
        description:
          'Execute a GraphQL mutation against the GitLab API. Use this to modify data - create issues, update merge requests, etc. Construct mutations based on the schema. Supports variables for parameterized mutations.',
        inputSchema: {
          type: 'object',
          properties: {
            mutation: {
              type: 'string',
              description:
                'The GraphQL mutation to execute. Must be valid GraphQL syntax. Example: "mutation($input: CreateIssueInput!) { createIssue(input: $input) { issue { id } } }"',
            },
            variables: {
              type: 'object',
              description:
                'Optional variables for the mutation. Pass as a JSON object with the required input parameters.',
            },
          },
          required: ['mutation'],
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
        case 'get_gitlab_schema': {
          const schema = await gitlabClient.getSchema();
          return {
            content: [
              {
                type: 'text',
                text: schema,
              },
            ],
          };
        }

        case 'graphql_query': {
          const query = args?.query as string;
          if (!query) {
            throw new Error('query parameter is required');
          }

          const variables = (args?.variables as Record<string, unknown>) || undefined;
          const result = await gitlabClient.executeQuery(query, variables);

          if (result.errors && result.errors.length > 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      data: result.data,
                      errors: result.errors,
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.data, null, 2),
              },
            ],
          };
        }

        case 'graphql_mutate': {
          const mutation = args?.mutation as string;
          if (!mutation) {
            throw new Error('mutation parameter is required');
          }

          const variables = (args?.variables as Record<string, unknown>) || undefined;
          const result = await gitlabClient.executeMutation(mutation, variables);

          if (result.errors && result.errors.length > 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      data: result.data,
                      errors: result.errors,
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.data, null, 2),
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


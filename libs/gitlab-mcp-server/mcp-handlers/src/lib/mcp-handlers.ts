import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GitLabClient, SchemaManager } from '@garage/gitlab-client';

export function registerMcpHandlers(
  server: Server,
  gitlabClient: GitLabClient,
  schemaManager: SchemaManager
) {
  // List available resources - expose the schema as a resource
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    if (!schemaManager.hasSchema()) {
      return { resources: [] };
    }

    return {
      resources: [
        {
          uri: 'gitlab://schema',
          name: 'GitLab GraphQL Schema',
          description:
            'The complete GitLab GraphQL schema in SDL format. Contains all available types, queries, and mutations.',
          mimeType: 'text/plain',
        },
      ],
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'gitlab://schema') {
      const schema = schemaManager.getSchema();
      if (!schema) {
        throw new Error('Schema not available');
      }

      return {
        contents: [
          {
            uri: 'gitlab://schema',
            mimeType: 'text/plain',
            text: schema,
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  // List available tools - now schema-driven with fewer, more powerful tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Get schema info to enhance tool descriptions
    const { queries, mutations, hasSchema } =
      schemaManager.getOperationsSummary();

    // Build enhanced descriptions based on available schema
    const queryExamples = queries.slice(0, 10).join(', ');
    const mutationExamples = mutations.slice(0, 10).join(', ');

    const queryDescription = hasSchema
      ? `Execute a GraphQL query against the GitLab API. The schema is loaded and available for reference. 
         
         Available root queries include: ${queryExamples}${
          queries.length > 10 ? ', and more...' : ''
        }
         
         This allows flexible data retrieval - you can fetch exactly the data needed, include nested relationships, 
         and use GraphQL features like fragments and aliases. Supports variables for parameterized queries.
         
         Example queries:
         - currentUser { id username name }
         - project(fullPath: "group/project") { id name description }
         - projects(membership: true, first: 10) { nodes { id name } }`
      : 'Execute a GraphQL query against the GitLab API. Construct queries based on GitLab GraphQL documentation. This allows flexible data retrieval - you can fetch exactly the data needed, include nested relationships, and use GraphQL features like fragments and aliases. Supports variables for parameterized queries.';

    const mutationDescription = hasSchema
      ? `Execute a GraphQL mutation against the GitLab API to modify data. The schema is loaded and available for reference.
         
         Available mutations include: ${mutationExamples}${
          mutations.length > 10 ? ', and more...' : ''
        }
         
         Use this to create issues, update merge requests, add comments, manage labels, and more. 
         Supports variables for parameterized mutations.
         
         Example mutations:
         - createIssue(input: {...}) { issue { id title } }
         - updateMergeRequest(input: {...}) { mergeRequest { id state } }
         - createNote(input: {...}) { note { id body } }`
      : 'Execute a GraphQL mutation against the GitLab API to modify data. Use this to create issues, update merge requests, etc. Construct mutations based on GitLab GraphQL documentation. Supports variables for parameterized mutations.';

    const tools: Tool[] = [
      {
        name: 'graphql_query',
        description: queryDescription,
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
        description: mutationDescription,
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
        case 'graphql_query': {
          const query = args?.['query'] as string;
          if (!query) {
            throw new Error('query parameter is required');
          }

          const variables =
            (args?.['variables'] as Record<string, unknown>) || undefined;
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
          const mutation = args?.['mutation'] as string;
          if (!mutation) {
            throw new Error('mutation parameter is required');
          }

          const variables =
            (args?.['variables'] as Record<string, unknown>) || undefined;
          const result = await gitlabClient.executeMutation(
            mutation,
            variables
          );

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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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

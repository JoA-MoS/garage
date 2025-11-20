import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { AtlassianClient, SchemaManager } from '@garage/atlassian-client';

export function registerMcpHandlers(
  server: Server,
  atlassianClient: AtlassianClient,
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
          uri: 'atlassian://schema',
          name: 'Atlassian GraphQL Schema',
          description:
            'The complete Atlassian GraphQL schema in SDL format. Contains all available types, queries, and mutations.',
          mimeType: 'text/plain',
        },
      ],
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'atlassian://schema') {
      const schema = schemaManager.getSchema();
      if (!schema) {
        throw new Error('Schema not available');
      }

      return {
        contents: [
          {
            uri: 'atlassian://schema',
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
      ? `Execute a GraphQL query against the Atlassian API. The schema is loaded and available for reference.

         Available root queries include: ${queryExamples}${
          queries.length > 10 ? ', and more...' : ''
        }

         This allows flexible data retrieval - you can fetch exactly the data needed, include nested relationships,
         and use GraphQL features like fragments and aliases. Supports variables for parameterized queries.

         Example queries:
         - jira { project(id: "PROJECT_ID") { name key } }
         - jira { issue(id: "ISSUE_ID") { key summary status { name } } }
         - jira { projects { edges { node { id name key } } } }`
      : 'Execute a GraphQL query against the Atlassian API. Construct queries based on Atlassian GraphQL documentation. This allows flexible data retrieval - you can fetch exactly the data needed, include nested relationships, and use GraphQL features like fragments and aliases. Supports variables for parameterized queries.';

    const mutationDescription = hasSchema
      ? `Execute a GraphQL mutation against the Atlassian API to modify data. The schema is loaded and available for reference.

         Available mutations include: ${mutationExamples}${
          mutations.length > 10 ? ', and more...' : ''
        }

         Use this to create issues, update projects, add comments, manage users, and more.
         Supports variables for parameterized mutations.

         Example mutations:
         - jira { createIssue(input: {...}) { issue { id key } } }
         - jira { updateIssue(input: {...}) { issue { id summary } } }
         - jira { addComment(input: {...}) { comment { id body } } }`
      : 'Execute a GraphQL mutation against the Atlassian API to modify data. Use this to create issues, update projects, etc. Construct mutations based on Atlassian GraphQL documentation. Supports variables for parameterized mutations.';

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
                'The GraphQL query to execute. Must be valid GraphQL syntax. Example: "query { jira { project(id: \\"10000\\") { name key } } }"',
            },
            variables: {
              type: 'object',
              description:
                'Optional variables for the query. Pass as a JSON object. Example: {"projectId": "10000", "first": 10}',
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
                'The GraphQL mutation to execute. Must be valid GraphQL syntax. Example: "mutation($input: CreateIssueInput!) { jira { createIssue(input: $input) { issue { id key } } } }"',
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
          const result = await atlassianClient.executeQuery(query, variables);

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
          const result = await atlassianClient.executeMutation(
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

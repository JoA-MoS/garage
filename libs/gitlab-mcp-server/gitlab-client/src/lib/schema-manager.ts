import { promises as fs } from 'fs';
import { join } from 'path';

import { GitLabClient } from './gitlab-client';

// GraphQL Introspection Types
interface IntrospectionType {
  kind: string;
  name: string;
  description?: string;
  fields?: IntrospectionField[];
  interfaces?: IntrospectionTypeRef[];
  possibleTypes?: IntrospectionTypeRef[];
  enumValues?: IntrospectionEnumValue[];
  inputFields?: IntrospectionInputValue[];
}

interface IntrospectionField {
  name: string;
  description?: string;
  args: IntrospectionInputValue[];
  type: IntrospectionTypeRef;
  isDeprecated: boolean;
  deprecationReason?: string;
}

interface IntrospectionInputValue {
  name: string;
  description?: string;
  type: IntrospectionTypeRef;
  defaultValue?: string;
}

interface IntrospectionTypeRef {
  kind: string;
  name?: string;
  ofType?: IntrospectionTypeRef;
}

interface IntrospectionEnumValue {
  name: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
}

interface IntrospectionSchema {
  queryType?: { name: string };
  mutationType?: { name: string };
  subscriptionType?: { name: string };
  types: IntrospectionType[];
}

export class SchemaManager {
  private schema: string | null = null;
  private readonly schemaPath: string;
  private readonly gitlabClient: GitLabClient;

  /**
   * Creates a new SchemaManager.
   * @param gitlabClient The GitLabClient instance to use for schema introspection.
   * @param cacheDir Optional. The directory to cache the downloaded schema. Defaults to a `schema` directory relative to this package if not specified.
   */
  constructor(gitlabClient: GitLabClient, cacheDir?: string) {
    this.gitlabClient = gitlabClient;
    // Default to a schema directory relative to the package (works when installed as npm package)
    this.schemaPath = cacheDir
      ? join(cacheDir, 'gitlab-schema.graphql')
      : join(__dirname, 'schema', 'gitlab-schema.graphql');
  }

  /**
   * Initialize the schema manager by loading or downloading the schema
   */
  async initialize(): Promise<void> {
    try {
      // Try to load cached schema first
      this.schema = await this.loadCachedSchema();
      console.error('Loaded GitLab schema from cache');
    } catch {
      console.error(
        'No cached schema found, attempting to download from GitLab...'
      );
      try {
        // Download schema from GitLab
        this.schema = await this.downloadSchema();
        // Cache the downloaded schema
        await this.cacheSchema(this.schema);
        console.error('Downloaded and cached GitLab schema');
      } catch (downloadError) {
        console.error(
          'Warning: Could not load GitLab schema. Schema-driven features will be limited.',
          downloadError instanceof Error
            ? downloadError.message
            : String(downloadError)
        );
        this.schema = null;
      }
    }
  }

  /**
   * Get the loaded schema
   */
  getSchema(): string | null {
    return this.schema;
  }

  /**
   * Check if schema is available
   */
  hasSchema(): boolean {
    return this.schema !== null && this.schema.length > 0;
  }

  /**
   * Load schema from cache file
   */
  private async loadCachedSchema(): Promise<string> {
    const schema = await fs.readFile(this.schemaPath, 'utf-8');
    if (!schema || schema.trim().length === 0) {
      throw new Error('Cached schema is empty');
    }
    return schema;
  }

  /**
   * Download schema from GitLab using GraphQL introspection
   */
  private async downloadSchema(): Promise<string> {
    // GraphQL introspection query to get the full schema
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
          directives {
            name
            description
            locations
            args {
              ...InputValue
            }
          }
        }
      }

      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }

      fragment InputValue on __InputValue {
        name
        description
        type { ...TypeRef }
        defaultValue
      }

      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.gitlabClient.executeQuery(introspectionQuery);

    if (result.errors) {
      throw new Error(
        `GraphQL introspection errors: ${JSON.stringify(result.errors)}`
      );
    }

    if (
      !result.data ||
      typeof result.data !== 'object' ||
      !('__schema' in result.data)
    ) {
      throw new Error('Invalid introspection result: missing __schema');
    }

    // Convert introspection result to SDL (Schema Definition Language)
    const schema = this.introspectionToSDL(
      result.data.__schema as IntrospectionSchema
    );

    if (!schema || schema.trim().length === 0) {
      throw new Error('Downloaded schema is empty');
    }

    return schema;
  }

  /**
   * Convert GraphQL introspection result to Schema Definition Language (SDL)
   * This is a simplified conversion - for production, consider using a library like graphql-js
   */
  private introspectionToSDL(schema: IntrospectionSchema): string {
    const lines: string[] = [];

    // Add schema definition
    if (schema.queryType || schema.mutationType || schema.subscriptionType) {
      lines.push('schema {');
      if (schema.queryType) {
        lines.push(`  query: ${schema.queryType.name}`);
      }
      if (schema.mutationType) {
        lines.push(`  mutation: ${schema.mutationType.name}`);
      }
      if (schema.subscriptionType) {
        lines.push(`  subscription: ${schema.subscriptionType.name}`);
      }
      lines.push('}');
      lines.push('');
    }

    // Add types
    for (const type of schema.types) {
      // Skip introspection types
      if (type.name.startsWith('__')) {
        continue;
      }

      switch (type.kind) {
        case 'OBJECT':
          this.addObjectType(lines, type);
          break;
        case 'INTERFACE':
          this.addInterfaceType(lines, type);
          break;
        case 'UNION':
          this.addUnionType(lines, type);
          break;
        case 'ENUM':
          this.addEnumType(lines, type);
          break;
        case 'INPUT_OBJECT':
          this.addInputObjectType(lines, type);
          break;
        case 'SCALAR':
          this.addScalarType(lines, type);
          break;
      }
    }

    return lines.join('\n');
  }

  private addObjectType(lines: string[], type: IntrospectionType): void {
    if (type.description) {
      lines.push(`"""${type.description}"""`);
    }
    const interfaces =
      type.interfaces && type.interfaces.length > 0
        ? ` implements ${type.interfaces
            .map((i: IntrospectionTypeRef) => i.name)
            .join(' & ')}`
        : '';
    lines.push(`type ${type.name}${interfaces} {`);
    if (type.fields) {
      for (const field of type.fields) {
        this.addField(lines, field);
      }
    }
    lines.push('}');
    lines.push('');
  }

  private addInterfaceType(lines: string[], type: IntrospectionType): void {
    if (type.description) {
      lines.push(`"""${type.description}"""`);
    }
    lines.push(`interface ${type.name} {`);
    if (type.fields) {
      for (const field of type.fields) {
        this.addField(lines, field);
      }
    }
    lines.push('}');
    lines.push('');
  }

  private addUnionType(lines: string[], type: IntrospectionType): void {
    if (type.description) {
      lines.push(`"""${type.description}"""`);
    }
    const types =
      type.possibleTypes
        ?.map((t: IntrospectionTypeRef) => t.name)
        .join(' | ') || '';
    lines.push(`union ${type.name} = ${types}`);
    lines.push('');
  }

  private addEnumType(lines: string[], type: IntrospectionType): void {
    if (type.description) {
      lines.push(`"""${type.description}"""`);
    }
    lines.push(`enum ${type.name} {`);
    if (type.enumValues) {
      for (const value of type.enumValues) {
        if (value.description) {
          lines.push(`  """${value.description}"""`);
        }
        lines.push(`  ${value.name}`);
      }
    }
    lines.push('}');
    lines.push('');
  }

  private addInputObjectType(lines: string[], type: IntrospectionType): void {
    if (type.description) {
      lines.push(`"""${type.description}"""`);
    }
    lines.push(`input ${type.name} {`);
    if (type.inputFields) {
      for (const field of type.inputFields) {
        this.addInputField(lines, field);
      }
    }
    lines.push('}');
    lines.push('');
  }

  private addScalarType(lines: string[], type: IntrospectionType): void {
    if (type.description) {
      lines.push(`"""${type.description}"""`);
    }
    lines.push(`scalar ${type.name}`);
    lines.push('');
  }

  private addField(lines: string[], field: IntrospectionField): void {
    if (field.description) {
      lines.push(`  """${field.description}"""`);
    }
    const args =
      field.args && field.args.length > 0
        ? `(${field.args
            .map(
              (arg: IntrospectionInputValue) =>
                `${arg.name}: ${this.typeToString(arg.type)}`
            )
            .join(', ')})`
        : '';
    const deprecated = field.isDeprecated
      ? ` @deprecated(reason: "${
          field.deprecationReason || 'No longer supported'
        }")`
      : '';
    lines.push(
      `  ${field.name}${args}: ${this.typeToString(field.type)}${deprecated}`
    );
  }

  private addInputField(lines: string[], field: IntrospectionInputValue): void {
    if (field.description) {
      lines.push(`  """${field.description}"""`);
    }
    const defaultValue = field.defaultValue ? ` = ${field.defaultValue}` : '';
    lines.push(
      `  ${field.name}: ${this.typeToString(field.type)}${defaultValue}`
    );
  }

  private typeToString(type: IntrospectionTypeRef): string {
    if (type.kind === 'NON_NULL' && type.ofType) {
      return `${this.typeToString(type.ofType)}!`;
    }
    if (type.kind === 'LIST' && type.ofType) {
      return `[${this.typeToString(type.ofType)}]`;
    }
    return type.name || 'Unknown';
  }

  /**
   * Cache the schema to disk
   */
  private async cacheSchema(schema: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = join(this.schemaPath, '..');
      await fs.mkdir(dir, { recursive: true });

      // Write schema file
      await fs.writeFile(this.schemaPath, schema, 'utf-8');
    } catch (error) {
      console.error(
        'Warning: Could not cache schema to disk',
        error instanceof Error ? error.message : String(error)
      );
      // Don't throw - caching failure shouldn't break initialization
    }
  }

  /**
   * Parse schema and extract available root queries
   * This can be used to enhance tool descriptions
   */
  getAvailableQueries(): string[] {
    if (!this.schema) return [];

    const queries: string[] = [];
    // Match the Query type block
    const queryTypeRegex = /type Query\s*\{([\s\S]*?)\n\}/;
    const queryTypeMatch = this.schema.match(queryTypeRegex);

    if (queryTypeMatch && queryTypeMatch[1]) {
      const queryBlock = queryTypeMatch[1];
      // Match field names (word followed by optional args and colon)
      const fieldRegex = /^\s*(\w+)\s*(?:\([^)]*\))?\s*:/gm;
      let match;

      while ((match = fieldRegex.exec(queryBlock)) !== null) {
        queries.push(match[1]);
      }
    }

    return queries;
  }

  /**
   * Parse schema and extract available mutations
   * This can be used to enhance tool descriptions
   */
  getAvailableMutations(): string[] {
    if (!this.schema) return [];

    const mutations: string[] = [];
    // Match the Mutation type block
    const mutationTypeRegex = /type Mutation\s*\{([\s\S]*?)\n\}/;
    const mutationTypeMatch = this.schema.match(mutationTypeRegex);

    if (mutationTypeMatch && mutationTypeMatch[1]) {
      const mutationBlock = mutationTypeMatch[1];
      // Match field names (word followed by optional args and colon)
      const fieldRegex = /^\s*(\w+)\s*(?:\([^)]*\))?\s*:/gm;
      let match;

      while ((match = fieldRegex.exec(mutationBlock)) !== null) {
        mutations.push(match[1]);
      }
    }

    return mutations;
  }

  /**
   * Get a summary of available operations for tool descriptions
   */
  getOperationsSummary(): {
    queries: string[];
    mutations: string[];
    hasSchema: boolean;
  } {
    return {
      queries: this.getAvailableQueries(),
      mutations: this.getAvailableMutations(),
      hasSchema: this.hasSchema(),
    };
  }
}

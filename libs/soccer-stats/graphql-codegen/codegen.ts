import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:3333/api/graphql',
  documents: [
    '../../../apps/soccer-stats/ui/src/**/*.tsx',
    '../../../apps/soccer-stats/ui/src/**/*.ts',
    // Test-only documents (e.g. queries against a bare InMemoryCache)
    // aren't app operations and needn't match the API schema.
    '!../../../apps/soccer-stats/ui/src/**/*.spec.ts',
    '!../../../apps/soccer-stats/ui/src/**/*.spec.tsx',
  ],
  ignoreNoDocuments: true,
  generates: {
    // The API schema, so UI tests can validate operation variables built at
    // runtime (e.g. outbox actions) against it.
    './src/generated/schema.introspection.json': {
      plugins: ['introspection'],
      config: { minify: true },
    },
    './src/generated/': {
      preset: 'client',
      config: {
        // Use the default DocumentNode mode for Apollo Client compatibility
        // This generates proper TypedDocumentNode objects that work with Apollo Client
      },
    },
  },
  hooks: {
    afterOneFileWrite: ['prettier --write'],
  },
};

export default config;

import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:3333/api/graphql',
  documents: [
    '../../../apps/soccer-stats/ui/src/**/*.tsx',
    '../../../apps/soccer-stats/ui/src/**/*.ts',
  ],
  ignoreNoDocuments: true,
  generates: {
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

import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:3333/graphql',
  documents: ['src/**/*.tsx', 'src/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    './src/app/generated/': {
      preset: 'client',
      config: {
        // Remove documentMode: 'string' to use the default DocumentNode mode for Apollo Client
        // This generates proper TypedDocumentNode objects that work with Apollo Client
      },
    },
  },
  hooks: {
    afterOneFileWrite: ['prettier --write'],
  },
};

export default config;

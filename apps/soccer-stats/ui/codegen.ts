import { join } from 'node:path';

import { CodegenConfig } from '@graphql-codegen/cli';
import { workspaceRoot } from '@nx/devkit';

const config: CodegenConfig = {
  schema: join(workspaceRoot, './dist/apps/soccer-stats/api/schema.gql'),
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

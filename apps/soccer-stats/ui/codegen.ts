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
        documentMode: 'string',
      },
    },
  },
  hooks: {
    afterOneFileWrite: ['prettier --write'],
  },
};

export default config;

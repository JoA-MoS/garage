const {
  dirname,
  join
} = require("node:path");

import type { Options, StorybookConfig } from 'storybook/internal/common';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { rootMain } from '../../../../.storybook/main';

const config: StorybookConfig = {
  ...rootMain,
  core: { ...rootMain.core, builder: getAbsolutePath("webpack5") },

  stories: [
    ...rootMain.stories,
    '../src/lib/**/*.stories.mdx',
    '../src/lib/**/*.stories.@(js|jsx|ts|tsx)',
  ],

  addons: [...(rootMain.addons || [])],

  webpackFinal: async (config, { configType }: Options) => {
    // apply any global webpack configs that might have been specified in .storybook/main.ts
    if (rootMain.webpackFinal) {
      config = await rootMain.webpackFinal(config, { configType } as Options);
    }

    // add your own webpack tweaks if needed

    return config;
  },

  docs: {
    autodocs: true,
  },
};

module.exports = config;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

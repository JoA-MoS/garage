import type { StorybookConfig } from 'storybook/internal/common';

export const rootMain: StorybookConfig = {
  stories: [],
  // addons: [],
  // webpackFinal: async (config, { configType }) => {
  //   // Make whatever fine-grained changes you need that should apply to all storybook configs
  //   // Return the altered config
  //   return config;
  // },
};

export const framework = {
  name: '@storybook/angular',
  options: {},
};

export const docs = {
  autodocs: true,
};

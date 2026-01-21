const path = require('path');

const { composePlugins, withNx } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx({
    target: 'node',
  }),
  (config) => {
    // Add migration runner as a separate entry point
    // This creates run-migrations.js alongside main.js in the output
    const srcDir = path.join(__dirname, 'src');
    config.entry = {
      main: config.entry.main,
      'run-migrations': path.join(srcDir, 'run-migrations.ts'),
    };

    return config;
  },
);

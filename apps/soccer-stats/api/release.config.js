const name = 'soccer-stats-api';
const pathToRepoRoot = '../../..';

module.exports = {
  extends: `${pathToRepoRoot}/release.config.base.js`,
  tagFormat: name + '-v${version}',
  commitPaths: [
    `*`, // anything in this directory
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release-plus/docker',
      {
        name: {
          namespace: 'joamos',
          repository: name,
        },
      },
    ],
    '@semantic-release/github',
  ],
};

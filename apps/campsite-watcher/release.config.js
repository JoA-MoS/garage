const name = 'campsite-watcher';
const pathToRepoRoot = '../..';

module.exports = {
  extends: `${pathToRepoRoot}/release.config.base.js`,
  tagFormat: name + '-v${version}',
  commitPaths: [
    // REMOVING external dependencies to decrease unneeded releases and bad change logs
    // `${pathToRepoRoot}/workspace.json`,
    // `${pathToRepoRoot}/nx.json`,
    // `${pathToRepoRoot}/.nxignore`,
    // `${pathToRepoRoot}/package.json`,
    // `${pathToRepoRoot}/.prettierrc`,
    // `${pathToRepoRoot}/.prettierignore`,
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

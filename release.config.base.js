// release settings that are global for all releasable projects
module.exports = {
  branches: [
    '+([0-9])?(.{+([0-9]),x}).x',
    'main',
    'next',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true },
  ],
};

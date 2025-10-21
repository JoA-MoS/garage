import { GitLabClientConfig } from './types';

describe('types', () => {
  it('should have valid GitLabClientConfig interface', () => {
    const config: GitLabClientConfig = {
      gitlabUrl: 'https://gitlab.com',
      gitlabToken: 'test-token',
    };
    expect(config).toBeDefined();
    expect(config.gitlabUrl).toBe('https://gitlab.com');
    expect(config.gitlabToken).toBe('test-token');
  });
});

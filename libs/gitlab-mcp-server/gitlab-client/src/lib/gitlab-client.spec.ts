import { GitLabClient } from './gitlab-client';

describe('GitLabClient', () => {
  let client: GitLabClient;

  beforeEach(() => {
    client = new GitLabClient({
      gitlabUrl: 'https://gitlab.com',
      gitlabToken: 'test-token',
    });
  });

  it('should create an instance', () => {
    expect(client).toBeDefined();
  });

  it('should handle trailing slash in URL', () => {
    const clientWithSlash = new GitLabClient({
      gitlabUrl: 'https://gitlab.com/',
      gitlabToken: 'test-token',
    });
    expect(clientWithSlash).toBeDefined();
  });
});

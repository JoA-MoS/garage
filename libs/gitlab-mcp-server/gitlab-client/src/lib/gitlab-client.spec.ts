import { GitLabClient } from './gitlab-client';

describe('GitLabClient', () => {
  let client: GitLabClient;

  beforeEach(() => {
    client = new GitLabClient({
      gitlabUrl: 'https://gitlab.com',
      gitlabToken: 'test-token',
    });
  });

  it('should create an instance with Apollo Client', () => {
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(GitLabClient);
  });

  it('should handle trailing slash in URL', () => {
    const clientWithSlash = new GitLabClient({
      gitlabUrl: 'https://gitlab.com/',
      gitlabToken: 'test-token',
    });
    expect(clientWithSlash).toBeDefined();
    expect(clientWithSlash).toBeInstanceOf(GitLabClient);
  });

  it('should have getSchema method', () => {
    expect(typeof client.getSchema).toBe('function');
  });

  it('should have executeQuery method', () => {
    expect(typeof client.executeQuery).toBe('function');
  });

  it('should have executeMutation method', () => {
    expect(typeof client.executeMutation).toBe('function');
  });
});

import {
  AtlassianClientConfig,
  AtlassianIssue,
  AtlassianProject,
  AtlassianUser,
  AtlassianWorkspace,
  McpServerConfig,
} from './atlassian-types';

describe('atlassianTypes', () => {
  it('should define AtlassianClientConfig interface', () => {
    const config: AtlassianClientConfig = {
      atlassianUrl: 'https://api.atlassian.com',
      atlassianApiToken: 'test-token',
    };
    expect(config.atlassianUrl).toBe('https://api.atlassian.com');
    expect(config.atlassianApiToken).toBe('test-token');
  });

  it('should define McpServerConfig interface', () => {
    const config: McpServerConfig = {
      atlassianUrl: 'https://api.atlassian.com',
      atlassianApiToken: 'test-token',
    };
    expect(config.atlassianUrl).toBe('https://api.atlassian.com');
    expect(config.atlassianApiToken).toBe('test-token');
  });

  it('should define AtlassianIssue interface', () => {
    const issue: AtlassianIssue = {
      id: '1',
      key: 'TEST-1',
      summary: 'Test issue',
      created: '2024-01-01',
      updated: '2024-01-02',
    };
    expect(issue.id).toBe('1');
    expect(issue.key).toBe('TEST-1');
  });

  it('should define AtlassianProject interface', () => {
    const project: AtlassianProject = {
      id: '1',
      key: 'TEST',
      name: 'Test Project',
    };
    expect(project.id).toBe('1');
    expect(project.key).toBe('TEST');
  });

  it('should define AtlassianUser interface', () => {
    const user: AtlassianUser = {
      accountId: '123',
      displayName: 'Test User',
    };
    expect(user.accountId).toBe('123');
    expect(user.displayName).toBe('Test User');
  });

  it('should define AtlassianWorkspace interface', () => {
    const workspace: AtlassianWorkspace = {
      id: '1',
      name: 'Test Workspace',
      slug: 'test-workspace',
    };
    expect(workspace.id).toBe('1');
    expect(workspace.name).toBe('Test Workspace');
  });
});

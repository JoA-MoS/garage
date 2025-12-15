import { AtlassianClient } from './atlassian-client';

describe('AtlassianClient', () => {
  let client: AtlassianClient;

  beforeEach(() => {
    client = new AtlassianClient({
      atlassianUrl: 'https://api.atlassian.com',
      atlassianApiToken: 'test-token',
    });
  });

  it('should create an instance', () => {
    expect(client).toBeDefined();
  });

  it('should have executeQuery method', () => {
    expect(client.executeQuery).toBeDefined();
    expect(typeof client.executeQuery).toBe('function');
  });

  it('should have executeMutation method', () => {
    expect(client.executeMutation).toBeDefined();
    expect(typeof client.executeMutation).toBe('function');
  });
});

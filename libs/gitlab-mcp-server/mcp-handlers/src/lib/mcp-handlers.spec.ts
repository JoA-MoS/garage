import { registerMcpHandlers } from './mcp-handlers';

describe('mcpHandlers', () => {
  it('should be a function that registers schema-driven handlers', () => {
    expect(typeof registerMcpHandlers).toBe('function');
  });

  it('should accept server and gitlab client parameters', () => {
    expect(registerMcpHandlers.length).toBe(2);
  });
});

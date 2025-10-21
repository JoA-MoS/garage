import { registerMcpHandlers } from './mcp-handlers';

describe('mcpHandlers', () => {
  it('should be a function', () => {
    expect(typeof registerMcpHandlers).toBe('function');
  });
});

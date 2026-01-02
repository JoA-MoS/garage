/**
 * Shared proxy configuration for Vite dev and preview servers.
 *
 * This file is referenced by project.json's serve and preview targets via the
 * proxyConfig option. It provides a single source of truth for proxy settings
 * used in both development (nx serve) and preview (nx preview) modes.
 *
 * WebSocket proxying (ws: true) is enabled to support GraphQL subscriptions
 * through the Vite dev server.
 */
module.exports = {
  '/api': {
    target: 'http://localhost:3333',
    secure: false,
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying for GraphQL subscriptions
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        const target = `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`;
        console.log(`[Proxy] ${req.method} ${req.url} -> ${target}`);
      });
      proxy.on('proxyRes', (proxyRes, req) => {
        console.log(
          `[Proxy] ${req.method} ${req.url} <- ${proxyRes.statusCode}`
        );
      });
      proxy.on('error', (err, req) => {
        console.error(`[Proxy] ${req.method} ${req.url} ERROR:`, err.message);
      });
    },
  },
};

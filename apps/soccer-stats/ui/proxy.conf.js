/**
 * Vite proxy configuration with request logging
 */
module.exports = {
  '/api': {
    target: 'http://localhost:3333',
    secure: false,
    changeOrigin: true,
    // ws: false - WebSocket proxying is configured in vite.config.ts instead
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

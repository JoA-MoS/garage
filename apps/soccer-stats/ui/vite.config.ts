/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

const proxyConfig = {
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
          `[Proxy] ${req.method} ${req.url} <- ${proxyRes.statusCode}`,
        );
      });
      proxy.on('error', (err, req) => {
        console.error(`[Proxy] ${req.method} ${req.url} ERROR:`, err.message);
      });
    },
  },
};

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/apps/soccer-stats',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: proxyConfig,
  },
  preview: {
    port: 4200,
    host: 'localhost',
    proxy: proxyConfig,
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../../../dist/apps/soccer-stats',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/apps/soccer-stats',
      provider: 'v8' as const,
    },
  },
}));

/// <reference types='vitest' />
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

const rootPackage = JSON.parse(
  readFileSync(join(__dirname, '../../../package.json'), 'utf8'),
) as { version?: string };

function getGitSha(): string {
  if (process.env['VERCEL_GIT_COMMIT_SHA']) {
    return process.env['VERCEL_GIT_COMMIT_SHA'].slice(0, 7);
  }

  if (process.env['GITHUB_SHA']) {
    return process.env['GITHUB_SHA'].slice(0, 7);
  }

  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: join(__dirname, '../../../'),
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'local';
  }
}

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
  define: {
    __UI_VERSION__: JSON.stringify(rootPackage.version ?? '0.0.0'),
    __GIT_SHA__: JSON.stringify(getGitSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __APP_ENVIRONMENT__: JSON.stringify(process.env['NODE_ENV'] ?? 'unknown'),
  },
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

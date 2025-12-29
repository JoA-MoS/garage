import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { ExecutorContext, logger } from '@nx/devkit';

import { DeployExecutorSchema, VercelRewrite } from './schema';

/**
 * Convert Next.js-style path patterns to PCRE regex for Vercel Build Output API.
 * e.g., "/api/:path*" → "^/api/(.*)$"
 * e.g., "https://example.com/:path*" → "https://example.com/$1"
 */
function convertPathPattern(pattern: string, isDestination: boolean): string {
  if (isDestination) {
    // For destinations, replace :path* with $1 capture group reference
    return pattern.replace(/:path\*/, '$1');
  }
  // For sources, convert to PCRE regex with capture group
  // /api/:path* → ^/api/(.*)$
  const regexPattern = pattern.replace(/:path\*/, '(.*)');
  return `^${regexPattern}$`;
}

/**
 * Vercel Build Output API config for SPA routing.
 * Routes all requests to index.html except for static assets.
 * Rewrites are applied before the SPA fallback for API proxying.
 */
function createVercelConfig(rewrites?: VercelRewrite[]): object {
  const routes: object[] = [
    // Serve static files directly
    { handle: 'filesystem' },
  ];

  // Add rewrites before SPA fallback (for API proxying, etc.)
  if (rewrites && rewrites.length > 0) {
    for (const rewrite of rewrites) {
      routes.push({
        src: convertPathPattern(rewrite.source, false),
        dest: convertPathPattern(rewrite.destination, true),
      });
    }
  }

  // SPA fallback: route all other requests to index.html
  routes.push({ src: '^/(.*)$', dest: '/index.html' });

  return {
    version: 3,
    routes,
  };
}

/**
 * Deploy executor for Vercel.
 * Creates the Build Output API structure and deploys using --prebuilt.
 */
export default async function runExecutor(
  options: DeployExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  const { outputPath, prod = false } = options;

  // Get project info from context
  const projectName = context.projectName;
  if (!projectName) {
    logger.error('No project name found in executor context');
    return { success: false };
  }

  const projectConfig = context.projectsConfigurations?.projects[projectName];
  if (!projectConfig) {
    logger.error(`Project configuration not found for: ${projectName}`);
    return { success: false };
  }

  const workspaceRoot = context.root;
  // Put Vercel output in dist/deploy/{projectPath}/.vercel/output
  // Separate from build output to avoid recursive copy issues
  // Vercel CLI expects .vercel/output inside the deploy directory
  // e.g., apps/soccer-stats/ui → dist/deploy/apps/soccer-stats/ui/.vercel/output
  const vercelDeployDir = path.join(
    workspaceRoot,
    'dist',
    'deploy',
    projectConfig.root,
  );
  const vercelOutputDir = path.join(vercelDeployDir, '.vercel', 'output');
  const staticDir = path.join(vercelOutputDir, 'static');
  const buildOutputPath = path.join(workspaceRoot, outputPath);

  // Use options.projectName for Vercel project, fallback to Nx project name
  const vercelProjectName = options.projectName || projectName;

  logger.info(
    `Deploying ${projectName} to Vercel project "${vercelProjectName}"...`,
  );
  logger.info(`  Build output: ${buildOutputPath}`);
  logger.info(`  Vercel output: ${vercelOutputDir}`);
  logger.info(`  Production: ${prod}`);

  // Validate build output exists
  if (!fs.existsSync(buildOutputPath)) {
    logger.error(`Build output not found at: ${buildOutputPath}`);
    logger.error(
      'Make sure to run the build target first (dependsOn: ["build"])',
    );
    return { success: false };
  }

  try {
    // Clean and create .vercel/output directory
    if (fs.existsSync(vercelOutputDir)) {
      fs.rmSync(vercelOutputDir, { recursive: true });
    }
    fs.mkdirSync(staticDir, { recursive: true });

    // Copy build output to static directory
    logger.info('Copying build output to .vercel/output/static...');
    copyDirectory(buildOutputPath, staticDir);

    // Create config.json for Vercel Build Output API
    const configPath = path.join(vercelOutputDir, 'config.json');
    const vercelConfig = createVercelConfig(options.rewrites);
    fs.writeFileSync(configPath, JSON.stringify(vercelConfig, null, 2));
    logger.info('Created .vercel/output/config.json');
    if (options.rewrites && options.rewrites.length > 0) {
      logger.info(`  Configured ${options.rewrites.length} rewrite(s)`);
    }

    // Build vercel deploy command arguments
    // Pass the deploy directory as the first argument (contains .vercel/output)
    const vercelArgs = ['deploy', vercelDeployDir, '--prebuilt'];
    if (prod) {
      vercelArgs.push('--prod');
    }

    // Add token if provided (otherwise Vercel CLI uses env or logged-in session)
    const token = options.token || process.env['VERCEL_TOKEN'];
    if (token) {
      vercelArgs.push('--token', token);
    }

    // Add confirm flag to skip prompts in CI
    vercelArgs.push('--yes');

    // Log command with redacted token to avoid leaking credentials
    const argsForLogging = vercelArgs.map((arg, i) =>
      vercelArgs[i - 1] === '--token' ? '***' : arg,
    );
    logger.info(`Running: vercel ${argsForLogging.join(' ')}`);

    // Execute vercel deploy from workspace root
    const output = execFileSync('vercel', vercelArgs, {
      cwd: workspaceRoot,
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Pass through Vercel env vars if set
        VERCEL_ORG_ID: options.org || process.env['VERCEL_ORG_ID'],
        VERCEL_PROJECT_ID:
          options.projectId || process.env['VERCEL_PROJECT_ID'],
      },
    });

    // Extract deployment URL from output
    const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
    if (urlMatch) {
      logger.info(`Deployment URL: ${urlMatch[0]}`);
    }

    logger.info(`Successfully deployed ${projectName} to Vercel!`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Deployment failed: ${errorMessage}`);

    // If it's an exec error, try to get more details
    if (error && typeof error === 'object' && 'stderr' in error) {
      const stderr = (error as { stderr: Buffer | string }).stderr;
      if (stderr) {
        logger.error(`Vercel CLI error: ${stderr.toString()}`);
      }
    }

    return { success: false };
  }
}

/**
 * Recursively copy a directory.
 */
function copyDirectory(src: string, dest: string): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

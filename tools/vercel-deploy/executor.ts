import { ExecutorContext } from '@nx/devkit';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface VercelDeployExecutorSchema {
  project?: string;
  production?: boolean;
  token?: string;
  projectName?: string;
  orgId?: string;
  projectId?: string;
}

export default async function runExecutor(
  options: VercelDeployExecutorSchema,
  context: ExecutorContext
) {
  const projectName = options.project || context.projectName;
  
  if (!projectName) {
    throw new Error('Project name is required');
  }

  const projectConfig = context.workspace?.projects[projectName];
  if (!projectConfig) {
    throw new Error(`Project ${projectName} not found in workspace`);
  }

  console.log(`🚀 Deploying ${projectName} to Vercel...`);

  // Get project root
  const projectRoot = projectConfig.root;
  const workspaceRoot = context.root;
  const projectPath = join(workspaceRoot, projectRoot);

  // Create or update vercel.json if it doesn't exist
  const vercelConfigPath = join(projectPath, 'vercel.json');
  if (!existsSync(vercelConfigPath)) {
    const defaultConfig = createDefaultVercelConfig(projectName, projectConfig);
    writeFileSync(vercelConfigPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`📝 Created vercel.json for ${projectName}`);
  }

  // Build the project first
  console.log(`🔨 Building ${projectName}...`);
  try {
    execSync(`pnpm nx build ${projectName}`, {
      stdio: 'inherit',
      cwd: workspaceRoot,
    });
  } catch (error) {
    console.error(`❌ Build failed for ${projectName}`);
    return { success: false };
  }

  // Set up Vercel environment variables if provided
  const env = {
    ...process.env,
  };

  if (options.token) {
    env.VERCEL_TOKEN = options.token;
  }

  if (options.orgId) {
    env.VERCEL_ORG_ID = options.orgId;
  }

  if (options.projectId) {
    env.VERCEL_PROJECT_ID = options.projectId;
  }

  // Deploy to Vercel
  console.log(`🚀 Deploying to Vercel...`);
  try {
    const deployCommand = [
      'npx vercel',
      options.production ? '--prod' : '',
      '--yes', // Skip confirmation prompts
      '--cwd', projectPath,
    ].filter(Boolean).join(' ');

    execSync(deployCommand, {
      stdio: 'inherit',
      cwd: workspaceRoot,
      env,
    });

    console.log(`✅ Successfully deployed ${projectName} to Vercel`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Deployment failed for ${projectName}:`, error);
    return { success: false };
  }
}

function createDefaultVercelConfig(projectName: string, projectConfig: any) {
  const buildTarget = projectConfig.targets?.build;
  const outputPath = buildTarget?.options?.outputPath || `dist/apps/${projectName}`;
  
  // Determine framework based on project type
  let framework = 'static';
  if (projectConfig.projectType === 'application') {
    // Check if it's a React app
    if (buildTarget?.executor === '@nx/vite:build' || buildTarget?.executor === '@nx/webpack:webpack') {
      framework = 'vite';
    }
    // Check if it's an Angular app  
    if (buildTarget?.executor === '@angular-devkit/build-angular:browser' || 
        buildTarget?.executor === '@nx/angular:webpack-browser') {
      framework = 'static'; // Angular builds to static files
    }
  }

  return {
    buildCommand: `pnpm nx build ${projectName}`,
    outputDirectory: outputPath.startsWith('/') ? outputPath : `../../${outputPath}`,
    framework,
    installCommand: 'cd ../.. && pnpm install --frozen-lockfile --ignore-scripts',
    devCommand: `cd ../.. && pnpm nx serve ${projectName}`,
    rewrites: [
      { source: '/(.*)', destination: '/index.html' }
    ]
  };
}
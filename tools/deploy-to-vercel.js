#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

/**
 * Deploy Nx applications to Vercel
 * Usage: node deploy-to-vercel.js <project-name> [--production]
 */

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node deploy-to-vercel.js <project-name> [--production]');
    console.error('Example: node deploy-to-vercel.js soccer-stats');
    console.error('Example: node deploy-to-vercel.js soccer-stats --production');
    process.exit(1);
  }

  const projectName = args[0];
  const isProduction = args.includes('--production');
  const workspaceRoot = process.cwd();

  console.log(`🚀 Deploying ${projectName} to Vercel${isProduction ? ' (production)' : ' (preview)'}...`);

  // Read workspace configuration to get project info
  let projectConfig;
  try {
    // First try to read from nx.json projects configuration
    const nxConfig = JSON.parse(readFileSync(join(workspaceRoot, 'nx.json'), 'utf8'));
    
    // Look for the project in various possible locations
    const possiblePaths = [
      `apps/${projectName}/project.json`,
      `libs/${projectName}/project.json`,
      `apps/${projectName.replace('-ui', '')}/ui/project.json`,
      `apps/${projectName.replace('-ui', '')}/project.json`,
      `apps/ng/${projectName.replace('ng-', '')}/project.json`, // For ng-example
    ];
    
    for (const path of possiblePaths) {
      const fullPath = join(workspaceRoot, path);
      if (existsSync(fullPath)) {
        const config = JSON.parse(readFileSync(fullPath, 'utf8'));
        // Extract the directory path from the project.json location
        const projectDir = path.substring(0, path.lastIndexOf('/project.json'));
        projectConfig = { root: projectDir, ...config };
        console.log(`📁 Found project configuration at ${path}`);
        break;
      }
    }
    
    // If not found in standard locations, try reading all project.json files
    if (!projectConfig) {
      const { execSync } = require('child_process');
      try {
        const projectInfo = execSync(`pnpm nx show project ${projectName} --json`, { 
          cwd: workspaceRoot, 
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
        const parsedInfo = JSON.parse(projectInfo);
        projectConfig = parsedInfo;
        console.log(`📁 Found project via nx show: ${parsedInfo.root}`);
      } catch (nxError) {
        // Ignore nx errors and continue with manual search
      }
    }
  } catch (error) {
    console.error('❌ Failed to read workspace configuration:', error.message);
    process.exit(1);
  }

  if (!projectConfig) {
    console.error(`❌ Project ${projectName} not found in workspace`);
    process.exit(1);
  }

  const projectPath = join(workspaceRoot, projectConfig.root);
  
  // Create vercel.json if it doesn't exist
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
    process.exit(1);
  }

  // Deploy to Vercel
  console.log(`🚀 Deploying to Vercel...`);
  try {
    const deployCommand = [
      'npx vercel',
      isProduction ? '--prod' : '',
      '--yes', // Skip confirmation prompts
    ].filter(Boolean).join(' ');

    execSync(deployCommand, {
      stdio: 'inherit',
      cwd: projectPath,
    });

    console.log(`✅ Successfully deployed ${projectName} to Vercel`);
  } catch (error) {
    console.error(`❌ Deployment failed for ${projectName}`);
    process.exit(1);
  }
}

function createDefaultVercelConfig(projectName, projectConfig) {
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

if (require.main === module) {
  main();
}
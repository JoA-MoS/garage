#!/usr/bin/env node

/**
 * Deploy Nx applications to Vercel following best practices
 * Based on Vercel's official Nx monorepo documentation
 * Usage: node deploy-to-vercel.js <project-name> [--production]
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

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

  // Get project information using nx
  let projectRoot;
  try {
    const projectInfo = execSync(`pnpm nx show project ${projectName} --json`, { 
      cwd: workspaceRoot, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const project = JSON.parse(projectInfo);
    projectRoot = project.root;
    console.log(`📁 Found project at: ${projectRoot}`);
  } catch (error) {
    console.error(`❌ Project ${projectName} not found in workspace`);
    console.error('Available projects:');
    try {
      const projects = execSync('pnpm nx show projects', { cwd: workspaceRoot, encoding: 'utf8' });
      console.error(projects);
    } catch (e) {
      // Ignore error
    }
    process.exit(1);
  }

  const projectPath = join(workspaceRoot, projectRoot);
  
  // Ensure vercel.json exists with minimal configuration
  const vercelConfigPath = join(projectPath, 'vercel.json');
  if (!existsSync(vercelConfigPath)) {
    const config = createMinimalVercelConfig(projectName, projectRoot);
    writeFileSync(vercelConfigPath, JSON.stringify(config, null, 2));
    console.log(`📝 Created minimal vercel.json for ${projectName}`);
  }

  // Build the project from workspace root
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

  // Deploy from project directory (Vercel best practice for monorepos)
  console.log(`🚀 Deploying from project directory...`);
  try {
    const deployCommand = [
      'npx vercel',
      isProduction ? '--prod' : '',
      '--yes', // Skip confirmation prompts
      '--cwd', projectPath // Deploy from project directory
    ].filter(Boolean).join(' ');

    execSync(deployCommand, {
      stdio: 'inherit',
      cwd: workspaceRoot, // Run from workspace root but deploy project directory
    });

    console.log(`✅ Successfully deployed ${projectName} to Vercel`);
  } catch (error) {
    console.error(`❌ Deployment failed for ${projectName}`);
    console.error('Make sure you are logged in to Vercel CLI: npx vercel login');
    process.exit(1);
  }
}

/**
 * Create minimal vercel.json configuration following Vercel's Nx best practices
 * Let Vercel auto-detect framework and other settings when possible
 */
function createMinimalVercelConfig(projectName, projectRoot) {
  // Calculate relative path from project to workspace root
  const pathSegments = projectRoot.split('/').length;
  const workspaceRelative = '../'.repeat(pathSegments);
  
  return {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "buildCommand": `cd ${workspaceRelative} && pnpm nx build ${projectName}`,
    "outputDirectory": `${workspaceRelative}dist/${projectRoot}`,
    "installCommand": `cd ${workspaceRelative} && pnpm install --frozen-lockfile`,
    "framework": null, // Let Vercel auto-detect
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  };
}

if (require.main === module) {
  main();
}
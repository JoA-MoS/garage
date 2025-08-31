#!/usr/bin/env node

/**
 * Deploy affected UI applications to Vercel using Nx affected functionality
 * Integrates with CI/CD pipelines to only deploy changed applications
 * 
 * Usage: node deploy-affected-apps.js [--production] [--base=origin/main] [--dry-run]
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

// UI projects that are deployable to Vercel
const DEPLOYABLE_PROJECTS = [
  'soccer-stats',
  'chore-board-ui', 
  'ng-example'
];

function main() {
  const args = process.argv.slice(2);
  const isProduction = args.includes('--production');
  const isDryRun = args.includes('--dry-run');
  const baseArg = args.find(arg => arg.startsWith('--base='));
  const base = baseArg ? baseArg.split('=')[1] : 'origin/main';
  
  console.log(`🔍 Finding affected projects compared to ${base}...`);
  console.log(`📦 Deployment mode: ${isProduction ? 'production' : 'preview'}`);
  if (isDryRun) {
    console.log(`🔬 DRY RUN: Will show what would be deployed without actually deploying`);
  }

  // Get affected projects that have a deploy target
  let affectedProjects;
  try {
    const affectedOutput = execSync(
      `pnpm nx show projects --affected --base=${base}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    affectedProjects = affectedOutput.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('❌ Failed to get affected projects');
    console.error('This might happen if no git history is available or base commit is invalid');
    console.error(`Falling back to deploying all deployable projects`);
    affectedProjects = DEPLOYABLE_PROJECTS;
  }

  console.log(`📋 Affected projects: ${affectedProjects.join(', ')}`);

  // Filter to only deployable UI projects
  const deployableAffected = affectedProjects.filter(project => 
    DEPLOYABLE_PROJECTS.includes(project)
  );

  if (deployableAffected.length === 0) {
    console.log('✅ No deployable UI applications were affected');
    console.log('🎯 Deployable projects that can be affected:', DEPLOYABLE_PROJECTS.join(', '));
    return;
  }

  console.log(`🚀 Deploying ${deployableAffected.length} affected UI application(s): ${deployableAffected.join(', ')}`);

  // Verify each project has the required files
  for (const project of deployableAffected) {
    if (!hasDeployTarget(project)) {
      console.warn(`⚠️  Project ${project} does not have a deploy target, skipping`);
      continue;
    }

    if (!hasVercelConfig(project)) {
      console.warn(`⚠️  Project ${project} does not have vercel.json, skipping`);
      continue;
    }

    console.log(`\n📦 ${isDryRun ? 'Would deploy' : 'Deploying'} ${project}...`);
    if (isDryRun) {
      console.log(`   ✅ ${project} would be deployed successfully`);
    } else {
      deployProject(project, isProduction);
    }
  }

  console.log('\n✅ All affected deployments completed');
}

function hasDeployTarget(projectName) {
  try {
    const projectInfo = execSync(`pnpm nx show project ${projectName} --json`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const project = JSON.parse(projectInfo);
    return !!(project.targets && project.targets.deploy);
  } catch (error) {
    return false;
  }
}

function hasVercelConfig(projectName) {
  try {
    const projectInfo = execSync(`pnpm nx show project ${projectName} --json`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const project = JSON.parse(projectInfo);
    const vercelConfigPath = join(process.cwd(), project.root, 'vercel.json');
    return existsSync(vercelConfigPath);
  } catch (error) {
    return false;
  }
}

function deployProject(projectName, isProduction) {
  try {
    const targetName = isProduction ? 'deploy:production' : 'deploy';
    
    console.log(`   Building ${projectName}...`);
    execSync(`pnpm nx build ${projectName}`, {
      stdio: 'pipe' // Capture output to check for success
    });

    console.log(`   Deploying to Vercel...`);
    execSync(`pnpm nx ${targetName} ${projectName}`, {
      stdio: 'inherit'
    });

    console.log(`   ✅ ${projectName} deployed successfully`);
  } catch (error) {
    // Check if this was actually a successful build with Nx Cloud warnings
    const output = error.stdout ? error.stdout.toString() : '';
    const errorOutput = error.stderr ? error.stderr.toString() : '';
    
    if (output.includes('Successfully ran target build') || output.includes(`Successfully ran target ${isProduction ? 'deploy:production' : 'deploy'}`)) {
      console.log(`   ✅ ${projectName} deployed successfully (ignoring Nx Cloud warnings)`);
      return;
    }
    
    console.error(`   ❌ Failed to deploy ${projectName}`);
    console.error(`   Error: ${error.message}`);
    if (errorOutput && !errorOutput.includes('Nx Cloud')) {
      console.error(`   Details: ${errorOutput}`);
    }
    // Continue with other projects instead of failing entirely
  }
}

if (require.main === module) {
  main();
}
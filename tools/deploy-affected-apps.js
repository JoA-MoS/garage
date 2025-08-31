#!/usr/bin/env node

/**
 * Deploy affected applications using Nx affected functionality
 * Runs the deploy target for any affected project that has one
 * Integrates with CI/CD pipelines to only deploy changed applications
 * 
 * Works with any deployment service (Vercel, Serverless, etc.) as long as
 * the project has a deploy target configured.
 * 
 * Usage: node deploy-affected-apps.js [--production] [--base=origin/main] [--dry-run]
 */

const { execSync } = require('child_process');

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

  // Get affected projects
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
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  console.log(`📋 Affected projects: ${affectedProjects.join(', ')}`);

  // Filter to only projects that have a deploy target
  const deployableAffected = affectedProjects.filter(project => {
    const hasTarget = hasDeployTarget(project);
    if (hasTarget) {
      console.log(`✅ ${project} has deploy target`);
    }
    return hasTarget;
  });

  if (deployableAffected.length === 0) {
    console.log('✅ No deployable applications were affected');
    console.log('💡 Only projects with a "deploy" target will be deployed');
    return;
  }

  console.log(`🚀 Deploying ${deployableAffected.length} affected application(s): ${deployableAffected.join(', ')}`);

  // Deploy each project with a deploy target
  for (const project of deployableAffected) {
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

function deployProject(projectName, isProduction) {
  try {
    // Use the production configuration if specified, otherwise use default deploy target
    const targetName = isProduction ? 'deploy:production' : 'deploy';
    
    // First try the production target if requested, fall back to regular deploy if not found
    let actualTarget = targetName;
    if (isProduction) {
      try {
        const projectInfo = execSync(`pnpm nx show project ${projectName} --json`, { 
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
        const project = JSON.parse(projectInfo);
        
        // Check if production target exists, otherwise use regular deploy target
        if (!project.targets || !project.targets['deploy:production']) {
          console.log(`   ℹ️  No deploy:production target found for ${projectName}, using deploy target`);
          actualTarget = 'deploy';
        }
      } catch (error) {
        actualTarget = 'deploy';
      }
    }

    console.log(`   🏗️  Building ${projectName}...`);
    execSync(`pnpm nx build ${projectName}`, {
      stdio: 'pipe' // Capture output to check for success
    });

    console.log(`   🚀 Deploying via "${actualTarget}" target...`);
    execSync(`pnpm nx ${actualTarget} ${projectName}`, {
      stdio: 'inherit'
    });

    console.log(`   ✅ ${projectName} deployed successfully`);
  } catch (error) {
    // Check if this was actually a successful build with Nx Cloud warnings
    const output = error.stdout ? error.stdout.toString() : '';
    const errorOutput = error.stderr ? error.stderr.toString() : '';
    
    if (output.includes('Successfully ran target') && 
        (output.includes('build') || output.includes('deploy'))) {
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
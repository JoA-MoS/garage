# CI/CD Deployment Guide

This guide covers the automated deployment system for applications in the garage monorepo using Nx affected functionality.

## Overview

The CI/CD system automatically deploys only the applications that have been changed (affected) using Nx's intelligent dependency graph analysis. This ensures efficient deployments and reduces unnecessary build times.

**Key Feature**: The system is service-agnostic and works with any deployment service (Vercel, Serverless, etc.) as long as the project has a `deploy` target configured.

## Deployment Strategy

### When Deployments Happen

1. **Preview Deployments**: On every pull request
   - Deploys affected applications with deploy targets to their respective services
   - Each PR gets unique preview URLs for testing (service-dependent)

2. **Production Deployments**: On push to main/alpha/beta/next branches
   - Deploys affected applications to production environments
   - Only runs after all tests and builds pass

### Affected Detection

The system uses `nx affected` to identify which applications need deployment by:
- Comparing against the base branch (main for PRs, previous commit for pushes)
- Analyzing the dependency graph to understand impact
- Only deploying applications that have actual changes AND a deploy target

## Deployable Applications

Any project with a `deploy` target will be automatically included in CI/CD deployments. Currently configured:

- **soccer-stats** - React/Vite soccer tracking application (→ Vercel)
- **chore-board-ui** - React chore management interface (→ Vercel)
- **ng-example** - Angular example application (→ Vercel)
- **campsite-watcher-lambda** - Serverless monitoring service (→ AWS Lambda)

### Adding New Deployable Projects

To make any project deployable via CI/CD:
1. Add a `deploy` target to the project's configuration
2. Optionally add a `deploy:production` target for production-specific settings
3. The system will automatically detect and deploy the project when affected

## Required Secrets

Configure these secrets in your GitHub repository settings:

### Vercel Authentication
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-organization-id
VERCEL_PROJECT_ID=your-project-id (optional, can be auto-detected)
```

### Getting Vercel Secrets
1. **VERCEL_TOKEN**: Get from [Vercel Dashboard → Settings → Tokens](https://vercel.com/account/tokens)
2. **VERCEL_ORG_ID**: Found in your team settings or use `vercel teams ls`
3. **VERCEL_PROJECT_ID**: Auto-detected from vercel.json or use `vercel projects ls`

## Manual Deployment

### Deploy Affected Applications Locally
```bash
# Deploy affected apps (preview mode)
node tools/deploy-affected-apps.js

# Deploy affected apps (production mode)
node tools/deploy-affected-apps.js --production

# Deploy with specific base for comparison
node tools/deploy-affected-apps.js --base=origin/main
```

### Deploy Specific Application
```bash
# Preview deployment
pnpm nx deploy soccer-stats
pnpm nx deploy chore-board-ui
pnpm nx deploy ng-example

# Production deployment
pnpm nx deploy:production soccer-stats
pnpm nx deploy:production chore-board-ui
pnpm nx deploy:production ng-example
```

## Adding New Applications

To add deployment support for a new UI application:

### 1. Create vercel.json
Create `apps/your-app/vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm nx build your-app",
  "outputDirectory": "../../dist/apps/your-app",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. Add Deploy Targets
Add to your `project.json`:
```json
{
  "targets": {
    "deploy": {
      "dependsOn": ["build"],
      "executor": "nx:run-commands",
      "options": {
        "command": "node ../../tools/deploy-to-vercel.js your-app"
      }
    },
    "deploy:production": {
      "dependsOn": ["build"],
      "executor": "nx:run-commands",
      "options": {
        "command": "node ../../tools/deploy-to-vercel.js your-app --production"
      }
    }
  }
}
```

### 3. Update Deployment Script
Add your project to `DEPLOYABLE_PROJECTS` in `tools/deploy-affected-apps.js`:
```javascript
const DEPLOYABLE_PROJECTS = [
  'soccer-stats',
  'chore-board-ui',
  'ng-example',
  'your-app'  // Add here
];
```

## Vercel GitHub App Integration

### Managing Conflicts with GitHub App

If you have the [Vercel GitHub App](https://github.com/apps/vercel) installed, it may conflict with this CI/CD system by:
- Creating duplicate deployments
- Overriding custom configuration
- Deploying on every commit instead of using affected logic

### Option 1: Disable for Specific Repository (Recommended)
1. Go to your [GitHub App installations](https://github.com/settings/installations)
2. Find "Vercel" and click "Configure"
3. Under "Repository access", select "Selected repositories"
4. Remove this repository from the list
5. Save changes

### Option 2: Configure GitHub App to Skip CI Builds
Add to your `vercel.json` files:
```json
{
  "github": {
    "enabled": false
  }
}
```

### Option 3: Use Branch Protection
Configure the GitHub App to only deploy from specific branches and use CI for others.

## Troubleshooting

### Common Issues

**No Deployments Happening**
- Check if any UI applications were actually affected
- Verify secrets are configured correctly
- Check GitHub Actions logs for specific errors

**Authentication Errors**
- Verify VERCEL_TOKEN is valid and not expired
- Ensure token has sufficient permissions for your team/projects

**Build Failures**
- Check that applications build successfully locally
- Verify all dependencies are correctly specified
- Review build logs in GitHub Actions

**Affected Detection Issues**
- Ensure git history is available (fetch-depth: 0)
- Check that base branch/commit exists
- Verify nx configuration is correct

### Debug Commands

```bash
# Check which projects would be affected
pnpm nx show projects --affected --base=origin/main

# Test deployment script locally
node tools/deploy-affected-apps.js --base=HEAD~1

# Validate project configuration
pnpm nx show project soccer-stats
```

## Benefits of This Approach

1. **Efficient**: Only deploys applications that have changes
2. **Reliable**: Uses Nx's dependency graph for accurate change detection
3. **Fast**: Parallel deployments and smart caching
4. **Flexible**: Supports both preview and production deployments
5. **Scalable**: Easy to add new applications to the deployment pipeline

## Integration with Nx Cloud

This deployment system works seamlessly with Nx Cloud for:
- Distributed task execution
- Intelligent caching
- Build insights and analytics
- Remote task coordination

The deployment jobs run independently after the main CI jobs complete, ensuring they don't interfere with distributed execution.
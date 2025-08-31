# Vercel Deployment Guide

This guide explains how to deploy applications from the garage monorepo to Vercel.

## Quick Start

### Deploy Soccer Stats App

```bash
# Deploy to preview (staging)
pnpm nx deploy soccer-stats

# Deploy to production
pnpm nx deploy:production soccer-stats
```

### Deploy Any UI Application

```bash
# Using the deployment script directly
node tools/deploy-to-vercel.js <project-name>
node tools/deploy-to-vercel.js <project-name> --production

# Examples:
node tools/deploy-to-vercel.js chore-board-ui
node tools/deploy-to-vercel.js chore-board-ui --production
node tools/deploy-to-vercel.js ng-example
```

## Setup Requirements

### 1. Install Vercel CLI

The Vercel CLI is already included as a dev dependency in the workspace.

### 2. Authentication

You need to authenticate with Vercel. Choose one of these methods:

#### Option A: Login via CLI
```bash
npx vercel login
```

#### Option B: Use Token (CI/CD)
```bash
export VERCEL_TOKEN=your_token_here
```

#### Option C: Use Environment Variables
```bash
export VERCEL_ORG_ID=your_org_id
export VERCEL_PROJECT_ID=your_project_id  
export VERCEL_TOKEN=your_token
```

## How It Works

### Automatic Configuration

The deployment script automatically:

1. **Detects Project Type**: Identifies if the project is React/Vite, Angular, or other
2. **Creates vercel.json**: Generates appropriate Vercel configuration if none exists
3. **Builds Project**: Runs `pnpm nx build <project-name>` 
4. **Deploys**: Uses Vercel CLI to deploy the built application

### Generated vercel.json

For React/Vite applications (like soccer-stats):
```json
{
  "buildCommand": "pnpm nx build soccer-stats",
  "outputDirectory": "../../dist/apps/soccer-stats",
  "framework": "vite",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile --ignore-scripts",
  "devCommand": "cd ../.. && pnpm nx serve soccer-stats",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

For Angular applications:
```json
{
  "buildCommand": "pnpm nx build ng-example",
  "outputDirectory": "../../dist/apps/ng-example",
  "framework": "static",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile --ignore-scripts",
  "devCommand": "cd ../.. && pnpm nx serve ng-example",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Adding Deployment to New Projects

### Method 1: Use the Script Directly

Any UI application in the workspace can be deployed using:
```bash
node tools/deploy-to-vercel.js <project-name>
```

### Method 2: Add Deployment Targets

Add these targets to your project's `project.json`:

```json
{
  "targets": {
    "deploy": {
      "command": "node ../../tools/deploy-to-vercel.js <project-name>",
      "dependsOn": ["build"]
    },
    "deploy:production": {
      "command": "node ../../tools/deploy-to-vercel.js <project-name> --production", 
      "dependsOn": ["build"]
    }
  }
}
```

Then use:
```bash
pnpm nx deploy <project-name>
pnpm nx deploy:production <project-name>
```

## Supported Project Types

- **React Applications** (Vite, Webpack)
- **Angular Applications** 
- **Static Sites**
- **Any buildable UI application**

## Environment Variables

Set these environment variables for CI/CD or automated deployment:

```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_organization_id  
VERCEL_PROJECT_ID=your_project_id
```

## Troubleshooting

### Build Failures

If build fails, check:
1. Dependencies are installed: `pnpm install`
2. Project builds locally: `pnpm nx build <project-name>`
3. Check build output path in project.json

### Deployment Failures

Common issues:
1. **Authentication**: Make sure you're logged in (`npx vercel login`)
2. **Project not found**: Create project in Vercel dashboard first
3. **Build command**: Verify the build command works in project directory

### Custom Configuration

To customize the Vercel deployment:

1. Create/edit `vercel.json` in your project directory
2. Modify build commands, output directories, or framework settings
3. Add environment variables or custom rewrites

## Example Applications

### Soccer Stats
- **Type**: React + Vite
- **Command**: `pnpm nx deploy soccer-stats`
- **URL**: Will be provided after deployment

### Chore Board UI  
- **Type**: React + Vite
- **Command**: `node tools/deploy-to-vercel.js chore-board-ui`

### Angular Example
- **Type**: Angular
- **Command**: `node tools/deploy-to-vercel.js ng-example`

## Integration with CI/CD

Add to your GitHub Actions or CI pipeline:

```yaml
- name: Deploy to Vercel
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  run: |
    node tools/deploy-to-vercel.js soccer-stats --production
```
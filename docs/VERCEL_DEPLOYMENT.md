# Vercel Deployment Guide for Nx Monorepos

This guide explains how to deploy applications from the garage monorepo to Vercel following [Vercel's official Nx monorepo best practices](https://vercel.com/docs/monorepos/nx).

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

#### Option A: Login via CLI (Recommended)
```bash
npx vercel login
```

#### Option B: Use Token (CI/CD)
```bash
export VERCEL_TOKEN=your_token_here
```

#### Option C: Use Environment Variables (Team Projects)
```bash
export VERCEL_ORG_ID=your_org_id
export VERCEL_PROJECT_ID=your_project_id  
export VERCEL_TOKEN=your_token
```

## How It Works

### Following Vercel's Nx Best Practices

Our implementation follows [Vercel's recommended patterns](https://vercel.com/docs/monorepos/nx) for Nx monorepos:

1. **Minimal Configuration**: Uses Vercel's auto-detection capabilities instead of complex custom logic
2. **Project-based Deployment**: Deploys from individual project directories as recommended
3. **Nx Integration**: Leverages Vercel's built-in Nx workspace support
4. **Standard Commands**: Uses conventional build commands that Vercel recognizes

### Deployment Process

The deployment script automatically:

1. **Locates Project**: Uses `nx show project` to find the project configuration
2. **Creates Minimal vercel.json**: Generates configuration only when needed, letting Vercel auto-detect framework
3. **Builds Project**: Runs `pnpm nx build <project-name>` from workspace root
4. **Deploys**: Uses Vercel CLI from project directory (following Vercel's monorepo best practices)

### Generated vercel.json

Following Vercel's recommendations, we use minimal configuration with auto-detection:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm nx build soccer-stats",
  "outputDirectory": "../../dist/apps/soccer-stats",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Key improvements following Vercel's guidelines:
- **`framework: null`**: Let Vercel auto-detect the framework instead of manual specification
- **Removed `devCommand`**: Not needed for deployment, simplifies configuration
- **Standard paths**: Use conventional relative paths that Vercel expects
- **Schema reference**: Include Vercel's JSON schema for validation

## Adding Deployment to New Projects

### Method 1: Use the Script Directly (Recommended)

Any UI application in the workspace can be deployed using:
```bash
node tools/deploy-to-vercel.js <project-name>
```

The script will automatically:
- Detect the project using Nx
- Create minimal vercel.json if needed
- Build and deploy following Vercel's patterns

### Method 2: Add Deployment Targets

Add these targets to your project's `project.json`:

```json
{
  "targets": {
    "deploy": {
      "command": "node ../../tools/deploy-to-vercel.js {projectName}",
      "dependsOn": ["build"]
    },
    "deploy:production": {
      "command": "node ../../tools/deploy-to-vercel.js {projectName} --production", 
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

Following Vercel's Nx integration, these project types are supported:

- **React Applications** (Vite, Webpack) - Auto-detected by Vercel
- **Angular Applications** - Auto-detected by Vercel
- **Next.js Applications** - Native Vercel support
- **Static Sites** - Universal support
- **Any buildable UI application** - With minimal configuration

## Environment Variables for CI/CD

Set these environment variables for automated deployment:

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
3. Project exists: `pnpm nx show project <project-name>`

### Deployment Failures

Common issues:
1. **Authentication**: Make sure you're logged in (`npx vercel login`)
2. **Project not found**: Let Vercel create the project automatically or create it in dashboard
3. **Build command**: The script uses Nx commands that should work from any project

### Vercel Auto-Detection Issues

If Vercel doesn't detect your framework correctly:
1. Check that your project has standard file structure
2. Verify `package.json` has appropriate dependencies
3. Add framework hint to `vercel.json` if needed

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

## Additional Resources

- [Vercel Nx Monorepo Documentation](https://vercel.com/docs/monorepos/nx)
- [Nx React Deployment Guide](https://nx.dev/technologies/react/recipes/deploy-nextjs-to-vercel)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
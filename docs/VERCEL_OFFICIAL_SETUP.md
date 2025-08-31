# Vercel Official Nx Monorepo Setup

This guide implements Vercel's official recommendations for deploying multiple applications from an Nx monorepo with affected-only builds.

## Overview

This setup uses Vercel's native monorepo support with `nx-ignore` to automatically deploy only affected applications when changes are made, following [Vercel's official Nx documentation](https://vercel.com/docs/monorepos/nx).

## Key Benefits

- ✅ **Official Vercel Support**: Uses Vercel's native Nx monorepo features
- ✅ **Affected Builds Only**: Automatically builds only changed applications
- ✅ **Zero Configuration**: Leverages Vercel's auto-detection capabilities
- ✅ **Remote Caching**: Uses `@vercel/remote-nx` for optimized builds
- ✅ **Framework Agnostic**: Works with React, Angular, Next.js, and other frameworks

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Integration**: Connect your GitHub repository to Vercel
3. **Nx Workspace**: This setup is already configured in the workspace

## Workspace Configuration

The workspace is already configured with:

### 1. Remote Caching Setup

```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@vercel/remote-nx",
      "options": {
        "cacheDirectory": "/tmp/nx-cache"
      }
    }
  }
}
```

### 2. Package Installation

```json
// package.json devDependencies
{
  "@vercel/remote-nx": "^2.0.0"
}
```

## Vercel Project Setup

For each application you want to deploy, follow these steps:

### Step 1: Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository (`JoA-MoS/garage`)
4. **Important**: Do NOT choose a root directory - leave it as workspace root
5. Select appropriate framework preset:
   - **React/Vite Apps**: Choose "Create React App" or "Vite" preset
   - **Angular Apps**: Choose "Angular" preset
   - **Next.js Apps**: Choose "Next.js" preset

### Step 2: Configure Build Settings

For each project, override the build settings:

#### React/Vite Applications (soccer-stats, chore-board-ui)

**Build Command:**
```bash
npx nx build soccer-stats --prod
```

**Output Directory:**
```
dist/apps/soccer-stats
```

**Install Command:**
```bash
pnpm install --frozen-lockfile
```

#### Angular Applications (ng-example)

**Build Command:**
```bash
npx nx build ng-example --prod
```

**Output Directory:**
```
dist/apps/ng/example
```

**Install Command:**
```bash
pnpm install --frozen-lockfile
```

### Step 3: Enable Affected Builds

This is the key feature that makes only affected apps build:

1. Go to **Project Settings** → **Git**
2. In **"Ignored Build Step"** field, enter:
   ```bash
   npx nx-ignore <app-name>
   ```

**Examples:**
- For soccer-stats: `npx nx-ignore soccer-stats`
- For chore-board-ui: `npx nx-ignore chore-board-ui`
- For ng-example: `npx nx-ignore ng-example`

### Step 4: Environment Variables (if needed)

Set any required environment variables in **Project Settings** → **Environment Variables**.

## Current Applications Ready for Deployment

| Application | Type | Build Command | Output Directory | nx-ignore Command |
|------------|------|---------------|------------------|-------------------|
| soccer-stats | React/Vite | `npx nx build soccer-stats --prod` | `dist/apps/soccer-stats` | `npx nx-ignore soccer-stats` |
| chore-board-ui | React/Vite | `npx nx build chore-board-ui --prod` | `dist/apps/chore-board/ui` | `npx nx-ignore chore-board-ui` |
| ng-example | Angular | `npx nx build ng-example --prod` | `dist/apps/ng/example` | `npx nx-ignore ng-example` |

## How It Works

### Automatic Affected Detection

When you push changes to GitHub:

1. **Vercel receives the webhook** from GitHub
2. **nx-ignore runs** and checks if the specific app is affected by the changes
3. **If affected**: Vercel proceeds with the build and deployment
4. **If not affected**: Vercel skips the build (shows "Build skipped")

### Dependency Graph Awareness

The `nx-ignore` command understands your Nx dependency graph:
- If you change a shared library, all dependent apps will build
- If you change an app-specific file, only that app will build
- If you change workspace configuration, all apps may build

## Testing the Setup

### Test Affected Builds Locally

```bash
# Check which projects would be affected by current changes
npx nx show projects --affected

# Test what nx-ignore would return for a specific app
npx nx-ignore soccer-stats
# Returns: exit code 0 (build) or 1 (skip)
```

### Verify Remote Caching

```bash
# Build once
npx nx build soccer-stats

# Build again - should use cache
npx nx build soccer-stats
# Should show cache hit in output
```

## Troubleshooting

### Build Issues

**Problem**: Vercel build fails with module not found
**Solution**: Ensure `pnpm install --frozen-lockfile` is set as install command

**Problem**: Wrong files being built
**Solution**: Verify the output directory matches your app's build output

### Affected Detection Issues

**Problem**: App builds when it shouldn't (or vice versa)
**Solution**: 
- Check the `nx-ignore` command is correct for your app name
- Verify your changes actually affect (or don't affect) the app using `npx nx show projects --affected`

**Problem**: All apps always build
**Solution**: Ensure you're not modifying workspace-level files that affect all projects

### Remote Caching Issues

**Problem**: Cache not working
**Solution**: Verify `@vercel/remote-nx` is installed and configured in `nx.json`

## Migration from Custom Deployment

If you were previously using custom deployment scripts:

1. ✅ **Remove deploy targets** from `project.json` files (already done)
2. ✅ **Remove custom scripts** like `deploy-to-vercel.js` (already done)
3. ✅ **Remove GitHub Actions deployment job** (already done)
4. ✅ **Set up Vercel projects** following this guide
5. ✅ **Test affected builds** work correctly

## Benefits Over Custom Deployment

| Aspect | Custom Scripts | Vercel Official |
|--------|---------------|-----------------|
| **Maintenance** | Requires custom code maintenance | Zero maintenance - Vercel handles it |
| **Framework Support** | Manual detection and configuration | Automatic framework detection |
| **Build Optimization** | Custom caching logic | Native Vercel + Nx caching |
| **Error Handling** | Custom error handling required | Vercel's robust error handling |
| **Monitoring** | Custom logging and monitoring | Native Vercel deployment monitoring |
| **Preview Deployments** | Complex PR setup required | Automatic preview deployments |

## References

- [Vercel Nx Monorepo Documentation](https://vercel.com/docs/monorepos/nx)
- [Nx Deploy to Vercel Recipe](https://nx.dev/technologies/react/recipes/deploy-nextjs-to-vercel)
- [@vercel/remote-nx Documentation](https://www.npmjs.com/package/@vercel/remote-nx)
- [nx-ignore CLI Tool](https://www.npmjs.com/package/nx-ignore)
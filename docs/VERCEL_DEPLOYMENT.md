
**⚠️ IMPORTANT: This document describes the previous custom deployment approach. For the current recommended setup, see [Vercel Official Setup Guide](VERCEL_OFFICIAL_SETUP.md).**

## Current Recommended Approach

**🎯 Use Vercel's Official Nx Monorepo Support**: We now use Vercel's native monorepo features with `nx-ignore` for affected builds. This provides:

- ✅ **Zero maintenance** - Vercel handles everything
- ✅ **Automatic affected detection** with `nx-ignore`
- ✅ **Native framework detection** by Vercel
- ✅ **Remote caching** with `@vercel/remote-nx`
- ✅ **Official support** and future updates

**📖 Complete Setup Guide**: See [Vercel Official Setup Guide](VERCEL_OFFICIAL_SETUP.md) for step-by-step instructions.

## Migration Path

If you were using the previous custom deployment system:

1. **Follow the official setup** in [VERCEL_OFFICIAL_SETUP.md](VERCEL_OFFICIAL_SETUP.md)
2. **Create Vercel projects** for each app with proper build settings
3. **Configure nx-ignore** for affected builds
4. **Remove old deploy targets** (already done in this workspace)

## Quick Reference

### Applications Ready for Deployment

| Application | Type | Framework Preset | Build Command | Output Directory |
|------------|------|------------------|---------------|------------------|
| soccer-stats | React/Vite | Vite | `npx nx build soccer-stats --prod` | `dist/apps/soccer-stats` |
| chore-board-ui | React/Vite | Vite | `npx nx build chore-board-ui --prod` | `dist/apps/chore-board/ui` |
| ng-example | Angular | Angular | `npx nx build ng-example --prod` | `dist/apps/ng/example` |

### nx-ignore Commands

For each Vercel project, set the **Ignored Build Step** to:
- Soccer Stats: `npx nx-ignore soccer-stats`
- Chore Board UI: `npx nx-ignore chore-board-ui`
- Angular Example: `npx nx-ignore ng-example`

## Benefits of Official Approach

| Aspect | Previous Custom Scripts | Vercel Official |
|--------|------------------------|-----------------|
| **Maintenance** | Required custom code maintenance | Zero maintenance |
| **Framework Support** | Manual detection and configuration | Automatic framework detection |
| **Build Optimization** | Custom caching logic | Native Vercel + Nx caching |
| **Affected Detection** | Custom GitHub Actions job | Built-in with nx-ignore |
| **Error Handling** | Custom error handling | Vercel's robust error handling |
| **Monitoring** | Custom logging | Native Vercel deployment monitoring |

## Resources

- **📖 [Official Setup Guide](VERCEL_OFFICIAL_SETUP.md)** - Complete implementation guide
- **📚 [Vercel Nx Documentation](https://vercel.com/docs/monorepos/nx)** - Official Vercel docs
- **🔧 [Nx Vercel Recipe](https://nx.dev/technologies/react/recipes/deploy-nextjs-to-vercel)** - Nx.dev guide
# Garage - Nx Monorepo

Garage is an Nx monorepo containing multiple applications and libraries including React UIs, Angular apps, Node.js services, NestJS APIs, and AWS Lambda functions. The workspace uses pnpm for package management and supports Docker containerization for deployment.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Additional Instructions & Standards

This workspace includes several detailed instruction files that provide specific guidance for different aspects of development. **Always follow these standards when working in this repository:**

### Core Standards & Patterns

- **[Coding Standards & Best Practices](.github/instructions/coding-standards.instructions.md)** - General principles, architecture patterns, code quality standards, and documentation requirements
- **[File Naming Conventions](.github/instructions/file-naming-conventions.instructions.md)** - Consistent naming patterns for files, directories, components, and other assets
- **[React Component Patterns](.github/instructions/react-component-patterns.instructions.md)** - Smart/Presentation component pattern, custom hooks, composition guidelines, and testing strategies

### Development Integration

- **[Copilot Integration Standards](.github/instructions/copilot-integration.instructions.md)** - Specific guidance for GitHub Copilot code generation, templates, and workspace-specific patterns
- **[Nx Workspace Guidelines](.github/instructions/nx.instructions.md)** - Nx-specific workflows, generators, task management, and CI integration

**When generating code or making architectural decisions, always reference the relevant instruction files above to ensure consistency with established patterns.**

## File Organization & Generated Content

### Generated Files Directory Structure

When creating files that are generated, temporary, or outputs from tools/commands, use these established directories:

- **`/dist/`** - Build outputs and compiled code (e.g., webpack bundles, compiled TypeScript)
- **`/tmp/`** - Temporary files and scratch work (e.g., intermediate processing files, cache)
- **`/docs/generated/`** - Generated documentation, reports, and reference files (e.g., API docs, coverage reports, dependency graphs)
- **`/artifacts/`** - Generated artifacts like graphs, schemas, and analysis outputs (e.g., project graphs, database schemas, performance reports)

### Generated File Naming Convention

- Use `.generated.` in the filename for any programmatically created file (e.g., `api-schema.generated.json`, `dependency-graph.generated.html`)
- Place generated files in appropriate directories above rather than mixing with source code
- Generated files are automatically ignored by git (see `.gitignore`)

### Examples of Proper File Placement

```
✅ /docs/generated/api-documentation.html
✅ /artifacts/project-graph.generated.json
✅ /tmp/processing-cache.json
✅ /dist/soccer-stats/main.js

❌ /src/generated-schema.json (should be in /artifacts/)
❌ /apps/soccer-stats/build-output.html (should be in /dist/)
❌ /documentation.generated.md (should be in /docs/generated/)
```

## Working Effectively

### Environment Setup

- Install Node.js v24.4.1: Use nvm or fnm to install the exact version specified in `.nvmrc`

  **Option 1: Using nvm**

  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install && nvm use
  ```

  **Option 2: Using fnm (Fast Node Manager)**

  ```bash
  curl -fsSL https://fnm.vercel.app/install | bash
  source ~/.bashrc
  fnm install && fnm use
  ```

- Enable corepack for pnpm: `corepack enable`
- Install dependencies: `pnpm install --frozen-lockfile --ignore-scripts` -- takes 100 seconds. NEVER CANCEL. Set timeout to 180+ seconds.

### Build, Test, and Lint

- Lint all projects: `pnpm nx run-many --target=lint --all --parallel=3` -- takes 1 second
- Build all projects: `pnpm nx run-many --target=build --all --parallel=3` -- takes 1 second
- Test all projects: `pnpm nx run-many --target=test --all --parallel=2` -- takes 1 second
- **CRITICAL**: Nx Cloud connectivity will fail in sandbox environments - this is expected and does not affect builds
- **NEVER CANCEL**: All commands complete quickly but always set timeouts of 300+ seconds for safety
- **Build Outputs**: Nx uses intelligent caching - builds may not always create visible dist folders but still succeed

### Working with Specific Projects

- **Discover projects**: `pnpm nx show projects`
- **Project details**: `pnpm nx show project <project-name>`
- Build specific project: `pnpm nx build <project-name>`
- Test specific project: `pnpm nx test <project-name>`
- Serve development server: `pnpm nx serve <project-name>`
- Generate project graph: `pnpm nx graph --file=graph.json`

### Affected Commands (requires git history)

- Test affected: `pnpm nx affected:test`
- Build affected: `pnpm nx affected:build`
- Lint affected: `pnpm nx affected:lint`
- **Note**: `affected` commands require proper git base branch setup

## Validation

### Essential Pre-commit Validation

Always run these commands before committing changes:

1. `pnpm nx run-many --target=lint --all --parallel=3` -- NEVER CANCEL. Set timeout to 300+ seconds.
2. `pnpm nx run-many --target=test --all --parallel=2` -- NEVER CANCEL. Set timeout to 300+ seconds.
3. `pnpm nx run-many --target=build --all --parallel=3` -- NEVER CANCEL. Set timeout to 300+ seconds.

**Note**: Look for "Successfully ran target" messages - ignore exit code 1 caused by Nx Cloud warnings.

### Manual Testing Scenarios

After making changes to applications, manually test by:

**React Applications (chore-board-ui)**:

- Build and validate: `pnpm nx build chore-board-ui`
- The chore board features drag-and-drop columns (To-Do, In-Progress, Done) with assignee circles
- Test that build completes without errors (serve may fail in sandbox environments)

**Angular Applications (ng-example)**:

- Build and validate: `pnpm nx build ng-example`
- Contains Nx welcome component with example commands and documentation
- Test that build completes without errors (serve may fail in sandbox environments)

**Node.js Services (campsite-watcher)**:

- Build and validate: `pnpm nx build campsite-watcher`
- Service monitors campsite availability and sends email notifications
- Test service functionality: `pnpm nx serve campsite-watcher` (if environment supports it)

**Docker Builds**:

- Build Docker images: `pnpm nx docker-build campsite-watcher`
- Requires Docker daemon to be running
- Validates that containerized applications can be packaged correctly

### CI Validation

The GitHub Actions CI (.github/workflows/main.yml) will fail if:

- Linting errors exist
- Tests fail
- Builds fail
- Docker builds fail (for apps with docker-build target)

## Common Tasks

### Discovering Repository Structure

**Always use these commands to discover current projects and structure:**

- List all projects: `pnpm nx show projects`
- View project dependencies: `pnpm nx graph --file=graph.json`
- Explore apps directory: `find apps -maxdepth 3 -type d | head -20`
- Explore libs directory: `find libs -maxdepth 3 -type d | head -20`
- Get project details: `pnpm nx show project <project-name>`

**Example Repository Structure** (use discovery commands above for current state):

```
apps/
├── auth/                   # Authentication services
├── campsite-watcher/       # Node.js application with Docker
├── chore-board/            # React UI and NestJS API
├── ng/example/             # Angular example app
└── nx-kaniko/              # Docker build utilities

libs/
├── campsite-watcher/       # Shared campsite watcher libraries
├── ng/                     # Angular shared libraries
└── wordle/                 # Wordle game library
```

### Key Configuration Files

- `package.json` - Main workspace dependencies and scripts
- `nx.json` - Nx workspace configuration
- `tsconfig.base.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `.nvmrc` - Node.js version specification (v24.4.1)

### Project Discovery and Commands

**Use these commands to discover current projects (structure changes as repository evolves):**

- `pnpm nx show projects` - Lists all current projects
- `pnpm nx show project <name>` - Shows details for a specific project
- `pnpm nx graph --file=graph.json` - Generates dependency graph

**Example Projects** (use `pnpm nx show projects` for current complete list):

- React Applications: `chore-board-ui` (drag-drop kanban board)
- Angular Applications: `ng-example` (welcome components)
- Node.js Services: `campsite-watcher` (monitoring service)
- NestJS APIs: `chore-board-api`, `auth-api-nest`
- Express APIs: `auth-api-express`
- AWS Lambda: `campsite-watcher-lambda`
- Libraries: `campsite-watcher-core`, `wordle-core`, `ng-lib-example`

### Workspace Commands Reference

```bash
# Environment (choose one)
# Option 1: nvm
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use
# Option 2: fnm
fnm use

corepack enable

# Dependencies (NEVER CANCEL - 100 seconds)
pnpm install --frozen-lockfile --ignore-scripts

# Development (1 second each)
pnpm nx run-many --target=lint --all --parallel=3
pnpm nx run-many --target=test --all --parallel=2
pnpm nx run-many --target=build --all --parallel=3

# Project specific
pnpm nx serve chore-board-ui
pnpm nx serve ng-example
pnpm nx build campsite-watcher
pnpm nx docker-build campsite-watcher

# Utilities
pnpm nx graph --file=graph.json
pnpm nx show projects
pnpm nx show project <project-name>
```

## Troubleshooting

### Common Issues

1. **Nx Cloud errors**: Expected in sandbox environments - commands still succeed despite exit code 1
2. **Serve commands failing**: Apps may not serve in sandbox but builds work fine
3. **Missing dist folder**: Builds use intelligent caching - success doesn't always create visible dist folders
4. **Node version mismatch**: Always use `nvm use` (for nvm) or `fnm use` (for fnm) in each session to ensure correct Node.js version
5. **Package manager not found**: Run `corepack enable` after Node.js setup
6. **Exit code 1 with successful output**: Nx Cloud warnings cause non-zero exit codes but operations succeed

### Environment Variables

- `NX_CLOUD_DISTRIBUTED_EXECUTION=false` - Disables cloud execution
- `NODE_ENV` - Set to production/development as needed

### Docker Requirements

- Docker daemon must be running for `docker-build` targets
- Some apps have Dockerfile in their project directory
- Release configurations available for containerized apps

## Development Standards

### Commit Message Format

This repository follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard for commit messages. All commits must use the format:

```
<type>: <description>

[optional body]

[optional footer(s)]
```

**Common commit types:**

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring without changing functionality
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks, dependency updates
- `ci:` - Changes to CI/CD configuration
- `perf:` - Performance improvements

**Examples:**

```bash
feat: add user authentication to chore-board-api
fix: resolve memory leak in campsite-watcher service
docs: update API documentation for auth endpoints
chore: update dependencies to latest versions
```

## Styling with Tailwind CSS

**This workspace strongly encourages and defaults to Tailwind CSS for all styling needs.** Tailwind CSS is the primary styling framework and should be used for all new UI components and applications.

### Why Tailwind CSS

- **Consistency**: Provides a unified design system across all applications
- **Developer Experience**: Excellent IntelliSense and autocompletion support
- **Performance**: Optimized build output with unused CSS purging
- **Maintainability**: Utility-first approach reduces custom CSS maintenance
- **Team Productivity**: Rapid prototyping and development

### Framework-Specific Setup

#### React Applications (Recommended Pattern)

For React applications, use the established pattern from `chore-board-ui`:

**tailwind.config.js:**

```javascript
const { join } = require('path');
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [join(__dirname, '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'), ...createGlobPatternsForDependencies(__dirname)],
  theme: {
    extend: {
      // Add custom theme extensions here
    },
  },
  plugins: [
    // Add plugins as needed
  ],
};
```

**postcss.config.js:**

```javascript
const { join } = require('path');

module.exports = {
  plugins: {
    tailwindcss: {
      config: join(__dirname, 'tailwind.config.js'),
    },
    autoprefixer: {},
  },
};
```

#### Angular Applications

For Angular applications, use the pattern from `ng-example`:

**tailwind.config.js:**

```javascript
const { join } = require('path');
const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');

module.exports = {
  content: [join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'), ...createGlobPatternsForDependencies(__dirname)],
  theme: {
    extend: {
      // Add custom theme extensions here
    },
  },
  plugins: [],
};
```

### Current Custom Theme Extensions

The workspace includes several custom theme extensions that should be leveraged:

```javascript
// Available custom utilities (from chore-board-ui)
theme: {
  extend: {
    backgroundImage: {
      checkered: 'repeating-conic-gradient(black 0% 25%, transparent 0% 50%) 50% / 40px 40px',
    },
    gridTemplateAreas: {
      scramble: ['nav  main  finnish', 'footer footer footer'],
    },
    gridTemplateColumns: {
      scramble: 'auto 2fr auto',
    },
    gridTemplateRows: {
      scramble: ` 1fr
                  auto`,
    },
  },
},
plugins: [require('@savvywombat/tailwindcss-grid-areas')],
```

### Tailwind CSS Best Practices

#### Component Styling Guidelines

**Use Tailwind classes directly in components:**

```tsx
// ✅ Preferred approach
export const Button = ({ children, variant = 'primary' }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
  };

  return <button className={`${baseClasses} ${variantClasses[variant]}`}>{children}</button>;
};
```

**For complex conditional styling, use clsx or similar:**

```tsx
import clsx from 'clsx';

const buttonClasses = clsx('px-4 py-2 rounded-md font-medium', {
  'bg-blue-600 text-white': variant === 'primary',
  'bg-gray-200 text-gray-900': variant === 'secondary',
  'opacity-50 cursor-not-allowed': disabled,
});
```

#### Responsive Design Patterns

```tsx
// Use Tailwind's responsive utilities
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="p-4 sm:p-6 lg:p-8">
    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Responsive Content</h2>
  </div>
</div>
```

#### Custom Component Classes

When creating reusable patterns, define them in your Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
    },
  },
};
```

### Available Plugins

The workspace includes these Tailwind plugins:

- **@savvywombat/tailwindcss-grid-areas**: Enables CSS Grid Areas with Tailwind utilities
  - Use `grid-areas-{name}` and `grid-in-{area}` classes
  - Example: `grid-areas-scramble grid-in-nav`

### Integration with Development Tools

#### Prettier Integration

The workspace includes `prettier-plugin-tailwindcss` for automatic class sorting:

- Classes are automatically sorted in recommended order
- No manual class organization needed
- Consistent class order across the codebase

#### IntelliSense Setup

For optimal development experience, ensure your IDE has:

- Tailwind CSS IntelliSense extension installed
- Proper configuration for class name completion
- Hover previews for utility classes

### Validation Commands

When working with Tailwind CSS applications:

```bash
# Build and validate Tailwind compilation
pnpm nx build chore-board-ui
pnpm nx build ng-example

# Serve with hot reload (if environment supports)
pnpm nx serve chore-board-ui
pnpm nx serve ng-example

# Test applications using Tailwind
pnpm nx test chore-board-ui
pnpm nx test ng-example
```

### Migration from Other CSS Approaches

When working with existing components:

1. **Gradual Migration**: Convert components to Tailwind CSS incrementally
2. **Preserve Functionality**: Ensure visual parity during migration
3. **Remove Custom CSS**: Delete unused CSS files after Tailwind migration
4. **Update Tests**: Verify component tests still pass after styling changes

### Common Patterns in This Workspace

**Grid Layout with Areas:**

```tsx
<div className="grid-areas-scramble grid-cols-scramble grid-rows-scramble grid h-screen">
  <nav className="grid-in-nav">Navigation</nav>
  <main className="grid-in-main">Content</main>
  <footer className="grid-in-footer">Footer</footer>
</div>
```

**Assignee Circles:**

```tsx
const person = {
  bgColor: 'bg-cyan-400',
  borderColor: 'border-cyan-400',
};
```

**Dark Theme Patterns:**

```tsx
<nav className="bg-slate-900 text-white">
  <div className="bg-slate-200">Light content area</div>
</nav>
```

## Important Notes

- **ALWAYS** validate changes with lint, test, and build before committing
- **NEVER CANCEL** long-running commands - they complete quickly but use safety timeouts
- Nx Cloud connectivity issues are expected in sandbox environments
- Use `pnpm` not `npm` or `yarn` for all package management
- Node.js v24.4.1 is required (use nvm or fnm to install/switch)
- Projects may have interdependencies - use `nx graph` to visualize
- **Repository structure evolves** - always use discovery commands (`pnpm nx show projects`, `find apps libs -maxdepth 3 -type d`) rather than relying on static lists in documentation

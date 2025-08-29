# Garage - Nx Monorepo

Garage is an Nx monorepo containing multiple applications and libraries including React UIs, Angular apps, Node.js services, NestJS APIs, and AWS Lambda functions. The workspace uses pnpm for package management and supports Docker containerization for deployment.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

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

## Important Notes
- **ALWAYS** validate changes with lint, test, and build before committing
- **NEVER CANCEL** long-running commands - they complete quickly but use safety timeouts
- Nx Cloud connectivity issues are expected in sandbox environments
- Use `pnpm` not `npm` or `yarn` for all package management
- Node.js v24.4.1 is required (use nvm or fnm to install/switch)
- Projects may have interdependencies - use `nx graph` to visualize
- **Repository structure evolves** - always use discovery commands (`pnpm nx show projects`, `find apps libs -maxdepth 3 -type d`) rather than relying on static lists in documentation